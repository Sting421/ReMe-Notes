import { useState, useEffect } from "react";
import { useCardano } from "@/hooks/useCardano";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WalletPanel } from "./WalletPanel";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const WalletDialog = () => {
  const { isConnected, walletName, networkId, isConnecting } = useCardano();
  const [open, setOpen] = useState(false);

  // Auto-close dialog if wallet disconnects
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      // Keep dialog open if user is in the process of connecting
    }
  }, [isConnected, isConnecting]);

  const getButtonText = () => {
    if (isConnecting) return "Connecting...";
    if (isConnected) {
      const networkLabel = networkId === 0 ? "Preview" : networkId === 1 ? "Mainnet" : `Net ${networkId}`;
      return `${walletName || "Wallet"} (${networkLabel})`;
    }
    return "Connect Wallet";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isConnected ? "outline" : "ghost"}
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          disabled={isConnecting}
        >
          <Wallet className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">{getButtonText()}</span>
          <span className="sm:hidden">Wallet</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Cardano Wallet</DialogTitle>
              <DialogDescription>
                Connect and manage your Lace wallet on Preview testnet
              </DialogDescription>
            </div>
            {isConnected && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Connected
              </Badge>
            )}
          </div>
        </DialogHeader>
        <WalletPanel />
      </DialogContent>
    </Dialog>
  );
};

