import { useState, useEffect } from "react";
import { useCardano } from "@/hooks/useCardano";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WalletPanel } from "./WalletPanel";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";

export const WalletDialog = () => {
  const { isConnected, walletName, networkId, isConnecting, wallets, walletKey, setWalletKey, disconnect } = useCardano();
  const [open, setOpen] = useState(false);

  // Handle wallet change: disconnect if connected
  const onWalletChange = (newKey: string) => {
    if (isConnected) disconnect();
    setWalletKey(newKey);
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
          {wallets.find(w => w.key === walletKey && w.icon) && (
            <img src={wallets.find(w => w.key === walletKey)!.icon} className="w-5 h-5 mr-2 inline-block align-middle" alt="Wallet Icon" />
          )}
          <span className="hidden sm:inline">{walletName || "Select Wallet"}</span>
          <span className="sm:hidden">Wallet</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Cardano Wallet</DialogTitle>
              <DialogDescription>
                Connect and manage any wallet (Lace, Eternl, etc) on Preview testnet
              </DialogDescription>
            </div>
            {isConnected && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Connected
              </Badge>
            )}
          </div>
        </DialogHeader>
        {/* Wallet selection dropdown */}
        <div className="mb-4">
          <Select value={walletKey ?? ''} onValueChange={onWalletChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Wallet" />
            </SelectTrigger>
            <SelectContent>
              {wallets.map(w => (
                <SelectItem value={w.key} key={w.key} className="flex items-center">
                  {w.icon && (<img src={w.icon} alt="Wallet" className="w-5 h-5 mr-2 inline-block align-middle" />)}
                  {w.name} ({w.key})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <WalletPanel />
      </DialogContent>
    </Dialog>
  );
};

