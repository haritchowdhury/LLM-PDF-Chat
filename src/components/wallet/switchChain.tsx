import { useAccount, useConfig } from "wagmi";
//import { config } from "@/wagmi";
import { useState, useEffect } from "react";
import { switchChain } from "@wagmi/core";
import { Button } from "@/components/ui/button";

export default function SwitchNetwork() {
  const { chainId } = useAccount();
  const wagmiConfig = useConfig();
  const [selectedChain, setSelectedChain] = useState(chainId || "");
  useEffect(() => {
    setSelectedChain(chainId);
  }, [chainId]);
  const handleChange = async (event) => {
    const newChainId = Number(event.target.value);
    setSelectedChain(newChainId);
    await switchChain(wagmiConfig, { chainId: newChainId });
  };

  return (
    <div>
      <Button className="p-0">
        <select
          id="network"
          value={selectedChain}
          onChange={handleChange}
          className="bg-black rounded p-2 text-gray-200 "
        >
          {/*<option value={31337}>{"Hardhat"}</option>*/}
          <option value={11155111}>{"Sepolia ETH"}</option>
          <option value={656476}>{"EDU Testnet"}</option>
        </select>
      </Button>
    </div>
  );
}
