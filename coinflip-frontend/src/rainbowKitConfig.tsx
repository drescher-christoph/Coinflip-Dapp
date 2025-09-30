"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import {sepolia, baseSepolia, arbitrumSepolia, optimismSepolia} from "wagmi/chains"

export default getDefaultConfig({
    appName: "TSender",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    chains: [sepolia, baseSepolia, arbitrumSepolia, optimismSepolia],
    ssr: false
})