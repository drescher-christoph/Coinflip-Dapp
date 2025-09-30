// Layout of Contract:
// version
// imports
// errors
// interfaces, libraries, contracts
// Type declarations
// State variables
// Events
// Modifiers
// Functions

// Layout of Functions:
// constructor
// receive function (if exists)
// fallback function (if exists)
// external
// public
// internal
// private
// internal & private view & pure functions
// external & public view & pure functions

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

error Presale__FeeTransferFailed();

contract Coinflip is VRFConsumerBaseV2Plus {
    struct Bet {
        address player;
        uint256 amount;
        bool guess;
    }

    uint256 public s_profit;
    uint256 public s_loss;
    uint256 public s_feesCollected;

    mapping(uint256 betId => Bet bet) public s_bets;

    address immutable i_owner;
    uint256 immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    uint256 private constant BPS_DENOMINATOR = 10_000;
    uint256 public constant i_feeBps = 200; // 2% fee

    event BetPlaced(
        uint256 indexed betId,
        address indexed player,
        uint256 amount,
        bool guess
    );
    event BetResult(
        uint256 indexed betId,
        address indexed player,
        uint256 amountIn,
        uint256 amountOut,
        bool won
    );
    event FundsReceived(address indexed sender, uint256 amount);

    constructor(
        uint256 subscriptionId,
        address vrfCoordinatorV2,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        address owner_address
    ) VRFConsumerBaseV2Plus(vrfCoordinatorV2) {
        i_subscriptionId = subscriptionId;
        i_owner = owner_address;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
    }

    ///////////////////////
    // Receive Functions///
    ///////////////////////

    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    modifier OnlyOwner() {
        require(msg.sender == i_owner, "Only owner can call this function");
        _;
    }

    function flip(bool _guess) external payable returns (uint256 requestId) {
        require(msg.value > 0, "Bet amount must be greater than zero");

        VRFV2PlusClient.RandomWordsRequest memory req = VRFV2PlusClient
            .RandomWordsRequest({
                keyHash: i_gasLane,
                subId: i_subscriptionId,
                requestConfirmations: REQUEST_CONFIRMATIONS,
                callbackGasLimit: i_callbackGasLimit,
                numWords: NUM_WORDS,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            });

        requestId = s_vrfCoordinator.requestRandomWords(req);

        s_bets[requestId] = Bet({
            player: msg.sender,
            amount: msg.value,
            guess: _guess
        });

        emit BetPlaced(requestId, msg.sender, msg.value, _guess);
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {
        Bet memory betData = s_bets[requestId];
        require(betData.amount > 0, "No bet found");

        bool result = (randomWords[0] % 2) == 0; // true for heads, false for tails
        bool won = (result == betData.guess);
        uint256 payout = 0;
        if (won) {
            uint256 grossPayout = betData.amount * 2;
            uint256 fee = (grossPayout * i_feeBps) / BPS_DENOMINATOR;
            payout = grossPayout - fee;

            s_loss += (payout - betData.amount);
            s_feesCollected += fee;
            delete s_bets[requestId];

            (bool success, ) = betData.player.call{value: payout}("");
            require(success, "Payout failed");
        } else {
            s_profit += betData.amount;
        }

        emit BetResult(requestId, betData.player, betData.amount, payout, won);

        delete s_bets[requestId];
    }

    function withdraw() external OnlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(i_owner).transfer(balance);
    }

    function withdrawFees(uint256 _feesToWithdraw) external OnlyOwner {
        require(s_feesCollected >= _feesToWithdraw, "Not enough fees collected");
        s_feesCollected -= _feesToWithdraw;
        payable(i_owner).transfer(_feesToWithdraw);
    }
}
