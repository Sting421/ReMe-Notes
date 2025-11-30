import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, ExternalLink, Coins, Calendar, Hash, User, FileText, RefreshCw, ShoppingCart, TrendingUp } from 'lucide-react';
import { transactionsAPI, marketplaceAPI, type Transaction, type NotePurchaseHistory } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type HistoryListProps = {
  title: string;
  description: string;
  isLoading: boolean;
  emptyMessage: string;
  items: NotePurchaseHistory[];
  type: 'purchase' | 'sale';
  onReload: () => void | Promise<void>;
};

export default function TransactionHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<NotePurchaseHistory[]>([]);
  const [salesHistory, setSalesHistory] = useState<NotePurchaseHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchaseLoading, setIsPurchaseLoading] = useState(true);
  const [isSalesLoading, setIsSalesLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState<'wallet' | 'purchases' | 'sales'>('wallet');

  useEffect(() => {
    loadWalletTransactions();
    loadPurchaseHistory();
    loadSalesHistory();
  }, []);

  const loadWalletTransactions = async () => {
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

  const loadPurchaseHistory = async () => {
    setIsPurchaseLoading(true);
    try {
      const response = await marketplaceAPI.getMyPurchaseHistory();
      setPurchaseHistory(response.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load purchase history',
        variant: 'destructive',
      });
    } finally {
      setIsPurchaseLoading(false);
    }
  };

  const loadSalesHistory = async () => {
    setIsSalesLoading(true);
    try {
      const response = await marketplaceAPI.getMySalesHistory();
      setSalesHistory(response.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load sales history',
        variant: 'destructive',
      });
    } finally {
      setIsSalesLoading(false);
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
    // If address is already masked (contains ...), return as is
    if (address.includes('...')) {
      return address;
    }
    // If address is short, return as is
    if (address.length <= 20) return address;
    // Otherwise, mask it (though backend should already mask it)
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
  };

  const isAddressMasked = (address: string): boolean => {
    return address && address.includes('...');
  };

  const openInCardanoScan = (txHash: string) => {
    window.open(`https://preview.cardanoscan.io/transaction/${txHash}`, '_blank');
  };

  useEffect(() => {
    if (activeTab !== 'wallet' && selectedTx) {
      setSelectedTx(null);
    }
  }, [activeTab, selectedTx]);

  const HistoryList = ({
    title,
    description,
    isLoading,
    emptyMessage,
    items,
    type,
    onReload,
  }: HistoryListProps) => {
    const isPurchase = type === 'purchase';
    const counterpartLabel = isPurchase ? 'Seller' : 'Buyer';

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {isPurchase ? (
                <ShoppingCart className="h-5 w-5 text-primary" />
              ) : (
                <TrendingUp className="h-5 w-5 text-primary" />
              )}
              {title}
            </h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onReload}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              {isPurchase ? (
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              ) : (
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              )}
              <p className="text-muted-foreground">{emptyMessage}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {isPurchase
                  ? 'Purchases will appear here once you buy notes from the marketplace.'
                  : 'Sales will appear here once buyers purchase your listed notes.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const noteLabel =
                item.noteTitle ?? (item.marketplaceNoteId ? `Note #${item.marketplaceNoteId}` : 'Marketplace Note');
              const counterpartAddress =
                counterpartLabel === 'Seller'
                  ? item.sellerWalletAddress
                  : item.buyerWalletAddress;

              return (
                <Card key={`${item.id}-${item.transactionHash}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">{noteLabel}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.purchasedAt)}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {item.purchasePriceAda} ADA
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Hash className="h-3 w-3" />
                      <code className="text-xs">{formatAddress(item.transactionHash)}</code>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <User className="h-3 w-3" />
                      <span className="text-foreground font-medium">{counterpartLabel}:</span>
                      <span className="text-foreground font-mono text-sm">{counterpartAddress}</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs uppercase tracking-wide">Buyer Wallet</span>
                          {isAddressMasked(item.buyerWalletAddress) && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              Protected
                            </Badge>
                          )}
                        </div>
                        <code className="block text-xs bg-muted p-2 rounded mt-1 font-mono">
                          {formatAddress(item.buyerWalletAddress)}
                        </code>
                        {isAddressMasked(item.buyerWalletAddress) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Address masked for security
                          </p>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs uppercase tracking-wide">Seller Wallet</span>
                          {isAddressMasked(item.sellerWalletAddress) && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              Protected
                            </Badge>
                          )}
                        </div>
                        <code className="block text-xs bg-muted p-2 rounded mt-1 font-mono">
                          {formatAddress(item.sellerWalletAddress)}
                        </code>
                        {isAddressMasked(item.sellerWalletAddress) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Address masked for security
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Button variant="outline" size="sm" onClick={() => openInCardanoScan(item.transactionHash)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on CardanoScan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
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
            <span>From:</span>
            <code className="text-xs font-mono">{formatAddress(tx.senderAddress)}</code>
            {isAddressMasked(tx.senderAddress) && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 ml-1">
                Protected
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-3 w-3" />
            <span>To:</span>
            <code className="text-xs font-mono">{formatAddress(tx.recipientAddress)}</code>
            {isAddressMasked(tx.recipientAddress) && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 ml-1">
                Protected
              </Badge>
            )}
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
          <div className="flex items-center gap-2 mb-1">
            <label className="text-sm font-medium text-muted-foreground">From Address</label>
            {isAddressMasked(tx.senderAddress) && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                Protected
              </Badge>
            )}
          </div>
          <code className="text-xs bg-muted p-2 rounded block mt-1 break-all font-mono">
            {formatAddress(tx.senderAddress)}
          </code>
          {isAddressMasked(tx.senderAddress) && (
            <p className="text-xs text-muted-foreground mt-1">
              Address masked for security. View full address on CardanoScan.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="text-sm font-medium text-muted-foreground">To Address</label>
            {isAddressMasked(tx.recipientAddress) && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                Protected
              </Badge>
            )}
          </div>
          <code className="text-xs bg-muted p-2 rounded block mt-1 break-all font-mono">
            {formatAddress(tx.recipientAddress)}
          </code>
          {isAddressMasked(tx.recipientAddress) && (
            <p className="text-xs text-muted-foreground mt-1">
              Address masked for security. View full address on CardanoScan.
            </p>
          )}
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

  const purchaseCount = purchaseHistory.length;
  const salesCount = salesHistory.length;

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
          Track your wallet activity, marketplace purchases, and note sales.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
          <TabsTrigger value="wallet" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            <span>Wallet Activity</span>
            <Badge variant="outline" className="ml-2">{transactions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="purchases" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span>Purchases</span>
            <Badge variant="outline" className="ml-2">{purchaseCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Sales</span>
            <Badge variant="outline" className="ml-2">{salesCount}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  All Transactions ({transactions.length})
                </h2>
                <Button variant="outline" size="sm" onClick={loadWalletTransactions}>
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
        </TabsContent>

        <TabsContent value="purchases">
          <HistoryList
            title="Purchased Notes"
            description="See the notes you've purchased and their transaction details."
            isLoading={isPurchaseLoading}
            emptyMessage="No purchases yet"
            items={purchaseHistory}
            type="purchase"
            onReload={loadPurchaseHistory}
          />
        </TabsContent>

        <TabsContent value="sales">
          <HistoryList
            title="Sales History"
            description="Track who bought your listed notes and when."
            isLoading={isSalesLoading}
            emptyMessage="No sales yet"
            items={salesHistory}
            type="sale"
            onReload={loadSalesHistory}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
