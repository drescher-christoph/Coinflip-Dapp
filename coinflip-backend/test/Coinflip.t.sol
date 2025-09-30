//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console2, Vm} from "forge-std/Test.sol";
import {Coinflip} from "../src/Coinflip.sol";
import {VRFCoordinatorV2_5Mock} from "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";
import {HelperConfig} from "../script/HelperConfig.s.sol";
import {DeployCoinflip} from "../script/DeployCoinflip.s.sol";
import {LinkToken} from "../test/mocks/LinkToken.sol";
import {CodeConstants} from "../script/HelperConfig.s.sol";

contract CoinflipTest is Test, CodeConstants {
    Coinflip public coinflip;
    HelperConfig public helperConfig;

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

    uint256 subscriptionId;
    bytes32 gasLane;
    uint32 callbackGasLimit;
    address vrfCoordinatorV2_5;
    LinkToken link;

    address owner = address(1);
    address player = address(2);
    address player1 = address(3);
    address player2 = address(4);
    address player3 = address(5);
    address player4 = address(6);
    uint256 public constant STARTING_USER_BALANCE = 10 ether;
    uint256 public constant LINK_BALANCE = 100 ether;

    modifier flipped(address _player, uint256 _betAmount, bool _guess) {
        vm.prank(_player);
        uint256 requestId = coinflip.flip{value: _betAmount}(_guess);
        VRFCoordinatorV2_5Mock(vrfCoordinatorV2_5).fulfillRandomWords(
            requestId,
            address(coinflip)
        );
        _;
    }

    function setUp() public {
        DeployCoinflip deployer = new DeployCoinflip();
        (coinflip, helperConfig) = deployer.runLocal();
        vm.deal(player, STARTING_USER_BALANCE);
        vm.deal(player1, STARTING_USER_BALANCE);
        vm.deal(player2, STARTING_USER_BALANCE);
        vm.deal(player3, STARTING_USER_BALANCE);
        vm.deal(player4, STARTING_USER_BALANCE);
        vm.deal(address(coinflip), 100 ether);

        HelperConfig.NetworkConfig memory config = helperConfig.getConfig();
        subscriptionId = config.subscriptionId;
        gasLane = config.gasLane;
        callbackGasLimit = config.callbackGasLimit;
        vrfCoordinatorV2_5 = config.vrfCoordinatorV2_5;
        link = LinkToken(config.link);

        vm.startPrank(msg.sender);
        if (block.chainid == LOCAL_CHAIN_ID) {
            link.mint(msg.sender, LINK_BALANCE);
            VRFCoordinatorV2_5Mock(vrfCoordinatorV2_5).fundSubscription(
                subscriptionId,
                LINK_BALANCE
            );
        }
        link.approve(vrfCoordinatorV2_5, LINK_BALANCE);
        vm.stopPrank();
    }

    function testCoinflipFunded() public view {
        assert(address(coinflip).balance > 0);
        assert(address(coinflip).balance == 100 ether);
    }

    function testFeeCollected() public {
        vm.prank(player);
        uint256 requestId = coinflip.flip{value: 1}(false);
        VRFCoordinatorV2_5Mock(vrfCoordinatorV2_5).fulfillRandomWords(
            requestId,
            address(coinflip)
        );
        console2.log("Fees collected:", coinflip.s_feesCollected());
        assertLt(0, coinflip.s_feesCollected());
    }

    function testFlip() public flipped(player, 1 ether, true) {

        uint256 balanceAfter = player.balance;

        // Erwartet: entweder +1 oder -1
        bool valid = (balanceAfter == STARTING_USER_BALANCE + 1 ether) ||
            (balanceAfter == STARTING_USER_BALANCE - 1 ether);

        assertTrue(valid, "Balance muss Gewinn oder Verlust sein");
    }

    function testBetPlacedEvent() public {
        vm.prank(player);

        vm.expectEmit(false, true, false, true);
        emit BetPlaced(0, player, 1 ether, true);
        // die 0 für requestId ist egal, weil du nicht alle Felder prüfen musst

        coinflip.flip{value: 1 ether}(true);
    }

    function testBetResultEmitted() public {
        vm.prank(player);
        uint256 requestId = coinflip.flip{value: 1 ether}(true);

        vm.expectEmit(false, true, false, false);
        emit BetResult(0, player, 1 ether, 2 ether, true);
        VRFCoordinatorV2_5Mock(vrfCoordinatorV2_5).fulfillRandomWords(
            requestId,
            address(coinflip)
        );
    }

}

// IMPORTANT: NEED TO FUND COINFLIP CONTRACT BEFORE TESTING (in case payout wins -> no funds to pay out)
