"use client";
import { useState, useEffect } from "react";
import { Connector, useConnect } from "wagmi";
import { Button } from "@/components/ui/button";

export function WalletOptions() {
  const { connectors, connect } = useConnect();

  return connectors.map((connector) => (
    <WalletOption
      key={connector.uid}
      connector={connector}
      onClick={() => connect({ connector })}
    />
  ));
}

function WalletOption({
  connector,
  onClick,
}: {
  connector: Connector;
  onClick: () => void;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const provider = await connector.getProvider();
      setReady(!!provider);
    })();
  }, [connector]);

  return (
    <div className="flex justify-center text-center">
      <Button disabled={!ready} onClick={onClick}>
        {connector.name}
      </Button>
    </div>
  );
}
