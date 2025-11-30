# Notes Marketplace Integration Guide

## Overview
The Notes Marketplace is a feature that allows users to buy and sell notes using Cardano (ADA) cryptocurrency. Users can list their notes for sale, browse available notes, and purchase notes with Cardano wallet integration.

## Architecture

### Backend Components

#### Entities
1. **MarketplaceNote** (`Backend/src/main/java/com/ReMe/ReMe/entity/MarketplaceNote.java`)
   - Represents a note listed on the marketplace
   - Fields: title, description, content, priceAda, sellerWalletAddress, seller, isActive, viewCount, purchaseCount
   - Relationships: Many-to-One with User (seller)

2. **NotePurchase** (`Backend/src/main/java/com/ReMe/ReMe/entity/NotePurchase.java`)
   - Records note purchase transactions
   - Fields: marketplaceNote, buyer, purchasePriceAda, transactionHash, buyerWalletAddress, sellerWalletAddress
   - Relationships: Many-to-One with MarketplaceNote and User (buyer)

#### DTOs
1. **MarketplaceNoteDto** - For creating/updating marketplace notes
2. **MarketplaceNoteResponseDto** - For API responses with purchase status
3. **NotePurchaseDto** - For recording note purchases

#### Repositories
1. **MarketplaceNoteRepository** - CRUD operations and queries for marketplace notes
2. **NotePurchaseRepository** - CRUD operations and queries for purchases

#### Service Layer
**MarketplaceService** (`Backend/src/main/java/com/ReMe/ReMe/service/MarketplaceService.java`)
- `createMarketplaceNote()` - List a note for sale
- `getAllActiveNotes()` - Get all active marketplace notes
- `getNoteById()` - Get specific note with view count increment
- `getMyListedNotes()` - Get user's listed notes
- `getMyPurchasedNotes()` - Get notes purchased by user
- `searchNotes()` - Search marketplace notes
- `purchaseNote()` - Process note purchase
- `updateMarketplaceNote()` - Update listing
- `deleteMarketplaceNote()` - Soft delete (deactivate) listing

#### Controller
**MarketplaceController** (`Backend/src/main/java/com/ReMe/ReMe/controller/MarketplaceController.java`)

Endpoints:
- `POST /api/marketplace/notes` - Create marketplace listing
- `GET /api/marketplace/notes` - Get all active notes
- `GET /api/marketplace/notes/{id}` - Get specific note
- `GET /api/marketplace/notes/my-listings` - Get user's listings
- `GET /api/marketplace/notes/search?query={query}` - Search notes
- `POST /api/marketplace/purchase` - Purchase a note
- `PUT /api/marketplace/notes/{id}` - Update listing
- `DELETE /api/marketplace/notes/{id}` - Delete listing
- `GET /api/marketplace/purchases/my-purchases` - Get purchased notes

### Frontend Components

#### API Integration (`Frontend/src/lib/api.ts`)
- `marketplaceAPI` object with methods for all marketplace operations
- TypeScript interfaces: `MarketplaceNote`, `CreateMarketplaceNoteDto`, `PurchaseNoteDto`

#### Pages
**NotesMarketplace** (`Frontend/src/pages/NotesMarketplace.tsx`)
- Three tabs: Browse, My Listings, My Purchases
- Search functionality
- List note dialog with form
- Purchase dialog with Cardano wallet integration
- Note cards with preview/full content based on purchase status

#### Features
1. **Browse Tab**
   - View all active marketplace notes
   - Search notes by title/description
   - See preview of content (first 200 characters)
   - Purchase button for unpurchased notes
   - Shows price, seller, view count, purchase count

2. **My Listings Tab**
   - View your listed notes
   - Full content visible for your own notes
   - See purchase statistics

3. **My Purchases Tab**
   - View notes you've purchased
   - Full content visible for purchased notes
   - Transaction history

4. **List Note Dialog**
   - Form fields: title, description, content, price (ADA), wallet address
   - Auto-fills wallet address from connected Cardano wallet
   - Validation: all fields required except description

5. **Purchase Dialog**
   - Shows note details and price
   - Integrates with Cardano wallet for payment
   - Transaction metadata includes note title
   - Records purchase in backend after successful payment

## Cardano Integration

### Payment Flow
1. User clicks "Purchase" on a note
2. Purchase dialog opens showing note details and price
3. User clicks "Purchase Now"
4. Frontend calls `cardano.sendTransaction()` with:
   - Recipient: seller's wallet address
   - Amount: note price in ADA
   - Metadata: note title (visible on blockchain explorers)
5. User approves transaction in wallet
6. Frontend receives transaction hash
7. Frontend calls backend `/api/marketplace/purchase` with:
   - marketplaceNoteId
   - transactionHash
   - buyerWalletAddress
   - purchasePriceAda
8. Backend validates and records purchase
9. User gains access to full note content

