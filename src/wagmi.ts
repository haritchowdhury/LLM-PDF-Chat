import { http, createConfig } from "wagmi";
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from "wagmi/chains";
import { hardhatChain } from "./localchains";
import { eduTestnetChain } from "./testchains";
import { injected, metaMask, safe, walletConnect } from "wagmi/connectors";
import { getChainId } from "@wagmi/core";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

//const projectId = process.env.NEXT_PUBLIC_RAINBOW_PROJECT_ID;
export const config = createConfig({
  chains: [/*eduTestnetChain, */ hardhatChain, sepolia],
  connectors: [metaMask()],
  transports: {
    /* [eduTestnetChain.id]: http("https://rpc.open-campus-codex.gelato.digital"), */
    [hardhatChain.id]: http("http://127.0.0.1:8545/"),
    [sepolia.id]: http(
      "https://eth-sepolia.g.alchemy.com/v2/SFZcaZUs6CVxFa8Go-zyeEAzMabvuQ2D"
    ),
  },
});
