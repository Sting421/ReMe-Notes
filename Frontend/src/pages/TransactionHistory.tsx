import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ExternalLink, Coins, Calendar, Hash, User, FileText, RefreshCw } from 'lucide-react';
import { transactionsAPI, type Transaction } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function TransactionHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await transactionsAPI.getUserTransactions();
      setTransactions(response.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load transactions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAddress = (address: string) => {
    if (!address) return 'N/A';
    if (address.length <= 20) return address;
    return `${address.substring(0, 10)}...${address.substring(address.length - 10)}`;
  };

  const openInCardanoScan = (txHash: string) => {
    window.open(`https://preview.cardanoscan.io/transaction/${txHash}`, '_blank');
  };

  const TransactionCard = ({ tx }: { tx: Transaction }) => (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setSelectedTx(tx)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              {tx.amountADA} ADA
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Calendar className="h-3 w-3" />
              {formatDate(tx.createdAt)}
            </CardDescription>
          </div>
          {tx.noteTitle && (
            <Badge variant="secondary" className="ml-2">
              <FileText className="h-3 w-3 mr-1" />
              {tx.noteTitle}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Hash className="h-3 w-3" />
            <code className="text-xs">{formatAddress(tx.txHash)}</code>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-3 w-3" />
            From: <code className="text-xs">{formatAddress(tx.senderAddress)}</code>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-3 w-3" />
            To: <code className="text-xs">{formatAddress(tx.recipientAddress)}</code>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const TransactionDetails = ({ tx }: { tx: Transaction }) => (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transaction Details</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTx(null)}
          >
            Close
          </Button>
        </div>
        <CardDescription>Full transaction information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Amount</label>
          <p className="text-2xl font-bold text-primary">{tx.amountADA} ADA</p>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Transaction Hash</label>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs bg-muted p-2 rounded flex-1 break-all">
              {tx.txHash}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openInCardanoScan(tx.txHash)}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">From Address</label>
          <code className="text-xs bg-muted p-2 rounded block mt-1 break-all">
            {tx.senderAddress}
          </code>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">To Address</label>
          <code className="text-xs bg-muted p-2 rounded block mt-1 break-all">
            {tx.recipientAddress}
          </code>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
          <p className="text-sm mt-1">{formatDate(tx.createdAt)}</p>
        </div>

        {tx.noteTitle && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Linked Note</label>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-sm">
                <FileText className="h-3 w-3 mr-1" />
                {tx.noteTitle}
              </Badge>
              {tx.noteId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/notes/${tx.noteId}`)}
                >
                  View Note
                </Button>
              )}
            </div>
          </div>
        )}

        {tx.metadata && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Metadata</label>
            <p className="text-sm mt-1 bg-muted p-2 rounded">{tx.metadata}</p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-muted-foreground">Network</label>
          <Badge variant="outline" className="mt-1">
            {tx.networkId === 0 ? 'Preview Testnet' : `Network ${tx.networkId}`}
          </Badge>
        </div>

        <Button
          className="w-full"
          onClick={() => openInCardanoScan(tx.txHash)}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          View on CardanoScan
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <p className="text-muted-foreground mt-2">
          View all your Cardano blockchain transactions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              All Transactions ({transactions.length})
            </h2>
            <Button variant="outline" size="sm" onClick={loadTransactions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full mt-2" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No transactions yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Send your first transaction to see it here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <TransactionCard key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </div>

        <div>
          {selectedTx ? (
            <TransactionDetails tx={selectedTx} />
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <Hash className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a transaction</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click on any transaction to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
