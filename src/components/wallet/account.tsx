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
  }, [isConnected]); // Runs when address changes

  return (
    <div className=" bg-black flex flex-row gap-2 text-gray-100  p-0">
      {ensAvatar && <img alt="ENS Avatar" src={ensAvatar} />}
      {address ? (
        <>
          <div className="flex justify-center gap-2 w-full">
            <div className="flex flex-col bg-gray-900 rounded p-1">
              <small>Chain Id</small>
              <small className="bg-black rounded">{chainId}</small>
            </div>
            {ensName ? (
              `${ensName} (${
                address.toString().slice(1, 7) +
                "..." +
                address.toString().slice(-5, -1)
              })`
            ) : (
              <div className="flex flex-col p-1 justify-end bg-gray-900 rounded">
                <div>
                  {address.toString().slice(0, 4) +
                    "..." +
                    address.toString().slice(-5, -1)}
                </div>{" "}
                <small className="bg-gray-400 rounded  text-black ">
                  Balance:{balance?.toString().split(".")[0]}.{""}
                  {balance?.toString().split(".")[1].slice(0, 2)}
                </small>
              </div>
            )}
          </div>
          <Button onClick={() => disconnect()}>Disconnect</Button>
        </>
      ) : (
        <></>
      )}
    </div>
  );
}
