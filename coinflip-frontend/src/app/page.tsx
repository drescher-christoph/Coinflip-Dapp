"use client";

import Image from "next/image";
import {
  useAccount,
  useChainId,
  useWriteContract,
  useWatchContractEvent,
  usePublicClient,
} from "wagmi";
import { decodeEventLog } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import CoinFlip from "@/components/CoinFlip";
import { coinflipAbi, chainsToCoinflip } from "@/constants";
import { useState } from "react";
import { ethers } from "ethers";
import Confetti from "react-confetti";

type BetPlacedArgs = {
  betId: bigint;
  player: `0x${string}`;
  amount: bigint;
  guess: boolean;
};

function isBetPlacedArgs(args: unknown): args is BetPlacedArgs {
  if (!args || typeof args !== "object") {
    return false;
  }

  const candidate = args as Record<string, unknown>;
  return (
    typeof candidate.betId === "bigint" &&
    typeof candidate.player === "string" &&
    (candidate.player as string).startsWith("0x") &&
    typeof candidate.amount === "bigint" &&
    typeof candidate.guess === "boolean"
  );
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [betGuess, setBetGuess] = useState<boolean | null>(null); // true = head, false = tail, null = no bet
  const [betAmount, setBetAmount] = useState<number | null>(null); // in ETH
  const [currentRequestId, setCurrentRequestId] = useState<bigint | null>(null);
  const [betResult, setBetResult] = useState<null | {
    won: boolean;
    amountOut: bigint;
  }>(null);
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const quickAmounts = [0.001, 0.0025, 0.005]; // in ETH

  useWatchContractEvent({
    address: chainsToCoinflip[chainId]?.contract as `0x${string}`,
    abi: coinflipAbi,
    eventName: "BetResult",
    onLogs: (logs) => {
      logs.forEach((log) => {
        if ("args" in log) {
          const args = log.args as {
            betId: bigint;
            player: `0x${string}`;
            amountIn: bigint;
            amountOut: bigint;
            won: boolean;
          };

          // direkt zugreifen:
          console.log("Bet ID:", args.betId.toString());
          console.log("Player:", args.player);
          console.log("Amount In (ETH):", Number(args.amountIn) / 1e18);
          console.log("Amount Out (ETH):", Number(args.amountOut) / 1e18);
          console.log("Won?", args.won);

          console.log("Current Request ID:", currentRequestId?.toString());
          console.log("Log Bet ID:", args.betId.toString());
          if (currentRequestId && args.betId === currentRequestId) {
            console.log("Success!");
            setIsLoading(false);
            setBetResult({ won: args.won, amountOut: args.amountOut });
          }
        } else {
          console.warn("Log does not contain args:", log);
        }
      });
    },
  });

  async function flipCoin() {
    setBetResult(null);
    setIsLoading(true);
    try {
      if (!address) {
        throw new Error("Wallet address is not available");
      }

      const coinflipAddress = chainsToCoinflip[chainId]?.contract;
      if (!coinflipAddress) {
        throw new Error(`No coinflip contract configured for chain ${chainId}`);
      }

      const txHash = await writeContractAsync({
        abi: coinflipAbi,
        address: coinflipAddress as `0x${string}`,
        functionName: "flip",
        args: [betGuess],
        value: betAmount ? BigInt(betAmount * 1e18) : BigInt(0),
      });

      console.log("Transaction hash:", txHash);

      if (!publicClient) {
        throw new Error("publicClient is not defined");
      }

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      const betPlacedLog = receipt.logs.find((log) => {
        if (log.address.toLowerCase() !== coinflipAddress.toLowerCase()) {
          return false;
        }

        try {
          const decoded = decodeEventLog({
            abi: coinflipAbi,
            data: log.data,
            topics: log.topics,
          });

          if (
            decoded.eventName !== "BetPlaced" ||
            !isBetPlacedArgs(decoded.args)
          ) {
            return false;
          }

          return decoded.args.player.toLowerCase() === address.toLowerCase();
        } catch (error) {
          console.error("Error decoding log:", error);
          return false;
        }
      });

      if (!betPlacedLog) {
        throw new Error("BetPlaced log not found in receipt");
      }

      const decoded = decodeEventLog({
        abi: coinflipAbi,
        data: betPlacedLog.data,
        topics: betPlacedLog.topics,
      });

      if (!isBetPlacedArgs(decoded.args)) {
        throw new Error("BetPlaced log args missing expected fields");
      }

      setCurrentRequestId(decoded.args.betId);
      console.log("Current request ID set to:", decoded.args.betId.toString());
    } catch (error) {
      console.error("Error flipping coin:", error);
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6">
      <div className="flex flex-col items-center gap-4 text-white">
        {isConnected ? (
          <div className="flex flex-col items-center gap-4 text-center">
            {betResult && betResult.won && <Confetti width={window.innerWidth} height={window.innerHeight} />}
            <h2 className="text-5xl font-bold">
              {!isLoading && betResult == null ? "Double or Nothing!" : isLoading && "What will it be?"}
            </h2>
            {betResult ? (
              <div>
                <h2 className="text-5xl text-white">
                  {betResult.won
                    ? "Congratulations!"
                    : "Better luck next time!"}
                </h2>
                <h2 className="text-7xl text-[#FFB000] py-4">
                  {betResult.won
                    ? "You`ve won " +
                      ethers.formatUnits(betResult.amountOut) +
                      " ETH"
                    : "Try again and turn it around!"}
                </h2>
                {betResult.won && (
                  <h2 className="text-5xl text-white pb-4">
                    Double or Nothing? Wanna try again?
                  </h2>
                )}
              </div>
            ) : isLoading && !betResult ? (
              <CoinFlip />
            ) : (
              <img src={`/coin/1.png`} alt="Coin" width={200} height={200} />
            )}
            {!isLoading && (
              <>
                <div className="flex flex-row items-center justify-center gap-2">
                  <button
                    onClick={() => setBetGuess(true)}
                    className={`rounded-full border-2 border-white px-4 py-2 font-bold transition-colors duration-200 ${
                      betGuess === true
                        ? "bg-white text-green-800"
                        : "bg-transparent text-white hover:bg-white hover:text-green-800"
                    }`}
                  >
                    Head
                  </button>
                  <button
                    onClick={() => setBetGuess(false)}
                    className={`rounded-full border-2 border-white px-4 py-2 font-bold transition-colors duration-200 ${
                      betGuess === false
                        ? "bg-white text-green-800"
                        : "bg-transparent text-white hover:bg-white hover:text-green-800"
                    }`}
                  >
                    Tail
                  </button>
                </div>
                <div className="flex flex-row items-center justify-center gap-2">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setBetAmount(amount)}
                      className={`rounded-full border-2 border-white px-4 py-2 font-bold transition-colors duration-200 ${
                        betAmount === amount
                          ? "bg-white text-green-800"
                          : "bg-transparent text-white hover:bg-white hover:text-green-800"
                      }`}
                    >
                      {amount} ETH
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => flipCoin()}
                  className={`rounded-full border-2 text-2xl border-white px-4 py-2 font-bold transition-colors duration-200 ${
                    betGuess !== null &&
                    betAmount !== null &&
                    "bg-green-800 text-white hover:bg-[#FFB000]"
                  }`}
                >
                  Flip!
                </button>
              </>
            )}
            {betResult && betResult.won ? (
              <Image
                src="/leprechaun/leprechaun3.png"
                alt="Leprechaun happy"
                width={520}
                height={520}
                priority
                className="z-[-1] pointer-events-none absolute bottom-[-150px] left-6 max-w-none select-none drop-shadow-[0_0_30px_rgba(0,0,0,0.45)]"
              />
            ) : betResult && betResult.won === false ? (
              <Image
                src="/leprechaun/leprechaun4.png"
                alt="Leprechaun dissapointed"
                width={520}
                height={520}
                priority
                className="z-[-1] pointer-events-none absolute bottom-[-150px] left-6 max-w-none select-none drop-shadow-[0_0_30px_rgba(0,0,0,0.45)]"
              />
            ) : isLoading ? (
              <Image
                src="/leprechaun/leprechaun5.png"
                alt="Leprechaun dissapointed"
                width={520}
                height={520}
                priority
                className="z-[-1] pointer-events-none absolute bottom-[-150px] left-6 max-w-none select-none drop-shadow-[0_0_30px_rgba(0,0,0,0.45)]"
              />
            ) : (
              <Image
                src="/leprechaun/leprechaun.png"
                alt="Leprechaun zückt die Münze"
                width={520}
                height={520}
                priority
                className="z-[-1] pointer-events-none absolute bottom-[-150px] left-6 max-w-none select-none drop-shadow-[0_0_30px_rgba(0,0,0,0.45)]"
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <h1 className="text-2xl font-bold">
              Please connect your wallet to start gambling
            </h1>
            <ConnectButton />
          </div>
        )}
      </div>
      {!isConnected && (
        <Image
          src="/leprechaun/leprechaun2.png"
          alt="Leprechaun zückt die Münze"
          width={520}
          height={520}
          priority
          className="pointer-events-none absolute bottom-[-150px] right-6 max-w-none select-none drop-shadow-[0_0_30px_rgba(0,0,0,0.45)]"
        />
      )}
    </main>
  );
}
