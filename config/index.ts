import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

export const wagmiConfig = createConfig({
    chains: [base, baseSepolia],
    transports: {
      [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || ""),
      [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || ""),
    },
  });