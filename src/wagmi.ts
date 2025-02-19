//import { getDefaultConfig } from "@rainbow-me/rainbowkit";
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
//import { config } from "./config";

const projectId = process.env.NEXT_PUBLIC_RAINBOW_PROJECT_ID;
export const config = createConfig({
  chains: [eduTestnetChain, hardhatChain],
  connectors: [
    /*injected(), walletConnect({ projectId }),*/ metaMask() /*, safe()*/,
  ],
  transports: {
    //[mainnet.id]: http(),
    //[base.id]: http(),
    [eduTestnetChain.id]: http("https://open-campus-codex-sepolia.drpc.org"),
    [hardhatChain.id]: http("http://127.0.0.1:8545/"),
  },
  //ssr: true,
});
