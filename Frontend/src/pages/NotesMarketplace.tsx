import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCardano } from '@/hooks/useCardano';
import { marketplaceAPI, type MarketplaceNote, type CreateMarketplaceNoteDto } from '@/lib/api';
import { Search, Plus, ShoppingCart, Eye, DollarSign, User, Lock, Unlock, ArrowLeft, Wallet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const NotesMarketplace: React.FC = () => {
  const [notes, setNotes] = useState<MarketplaceNote[]>([]);
  const [myListings, setMyListings] = useState<MarketplaceNote[]>([]);
  const [myPurchases, setMyPurchases] = useState<MarketplaceNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showListDialog, setShowListDialog] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState<MarketplaceNote | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');
  
  const [formData, setFormData] = useState<CreateMarketplaceNoteDto>({
    title: '',
    description: '',
    content: '',
    priceAda: 0,
    sellerWalletAddress: '',
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const cardano = useCardano();

  useEffect(() => {
    fetchMarketplaceData();
  }, [activeTab]);

  useEffect(() => {
    // Pre-fill wallet address when connected
    if (cardano.isConnected && cardano.addresses.length > 0) {
      setFormData(prev => ({
        ...prev,
        sellerWalletAddress: cardano.addresses[0],
      }));
    }
  }, [cardano.isConnected, cardano.addresses]);

  const fetchMarketplaceData = async () => {
    try {
      setIsLoading(true);
      if (activeTab === 'browse') {
        const response = await marketplaceAPI.getAllActiveNotes();
        setNotes(response.data);
      } else if (activeTab === 'my-listings') {
        const response = await marketplaceAPI.getMyListedNotes();
        setMyListings(response.data);
      } else if (activeTab === 'my-purchases') {
        const response = await marketplaceAPI.getMyPurchasedNotes();
        setMyPurchases(response.data);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        variant: 'destructive',
        title: 'Failed to load marketplace notes',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchMarketplaceData();
      return;
    }

    try {
      setIsLoading(true);
      const response = await marketplaceAPI.searchNotes(searchQuery);
      setNotes(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        variant: 'destructive',
        title: 'Search failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleListNote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardano.isConnected) {
      toast({
        variant: 'destructive',
        title: 'Wallet not connected',
        description: 'Please connect your Cardano wallet first',
      });
      return;
    }

    try {
      await marketplaceAPI.createMarketplaceNote(formData);
      toast({
        title: 'Note listed successfully',
        description: 'Your note is now available on the marketplace',
      });
      setShowListDialog(false);
      setFormData({
        title: '',
        description: '',
        content: '',
        priceAda: 0,
        sellerWalletAddress: cardano.addresses[0] || '',
      });
      fetchMarketplaceData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        variant: 'destructive',
        title: 'Failed to list note',
        description: errorMessage,
      });
    }
  };

  const handlePurchaseNote = async () => {
    if (!selectedNote) return;

    if (!cardano.isConnected) {
      toast({
        variant: 'destructive',
        title: 'Wallet not connected',
        description: 'Please connect your Cardano wallet first',
      });
      return;
    }

    if (cardano.addresses.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No wallet address',
        description: 'Please ensure your wallet is properly connected',
      });
      return;
    }

    setIsPurchasing(true);

    try {
      // Send ADA transaction using Cardano wallet
      const txHash = await cardano.sendTransaction(
        selectedNote.sellerWalletAddress,
        selectedNote.priceAda,
        selectedNote.title // Metadata is just the title
      );

      // Record purchase in backend
      await marketplaceAPI.purchaseNote({
        marketplaceNoteId: selectedNote.id,
        transactionHash: txHash,
        buyerWalletAddress: cardano.addresses[0],
        purchasePriceAda: selectedNote.priceAda,
      });

      toast({
        title: 'Purchase successful!',
        description: `You can now access the full content. Transaction: ${txHash.substring(0, 16)}...`,
      });

      setShowPurchaseDialog(false);
      setSelectedNote(null);
      fetchMarketplaceData();
    } catch (error: any) {
      // Check if it was a user cancellation
      if (error.isUserCancelled) {
        toast({
          title: 'Purchase cancelled',
          description: 'You cancelled the transaction',
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast({
          variant: 'destructive',
          title: 'Purchase failed',
          description: errorMessage,
        });
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderNoteCard = (note: MarketplaceNote, showFullContent: boolean = false) => (
    <Card key={note.id} className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-foreground mb-1">{note.title}</h3>
          <p className="text-sm text-muted-foreground mb-2">{note.description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="secondary" className="text-lg font-bold">
            ₳{note.priceAda}
          </Badge>
          {note.isPurchased && (
            <Badge variant="default" className="bg-green-500">
              <Unlock className="w-3 h-3 mr-1" />
              Owned
            </Badge>
          )}
        </div>
      </div>

      <div className="mb-4">
        {showFullContent && note.fullContent ? (
          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm text-foreground whitespace-pre-wrap">{note.fullContent}</p>
          </div>
        ) : (
          <div className="p-4 bg-muted rounded-md relative">
            <p className="text-sm text-muted-foreground">{note.contentPreview}</p>
            {!note.isPurchased && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted flex items-end justify-center pb-4">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {note.viewCount}
          </span>
          <span className="flex items-center gap-1">
            <ShoppingCart className="w-3 h-3" />
            {note.purchaseCount}
          </span>
        </div>
        <span>{formatDate(note.createdAt)}</span>
      </div>

      {!note.isPurchased && activeTab === 'browse' && (
        <Button
          onClick={() => {
            setSelectedNote(note);
            setShowPurchaseDialog(true);
          }}
          className="w-full"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Purchase for ₳{note.priceAda}
        </Button>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Notes Marketplace</h1>
                <p className="text-xs text-muted-foreground">Buy and sell notes with Cardano</p>
              </div>
            </div>

            <Button
              onClick={() => setShowListDialog(true)}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              List Note
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="my-listings">My Listings</TabsTrigger>
            <TabsTrigger value="my-purchases">My Purchases</TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            {/* Search */}
            <div className="flex gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search marketplace..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>

            {/* Notes Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No notes available</h3>
                <p className="text-muted-foreground">Be the first to list a note!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notes.map((note) => renderNoteCard(note))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-listings">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : myListings.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No listed notes</h3>
                <p className="text-muted-foreground mb-6">Start selling your notes on the marketplace</p>
                <Button onClick={() => setShowListDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  List Your First Note
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myListings.map((note) => renderNoteCard(note, true))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-purchases">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : myPurchases.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No purchased notes</h3>
                <p className="text-muted-foreground">Browse the marketplace to find notes to purchase</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myPurchases.map((note) => renderNoteCard(note, true))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* List Note Dialog */}
      <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>List Note on Marketplace</DialogTitle>
            <DialogDescription>
              Sell your note to other users using Cardano payment
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleListNote}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={255}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={500}
                  rows={2}
                  placeholder="Brief description of your note..."
                />
              </div>
              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  maxLength={10000}
                  rows={10}
                  placeholder="Your note content..."
                />
              </div>
              <div>
                <Label htmlFor="priceAda">Price (ADA) *</Label>
                <Input
                  id="priceAda"
                  type="number"
                  step="0.000001"
                  min="0.000001"
                  value={formData.priceAda}
                  onChange={(e) => setFormData({ ...formData, priceAda: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="sellerWalletAddress">Seller Wallet Address *</Label>
                <div className="flex gap-2">
                  <Input
                    id="sellerWalletAddress"
                    value={formData.sellerWalletAddress}
                    onChange={(e) => setFormData({ ...formData, sellerWalletAddress: e.target.value })}
                    required
                    placeholder={cardano.isConnected ? 'Auto-filled from connected wallet' : 'Connect wallet to auto-fill'}
                    disabled={cardano.isConnected && cardano.addresses.length > 0}
                    className="flex-1"
                  />
                  {!cardano.isConnected && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await cardano.connect();
                          toast({
                            title: 'Wallet connected',
                            description: 'Your wallet address has been auto-filled',
                          });
                        } catch (error) {
                          const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
                          toast({
                            variant: 'destructive',
                            title: 'Connection failed',
                            description: errorMessage,
                          });
                        }
                      }}
                      disabled={cardano.isConnecting}
                    >
                      {cardano.isConnecting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4 mr-2" />
                          Connect Wallet
                        </>
                      )}
                    </Button>
                  )}
                  {cardano.isConnected && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cardano.disconnect}
                      disabled
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Connected
                    </Button>
                  )}
                </div>
                {!cardano.isConnected && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Connect your Cardano wallet to auto-fill your address
                  </p>
                )}
                {cardano.isConnected && cardano.addresses.length > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ Connected to {cardano.walletName}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowListDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">List Note</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Note</DialogTitle>
            <DialogDescription>
              Confirm your purchase using Cardano wallet
            </DialogDescription>
          </DialogHeader>
          {selectedNote && (
            <div className="space-y-4">
              <div>
                <Label>Note Title</Label>
                <p className="text-sm font-medium">{selectedNote.title}</p>
              </div>
              <div>
                <Label>Price</Label>
                <p className="text-lg font-bold">₳{selectedNote.priceAda}</p>
              </div>
              
              {/* Wallet Connection Status */}
              <div className="border rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Wallet Status</Label>
                  {cardano.isConnected ? (
                    <Badge variant="default" className="bg-green-500">
                      <Wallet className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Not Connected
                    </Badge>
                  )}
                </div>
                
                {cardano.isConnected ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Connected to: <span className="font-medium text-foreground">{cardano.walletName}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Balance: <span className="font-medium text-foreground">₳{cardano.balanceADA}</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Connect your Cardano wallet to complete the purchase
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        try {
                          await cardano.connect();
                          toast({
                            title: 'Wallet connected',
                            description: 'You can now proceed with the purchase',
                          });
                        } catch (error) {
                          const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
                          toast({
                            variant: 'destructive',
                            title: 'Connection failed',
                            description: errorMessage,
                          });
                        }
                      }}
                      disabled={cardano.isConnecting}
                    >
                      {cardano.isConnecting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4 mr-2" />
                          Connect Wallet
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm text-muted-foreground">
                  You will be prompted to approve the transaction in your Cardano wallet.
                  Once the transaction is confirmed, you will have full access to the note content.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPurchaseDialog(false)}
              disabled={isPurchasing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchaseNote}
              disabled={isPurchasing || !cardano.isConnected}
            >
              {isPurchasing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Purchase Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotesMarketplace;
