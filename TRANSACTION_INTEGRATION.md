# Transaction Integration Documentation

## Overview
Successfully integrated Cardano wallet transactions with the ReMe Notes application. Every transaction can now be linked to notes with metadata that connects to the note application.

## Backend Changes

### 1. New Entity: Transaction
- **File**: `Backend/src/main/java/com/ReMe/ReMe/entity/Transaction.java`
- **Fields**:
  - `id`: Primary key
  - `txHash`: Unique transaction hash from Cardano blockchain
  - `senderAddress`: Sender's Cardano address
  - `recipientAddress`: Recipient's Cardano address
  - `amountADA`: Transaction amount in ADA
  - `note`: Many-to-one relationship with Note entity (optional)
  - `user`: Many-to-one relationship with User entity (required)
  - `networkId`: Cardano network ID (0 for Preview testnet)
  - `metadata`: Additional transaction metadata (TEXT field)
  - `createdAt`: Timestamp

### 2. Repository
- **File**: `Backend/src/main/java/com/ReMe/ReMe/repository/TransactionRepository.java`
- **Methods**:
  - `findByUserOrderByCreatedAtDesc()`: Get user's transactions
  - `findByTxHash()`: Find transaction by hash
  - `findByNoteId()`: Get transactions linked to a note
  - `existsByTxHash()`: Check if transaction exists

### 3. DTOs
- **TransactionDto**: For creating transactions
  - Validates required fields (txHash, addresses, amount)
  - Optional noteId for linking
  - Optional metadata field
  
- **TransactionResponseDto**: For returning transaction data
  - Includes all transaction fields
  - Includes note title if linked

### 4. Service Layer
- **File**: `Backend/src/main/java/com/ReMe/ReMe/service/TransactionService.java`
- **Methods**:
  - `createTransaction()`: Record new transaction with optional note link
  - `getUserTransactions()`: Get all user transactions
  - `getTransactionByHash()`: Get specific transaction
  - `getNoteTransactions()`: Get all transactions for a note

### 5. Controller
- **File**: `Backend/src/main/java/com/ReMe/ReMe/controller/TransactionController.java`
- **Endpoints**:
  - `POST /api/transactions`: Create new transaction
  - `GET /api/transactions`: Get user's transactions
  - `GET /api/transactions/{txHash}`: Get transaction by hash
  - `GET /api/transactions/note/{noteId}`: Get note's transactions

## Frontend Changes

### 1. API Client
- **File**: `Frontend/src/lib/api.ts`
- **New Interfaces**:
  - `Transaction`: TypeScript interface for transaction data
  - `CreateTransactionDto`: Interface for creating transactions
  
- **New API Methods**:
  - `transactionsAPI.createTransaction()`: Record transaction
  - `transactionsAPI.getUserTransactions()`: Fetch user transactions
  - `transactionsAPI.getTransactionByHash()`: Get specific transaction
  - `transactionsAPI.getNoteTransactions()`: Get note transactions

### 2. Wallet Panel Enhancement
- **File**: `Frontend/src/components/CardanoWallet/WalletPanel.tsx`
- **New Features**:
  - Added note selector dropdown in send transaction form
  - Loads user's notes on wallet connection
  - Automatically records transactions to backend after blockchain submission
  - Links transactions to selected note if chosen
  - Provides feedback on successful transaction recording

## How It Works

### Transaction Flow:
1. User connects Cardano wallet (Lace)
2. User fills out transaction form:
   - Recipient address
   - Amount in ADA
   - Optional: Select note to link
3. User submits transaction
4. Transaction is sent to Cardano blockchain
5. Upon successful blockchain submission, transaction is recorded to backend:
   - Transaction hash
   - Sender/recipient addresses
   - Amount
   - Network ID (Preview testnet = 0)
   - Link to note (if selected)
   - Metadata
6. User receives confirmation toast
7. Transaction is now queryable via API

### Data Linkage:
- Transactions can optionally be linked to notes
- Multiple transactions can be linked to the same note
- Transactions maintain sender address for tracking
- All transactions are tied to the authenticated user

## Database Schema

```sql
CREATE TABLE transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tx_hash VARCHAR(255) NOT NULL UNIQUE,
    sender_address VARCHAR(255) NOT NULL,
    recipient_address VARCHAR(255) NOT NULL,
    amount_ada DECIMAL(20, 6) NOT NULL,
    note_id BIGINT,
    user_id BIGINT NOT NULL,
    network_id INT,
    metadata TEXT,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (note_id) REFERENCES notes(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Security Considerations

1. **Authentication**: All transaction endpoints require JWT authentication
2. **Authorization**: Users can only access their own transactions
3. **Validation**: 
   - Transaction hashes are unique
   - Amounts must be positive
   - Addresses are validated
   - Note ownership is verified before linking
4. **Duplicate Prevention**: Transaction hashes are checked before insertion

## Future Enhancements

Potential improvements:
1. Display transaction history in note editor
2. Add transaction status tracking (pending/confirmed)
3. Export transaction history
4. Transaction search and filtering
5. Rich metadata support (JSON format)
6. Transaction analytics and reporting
7. Multi-signature transaction support
8. Transaction notes/comments

## Testing

To test the integration:
1. Start backend server: `cd Backend && ./mvnw spring-boot:run`
2. Start frontend: `cd Frontend && npm run dev`
3. Login/Register user
4. Connect Lace wallet on Preview testnet
5. Create a note
6. Send transaction with note linked
7. Verify transaction is recorded in backend

## API Examples

### Create Transaction
```http
POST /api/transactions
Authorization: Bearer {token}
Content-Type: application/json

{
  "txHash": "abc123...",
  "senderAddress": "addr_test1...",
  "recipientAddress": "addr_test1...",
  "amountADA": 10.5,
  "noteId": 1,
  "networkId": 0,
  "metadata": "Linked to note 1"
}
```

### Get User Transactions
```http
GET /api/transactions
Authorization: Bearer {token}
```

### Get Note Transactions
```http
GET /api/transactions/note/1
Authorization: Bearer {token}
```

## Conclusion

The transaction integration successfully connects Cardano blockchain transactions with the ReMe Notes application, providing a complete audit trail of transactions linked to notes. This enables use cases like expense tracking, payment records, and blockchain-based note verification.
