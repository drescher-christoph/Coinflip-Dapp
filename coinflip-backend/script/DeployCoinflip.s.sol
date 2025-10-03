//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {Coinflip} from "../src/Coinflip.sol";
import {HelperConfig} from "./HelperConfig.s.sol";
import { CreateSubscription, AddConsumer, FundSubscription } from "./Interactions.s.sol";

contract DeployCoinflip is Script {

    HelperConfig helperConfig = new HelperConfig();
    AddConsumer addConsumer = new AddConsumer();
    
    uint256 subscriptionId = 88327719654090601921142408330809092623891282954460433220602055828137472325064;
    address vrfCoordinatorV2 = 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B;
    bytes32 gasLane = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    uint32 callBackGasLimit = 250000;
    address owner_address = 0xF87FF5BB6A8dD6F97307d61605D838ea7e22E3e6;

    // Arbitrum Sepolia
    uint256 arbSubscriptionId = 85996164725439192785575018397926566260373797817144171741979805287196750157280;
    address arbVrfCoordinatorV2 = 0x5CE8D5A2BC84beb22a398CCA51996F7930313D61;
    bytes32 arbGasLane = 0x1770bdc7eec7771f7ba4ffd640f34260d7f095b79c92d34a5b2551d6f6cfd2be;

    // Optimism Sepolia
    uint256 opSubscriptionId = 94853400668923125398722633679513434497026055395569551681467756146720114742401;
    address opVrfCoordinatorV2 = 0x02667f44a6a44E4BDddCF80e724512Ad3426B17d;
    bytes32 opGasLane = 0xc3d5bc4d5600fa71f7a50b9ad841f14f24f9ca4236fd00bdb5fda56b052b28a4;

    function run() external returns (Coinflip) {
        vm.startBroadcast();
        Coinflip coinflip = new Coinflip(
            opSubscriptionId,
            opVrfCoordinatorV2,
            opGasLane,
            callBackGasLimit,
            owner_address
        );
        vm.stopBroadcast();
        console2.log("Coinflip deployed to:", address(coinflip));
        return coinflip;
    }

    function runLocal() external returns (Coinflip, HelperConfig) {
        HelperConfig.NetworkConfig memory config = helperConfig.getConfig();

        if (config.subscriptionId == 0) {
            CreateSubscription createSubscription = new CreateSubscription();
            (config.subscriptionId, config.vrfCoordinatorV2_5) =
                createSubscription.createSubscription(config.vrfCoordinatorV2_5, config.account);

            FundSubscription fundSubscription = new FundSubscription();
            fundSubscription.fundSubscription(
                config.vrfCoordinatorV2_5, config.subscriptionId, config.link, config.account
            );

            helperConfig.setConfig(block.chainid, config);
        }
        
        Coinflip coinflip = new Coinflip(
            config.subscriptionId,
            config.vrfCoordinatorV2_5,
            config.gasLane,
            config.callbackGasLimit,
            config.account
        );
        console2.log("Coinflip deployed to:", address(coinflip));

        addConsumer.addConsumer(address(coinflip), config.vrfCoordinatorV2_5, config.subscriptionId, config.account);
        return (coinflip, helperConfig);
    }
}