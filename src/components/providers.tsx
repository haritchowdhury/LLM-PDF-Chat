"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/wagmi";
import { WagmiProvider } from "wagmi";
export default function Providers({ children }) {
  const queryClient = new QueryClient();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/* <RainbowKitProvider
          modalSize="compact"
          theme={darkTheme({
            accentColor: "#7b3fe4",
            accentColorForeground: "white",
            borderRadius: "small",
            fontStack: "system",
            overlayBlur: "small",
          })} 
        >
        */}

        {children}
        {/* </RainbowKitProvider>*/}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
