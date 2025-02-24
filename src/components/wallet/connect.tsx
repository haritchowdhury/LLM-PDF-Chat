"use client";
import { useAccount } from "wagmi";
import { Account } from "@/components/wallet/account";
import { WalletOptions } from "@/components/wallet/wallet-options";
import { useState, useEffect } from "react";

export function ConnectWallet() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return isConnected ? <Account /> : <WalletOptions />;
}
