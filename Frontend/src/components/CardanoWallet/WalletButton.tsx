import { useCardano } from "@/hooks/useCardano";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet } from "lucide-react";

export const WalletButton = () => {
  const { isConnected, isConnecting, walletName, networkId, connect, disconnect, error } = useCardano();

  const handleClick = async () => {
    if (isConnected) {
      disconnect();
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
    return "Connect Lace Wallet";
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleClick}
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


