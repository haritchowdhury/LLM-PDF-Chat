"use client";
import { useState, useEffect } from "react";
import {
  useAccount,
  useDisconnect,
  useEnsAvatar,
  useEnsName,
  useBalance,
  useSwitchAccount,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { config } from "@/wagmi";
import { fetchBalance, getChainId, getBalance } from "@wagmi/core";
import SwitchNetwork from "@/components/wallet/switchChain";

export function Account() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! });
  //console.log(address, ensName, ensAvatar);
  //const chainId = getChainId(config);
  const [chainId, setChainId] = useState<any | null>("");
  const [balance, setBalance] = useState<any | null>("");
  //const { connectors, switchAccount } = useSwitchAccount();

  useEffect(() => {
    const fetchUserBalance = async () => {
      if (!address) return;
      try {
        const balanceData = await getBalance(config, {
          address: address,
        });
        if (balanceData) {
          setBalance(balanceData);
        }
        const id = getChainId(config);
        if (id) {
          setChainId(id);
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };

    fetchUserBalance();
  }, [isConnected]);

  return (
    <div className=" bg-black flex flex-row gap-2 text-gray-100  p-0">
      {ensAvatar && <img alt="ENS Avatar" src={ensAvatar} />}
      {address ? (
        <>
          <div className="flex justify-center gap-2">
            <SwitchNetwork />
          </div>
          <Button onClick={() => disconnect()}>Disconnect</Button>
        </>
      ) : (
        <></>
      )}
    </div>
  );
}
