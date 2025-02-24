export const eduTestnetChain = {
  id: 656476,
  name: "EDU Testnet",
  network: "edu-testnet",
  nativeCurrency: {
    name: "EDU Coin",
    symbol: "EDU",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://open-campus-codex-sepolia.drpc.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "EDU Explorer",
      url: "https://educhain.blockscout.com/",
    },
  },
  testnet: true,
};
