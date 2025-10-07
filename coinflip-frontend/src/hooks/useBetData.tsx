import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { useState } from "react";
import { useChainId } from "wagmi";
import { chainsToSubgraph } from "../constants";

const TOKEN = process.env.NEXT_PUBLIC_GRAPHQL_TOKEN!;

interface BetResult {
  id: string;
  betId: string;
  player: string;
  amountIn: string;
  amountOut: string;
  won: boolean;
  blockNumber: number;
  blockTimestamp: number;
}

const GET_BET_RESULTS_QUERY = gql`
  {
    betResults(first: 5, orderBy: blockTimestamp, orderDirection: desc) {
      id
      betId
      player
      amountIn
      amountOut
      won
      blockNumber
      blockTimestamp
    }
  }
`;

export default function useBetData() {
  const chainId = useChainId();
  const URL = chainsToSubgraph[chainId].url;
  return useQuery({
    queryKey: ["betResults"],
    queryFn: async () => {
      const res = await request<{ betResults: BetResult[] }>(
        URL,
        GET_BET_RESULTS_QUERY,
        {},
        {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        }
      );
      return res.betResults;
    },
    staleTime: 60 * 100,
  });
}
