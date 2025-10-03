"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import {sepolia, baseSepolia, arbitrumSepolia, optimismSepolia, polygonAmoy} from "wagmi/chains"

export default getDefaultConfig({
    appName: "TSender",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    chains: [sepolia, arbitrumSepolia, optimismSepolia],
    ssr: false
})