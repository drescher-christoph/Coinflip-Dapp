"use client";

import Image from "next/image";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import CoinFlip from "@/components/CoinFlip";
import { useState } from "react";

export default function Home() {
  const { isConnected } = useAccount();
  const [betGuess, setBetGuess] = useState<boolean | null>(null); // true = head, false = tail, null = no bet
  const [betAmount, setBetAmount] = useState<number | null>(null); // in ETH
  const quickAmounts = [0.001, 0.0025, 0.005]; // in ETH

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4 text-white">
        {isConnected ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-5xl font-bold">Double or Nothing!</h2>
            <CoinFlip />
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
              onClick={() => {console.log("Flip the coin!")}}
              className={`rounded-full border-2 text-2xl border-white px-4 py-2 font-bold transition-colors duration-200 ${
                betGuess !== null &&
                betAmount !== null &&
                "bg-green-800 text-white hover:bg-[#FFB000]"
              }`}
            >
              Flip!
            </button>
            <h1>Result: Head</h1>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <h1 className="text-2xl font-bold">
              Please connect your wallet to start gambling
            </h1>
            <Image
              src="/leprechaun/leprechaun2.png"
              alt="Leprechaun2"
              width={160}
              height={160}
              priority
            />
            <ConnectButton />
          </div>
        )}
      </div>
    </main>
  );
}
