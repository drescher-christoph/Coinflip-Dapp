"use client";

import { useEffect, useState } from "react";

export default function CoinFlip() {
  const [frameIdx, setFrameIdx] = useState(0); // von 0 bis 6

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIdx((prev) => (prev + 1) % 7); // modulo 7 → zurück auf 0
    }, 100); // alle 100ms ein neues Bild

    return () => clearInterval(interval);
  }, []);

  return (
    <img
      src={`/coin/${frameIdx + 1}.png`}
      alt="Coin"
      width={200}
      height={200}
    />
  );
}