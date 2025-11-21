import { useEffect, useState } from "react";
import { useCardano } from "@/hooks/useCardano";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet } from "lucide-react";

export const WalletButton = () => {
  const {
    isConnected,
    isConnecting,
    walletName,
    networkId,
    connect,
    connectTo,
    disconnect,
    availableWallets,
    error,
  } = useCardano();

  const [selectedWalletKey, setSelectedWalletKey] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!selectedWalletKey && availableWallets && availableWallets.length > 0) {
      setSelectedWalletKey(availableWallets[0].key);
    }
  }, [availableWallets, selectedWalletKey]);

  const handleConnect = async () => {
    if (isConnected) {
      disconnect();
      return;
    }

    // Use connectTo when a specific wallet is selected
    if (connectTo) {
      await connectTo(selectedWalletKey);
    } else {
      await connect();
    }
  };

  const getButtonText = () => {
    if (isConnecting) {
      return "Connecting...";
    }
    if (isConnected) {
      const networkLabel = networkId === 0 ? "Preview" : networkId === 1 ? "Mainnet" : `Network ${networkId}`;
      return `${walletName || "Wallet"} (${networkLabel})`;
    }
    return selectedWalletKey ? `Connect ${selectedWalletKey}` : "Connect Wallet";
  };

  return (
    <div className="flex flex-col gap-2">
      {!isConnected && (
        <select
          value={selectedWalletKey}
          onChange={(e) => setSelectedWalletKey(e.target.value)}
          className="px-2 py-1 rounded border bg-white text-sm max-w-[200px]"
        >
          {availableWallets && availableWallets.length > 0 ? (
            availableWallets.map((w) => (
              <option key={w.key} value={w.key}>
                {w.name} ({w.key})
              </option>
            ))
          ) : (
            <option value="">No wallets detected</option>
          )}
        </select>
      )}

      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        variant={isConnected ? "outline" : "default"}
        className="min-w-[200px]"
      >
        {isConnecting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="mr-2 h-4 w-4" />
        )}
        {getButtonText()}
      </Button>

      {error && (
        <p className="text-sm text-destructive max-w-[200px] break-words">{error}</p>
      )}
    </div>
  );
};


