import React from "react";
import useBetData from "../hooks/useBetData";
import { ethers } from "ethers";

export const StatsTable = () => {
  const {
    data: betResults,
    isLoading: isBetResultsLoading,
    error: betResultsError,
  } = useBetData();

  console.log(
    "Bet results from subgraph:",
    betResults,
    isBetResultsLoading,
    betResultsError
  );
  return (
    <div className="flex flex-col items-center pt-6 w-full">
      <h2 className="text-3xl font-bold pt-6">Recent Bets</h2>
      <div className="max-h-96 overflow-y-auto">
        {isBetResultsLoading ? (
          <p>Loading...</p>
        ) : betResultsError ? (
          <p>Error loading bet results</p>
        ) : betResults && betResults.length > 0 ? (
          <table className="mt-4 w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="border px-4 py-2">Player</th>
                <th className="border px-4 py-2">Amount In (ETH)</th>
                <th className="border px-4 py-2">Amount Out (ETH)</th>
                <th className="border px-4 py-2">Won</th>
                <th className="border px-4 py-2">Block</th>
              </tr>
            </thead>
            <tbody>
              {betResults.map((bet) => (
                <tr key={bet.id} className="text-center">
                  <td className="border px-4 py-2">
                    {bet.player.slice(0, 6) + "..." + bet.player.slice(-4)}
                  </td>
                  <td className="border px-4 py-2">
                    {ethers.formatUnits(bet.amountIn)}
                  </td>
                  <td className="border px-4 py-2">
                    {ethers.formatUnits(bet.amountOut)}
                  </td>
                  <td
                    className={`border px-4 py-2 font-bold ${
                      bet.won ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {bet.won ? "Yes" : "No"}
                  </td>
                  <td className="border px-4 py-2">{bet.blockNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No bets found</p>
        )}
      </div>
    </div>
  );
};

export default StatsTable;
