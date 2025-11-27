import { useState, useRef } from "react";
import { useCardano } from "@/hooks/useCardano";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Check, Send, RefreshCw, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { transactionsAPI } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { notesAPI } from "@/lib/api";
import { useEffect } from "react";

// Basic Cardano recipient format validation (Preview testnet bech32 or long hex from CIP-30)
const isValidRecipientFormat = (value: string): boolean => {
  const trimmed = value.trim();

  if (!trimmed) return false;

  // CIP-30 style hex address from wallet API (with or without 0x)
  const hex = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
  const isHex = /^[0-9a-fA-F]+$/.test(hex);
  if (isHex && hex.length > 50) return true;

  // Bech32-style address (Preview testnet only)
  if (trimmed.startsWith("addr_test1")) return true;

  return false;
};

export const WalletPanel = () => {
  const {
    isConnected,
    isConnecting,
    addresses,
    balanceADA,
    balance,
    utxoCount,
    sendTransaction,
    refresh,
    connect,
    error,
  } = useCardano();

  const { toast } = useToast();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amountADA, setAmountADA] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string>("");
  const [notes, setNotes] = useState<Array<{ id: string; title: string }>>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  
  // Local mutex to prevent double-clicks and concurrent form submissions
  const isSubmittingRef = useRef<boolean>(false);

  // Load user notes for linking transactions
  useEffect(() => {
    if (isConnected) {
      loadNotes();
    }
  }, [isConnected]);

  const loadNotes = async () => {
    setIsLoadingNotes(true);
    try {
      const response = await notesAPI.getNotes();
      setNotes(response.data.map(note => ({
        id: String(note.id),
        title: note.title || 'Untitled'
      })));
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Not Connected</CardTitle>
          <CardDescription>Please connect your Lace wallet to view wallet information.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={connect}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Connect Lace Wallet
              </>
            )}
          </Button>
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const handleCopyAddress = async (address: string, index: number) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedIndex(index);
      toast({
        title: "Copied!",
        description: "Address copied to clipboard",
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the address manually",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      toast({
        title: "Refreshed",
        description: "Wallet data updated",
      });
    } catch (err: any) {
      toast({
        title: "Refresh failed",
        description: err.message || "Failed to refresh wallet data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double-clicks and concurrent submissions
    if (isSubmittingRef.current || isSending) {
      return;
    }
    
    if (!recipientAddress.trim() || !isValidRecipientFormat(recipientAddress)) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid Cardano address (bech32 or hex from wallet API)",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(amountADA);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (amount > parseFloat(balanceADA)) {
      toast({
        title: "Insufficient balance",
        description: `You only have ${balanceADA} ADA`,
        variant: "destructive",
      });
      return;
    }

    // Acquire local mutex
    isSubmittingRef.current = true;
    setIsSending(true);
    
    try {
      // Fetch note content if note is selected (to embed in blockchain)
      let noteContent = '';
      const hasNoteLink = selectedNoteId && selectedNoteId !== "none";
      if (hasNoteLink) {
        try {
          const noteResponse = await notesAPI.getNote(selectedNoteId);
          const note = noteResponse.data;
          noteContent = `Note: ${note.title}\n\n${note.content || 'No content'}`;
        } catch (noteErr) {
          console.error('Failed to fetch note content:', noteErr);
          // Continue without note content
        }
      }
      
      // Send transaction with note content as blockchain metadata (CIP-20)
      const txHash = await sendTransaction(recipientAddress.trim(), amount, noteContent || undefined);
      
      // Record transaction in backend database
      try {
        const senderAddr = addresses.length > 0 ? addresses[0] : "";
        await transactionsAPI.createTransaction({
          txHash,
          senderAddress: senderAddr,
          recipientAddress: recipientAddress.trim(),
          amountADA: amount,
          noteId: hasNoteLink ? parseInt(selectedNoteId) : undefined,
          networkId: 0, // Preview testnet
          metadata: hasNoteLink ? `Linked to note ${selectedNoteId}` : undefined
        });
      } catch (recordErr) {
        console.error('Failed to record transaction:', recordErr);
        // Don't fail the whole operation if recording fails
      }
      
      toast({
        title: "Transaction sent!",
        description: hasNoteLink 
          ? `Transaction with note content embedded on blockchain!` 
          : `Transaction hash: ${txHash.substring(0, 16)}...`,
      });
      
      // Reset form
      setRecipientAddress("");
      setAmountADA("");
      setSelectedNoteId("");
      
      // Refresh balance (don't await to avoid blocking UI)
      refresh().catch(() => {
        // Silently handle refresh errors
      });
    } catch (err: any) {
      const message = typeof err?.message === "string" ? err.message : String(err ?? "");
      const lower = message.toLowerCase();
      const isUserCancelled = err?.isUserCancelled || 
        lower.includes("transaction cancelled by user") ||
        lower.includes("signing was cancelled") ||
        lower.includes("user declined signing tx") ||
        lower.includes("user declined signing") ||
        lower.includes("transaction already in progress");

      // Treat user-declined signing as a normal cancellation, not a failure
      if (isUserCancelled) {
        // Only show toast if it's a user cancellation, not a mutex lock
        if (!lower.includes("transaction already in progress")) {
          toast({
            title: "Transaction cancelled",
            description: "Transaction cancelled by user",
          });
        }
      } else {
        toast({
          title: "Transaction failed",
          description: message || "Failed to send transaction",
          variant: "destructive",
        });
      }
    } finally {
      // Always release local mutex
      isSubmittingRef.current = false;
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Wallet Information</CardTitle>
              <CardDescription>Your Cardano wallet details</CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Balance</Label>
              <p className="text-2xl font-bold">{balanceADA} ADA</p>
              <p className="text-sm text-muted-foreground">{balance.toString()} lovelace</p>
            </div>
            <div>
              <Label className="text-muted-foreground">UTXO Count</Label>
              <p className="text-2xl font-bold">{utxoCount}</p>
            </div>
          </div>

          {addresses.length > 0 && (
            <div>
              <Label className="text-muted-foreground mb-2 block">Addresses ({addresses.length})</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {addresses.slice(0, 5).map((address, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted text-sm"
                  >
                    <code className="flex-1 truncate font-mono text-xs">{address}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCopyAddress(address, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
                {addresses.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{addresses.length - 5} more addresses
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send Transaction</CardTitle>
          <CardDescription>Send ADA to another address</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                type="text"
                placeholder="Enter recipient address (hex or bech32)"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                disabled={isSending}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (ADA)</Label>
              <Input
                id="amount"
                type="number"
                step="0.000001"
                min="0"
                max={balanceADA}
                placeholder="0.000000"
                value={amountADA}
                onChange={(e) => setAmountADA(e.target.value)}
                disabled={isSending}
              />
              <p className="text-xs text-muted-foreground">
                Available: {balanceADA} ADA
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Link to Note (Optional)</Label>
              <Select
                value={selectedNoteId}
                onValueChange={setSelectedNoteId}
                disabled={isSending || isLoadingNotes}
              >
                <SelectTrigger id="note">
                  <SelectValue placeholder="Select a note to link..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {notes.map((note) => (
                    <SelectItem key={note.id} value={note.id}>
                      {note.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Optionally link this transaction to a note
              </p>
            </div>
            <Button
              type="submit"
              disabled={isSending || !recipientAddress.trim() || !amountADA}
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Transaction
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