### Wallet Address Handling
- Seller's wallet address is required when listing a note
- If wallet is connected, address is auto-filled and disabled
- Address is stored with the marketplace note
- Buyer's wallet address is captured during purchase
- Both addresses are recorded in NotePurchase entity

### Transaction Metadata
- Only the note title is included in transaction metadata (as requested)
- Uses CIP-20 standard (label 674) for transaction messages
- Visible on Cardano blockchain explorers like CardanoScan
- Maximum 64 bytes per metadata chunk

## Security Considerations

1. **Duplicate Purchase Prevention**
   - Backend checks if user already purchased the note
   - Transaction hash uniqueness validation
   - User cannot purchase their own notes

2. **Content Access Control**
   - Preview (200 characters) shown to all users
   - Full content only accessible to:
     - Note seller
     - Users who have purchased the note
   - Implemented in `MarketplaceService.convertToResponseDto()`

3. **Wallet Verification**
   - Frontend validates wallet connection before transactions
   - Backend stores wallet addresses for audit trail
   - Transaction hash serves as proof of payment

4. **Soft Delete**
   - Notes are deactivated (isActive = false) rather than deleted
   - Preserves purchase history and references
   - Only seller can deactivate their listings

## Usage Guide

### For Sellers

1. **List a Note**
   - Navigate to Marketplace
   - Click "List Note" button
   - Fill in form:
     - Title (required)
     - Description (optional, max 500 chars)
     - Content (required, max 10000 chars)
     - Price in ADA (required, minimum 0.000001)
     - Wallet address (auto-filled if connected)
   - Click "List Note"

2. **Manage Listings**
   - Go to "My Listings" tab
   - View all your listed notes
   - See purchase count and view count
   - Update or delete listings as needed

### For Buyers

1. **Browse Notes**
   - Navigate to Marketplace
   - Browse available notes in "Browse" tab
   - Use search to find specific notes
   - View preview and metadata

2. **Purchase a Note**
   - Connect Cardano wallet
   - Click "Purchase" on desired note
   - Review details in purchase dialog
   - Click "Purchase Now"
   - Approve transaction in wallet
   - Wait for confirmation

3. **Access Purchased Notes**
   - Go to "My Purchases" tab
   - View full content of purchased notes
   - Content is permanently accessible after purchase

## Database Schema

### marketplace_notes Table
```sql
CREATE TABLE marketplace_notes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  price_ada DECIMAL NOT NULL,
  seller_wallet_address VARCHAR(200) NOT NULL,
  seller_id BIGINT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  view_count INT NOT NULL DEFAULT 0,
  purchase_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id)
);
```

### note_purchases Table
```sql
CREATE TABLE note_purchases (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  marketplace_note_id BIGINT NOT NULL,
  buyer_id BIGINT NOT NULL,
  purchase_price_ada DECIMAL NOT NULL,
  transaction_hash VARCHAR(100) NOT NULL UNIQUE,
  buyer_wallet_address VARCHAR(200) NOT NULL,
  seller_wallet_address VARCHAR(200) NOT NULL,
  purchased_at TIMESTAMP NOT NULL,
  FOREIGN KEY (marketplace_note_id) REFERENCES marketplace_notes(id),
  FOREIGN KEY (buyer_id) REFERENCES users(id)
);
```

## Testing Checklist

- [ ] Backend: Create marketplace note listing
- [ ] Backend: Retrieve all active notes
- [ ] Backend: Search marketplace notes
- [ ] Backend: Get user's listings
- [ ] Backend: Get user's purchases
- [ ] Backend: Process note purchase
- [ ] Backend: Update marketplace note
- [ ] Backend: Delete (deactivate) marketplace note
- [ ] Frontend: Display marketplace notes
- [ ] Frontend: Search functionality
- [ ] Frontend: List note form with wallet integration
- [ ] Frontend: Purchase dialog
- [ ] Frontend: Cardano wallet connection
- [ ] Frontend: Transaction submission
- [ ] Frontend: Content access control (preview vs full)
- [ ] Integration: Complete purchase flow
- [ ] Integration: Prevent duplicate purchases
- [ ] Integration: Seller wallet address validation
- [ ] Integration: Transaction metadata in blockchain

## Future Enhancements

1. **Categories and Tags**
   - Add categorization for notes
   - Tag-based filtering
   - Advanced search options

2. **Reviews and Ratings**
   - Allow buyers to rate purchased notes
   - Display average rating on listings

3. **Price History**
   - Track price changes over time
   - Show price trends

4. **Bulk Purchase Discounts**
   - Offer discounts for buying multiple notes
   - Bundle deals

5. **Escrow System**
   - Hold funds until buyer confirms satisfaction
   - Dispute resolution mechanism

6. **Analytics Dashboard**
   - Seller statistics
   - Revenue tracking
   - Popular notes and trends

7. **NFT Integration**
   - Mint purchased notes as NFTs
   - Unique ownership verification
   - Resale marketplace

8. **Multi-Currency Support**
   - Support other cryptocurrencies
   - Fiat currency options
