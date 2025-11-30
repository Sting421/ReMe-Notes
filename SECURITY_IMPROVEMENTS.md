# Security Improvements for NotePurchase and Transaction Data

## Overview
This document outlines the security improvements implemented to protect buyer and seller wallet addresses from potential hacking attempts through address correlation and social engineering attacks.

## Security Concerns Addressed

### 1. **Wallet Address Exposure**
- **Risk**: Full wallet addresses exposed in transaction history could be used for:
  - Social engineering attacks
  - Address correlation to identify users
  - Targeted phishing attempts
  - Wallet enumeration attacks

### 2. **Buyer/Seller Information Correlation**
- **Risk**: Exposing both buyer and seller addresses together with usernames creates a mapping that attackers could exploit

## Implemented Solutions

### Backend Security Improvements

#### 1. Address Masking Utility (`AddressMaskingUtil.java`)
- Created a utility class to mask wallet addresses
- Format: Shows first 8 characters + "..." + last 8 characters
- Example: `addr1qxy...xyz789` instead of full address
- Methods:
  - `maskAddress(String address)`: Masks any address
  - `maskAddressForUser(String address, String userAddress)`: Shows full address only if it belongs to the user

#### 2. Transaction Service Updates
- **TransactionResponseDto**: All wallet addresses are now masked
- Users can only see masked versions of addresses in transaction history
- Full addresses are available on blockchain explorers (CardanoScan) via transaction hash

#### 3. Marketplace Service Updates
- **Purchase History (Buyer View)**:
  - Buyer's own address: Shown in full (they own it)
  - Seller's address: Masked for security
  
- **Sales History (Seller View)**:
  - Seller's own address: Shown in full (they own it)
  - Buyer's address: Masked for security

- **Marketplace Listings**:
  - Seller addresses remain visible (needed for payment transactions)
  - These function like public payment addresses
  - Buyer addresses are never exposed in listings

#### 4. Secure Endpoint for Purchase
- New endpoint: `GET /api/marketplace/notes/{id}/seller-address`
- Returns seller address only when:
  - Note is active and available
  - User is not the seller
  - User hasn't already purchased the note
- Can be used for additional security layers in the future

### Frontend Security Improvements

#### 1. Transaction History Display
- Visual indicators for masked addresses:
  - "Protected" badge shown when address is masked
  - Security message: "Address masked for security"
- Improved address formatting:
  - Detects already-masked addresses from backend
  - Consistent masking format (8 chars + ... + 8 chars)
  - Monospace font for better readability

#### 2. Purchase History Display
- Security badges on masked addresses
- Clear indication that addresses are protected
- Users can still view full transaction details on CardanoScan via transaction hash

## Security Principles Applied

1. **Principle of Least Privilege**: Users only see full addresses for their own wallets
2. **Data Minimization**: Only necessary information is exposed
3. **Defense in Depth**: Multiple layers of protection:
   - Backend masking
   - Frontend indicators
   - Access control checks
4. **Transparency**: Users are informed when addresses are masked and why

## User Experience

- Users can still:
  - View their own wallet addresses in full
  - See transaction hashes (for blockchain verification)
  - Access full transaction details on CardanoScan
  - Complete purchases (seller addresses visible for payment)

- Security features:
  - Masked addresses prevent correlation attacks
  - Visual indicators inform users about security measures
  - No impact on legitimate transaction functionality

## Future Enhancements

1. **Rate Limiting**: Add rate limiting to the seller address endpoint
2. **Audit Logging**: Log access to sensitive address information
3. **Optional Full Address View**: Allow users to temporarily view full addresses with additional authentication
4. **Address Verification**: Add verification step before showing full addresses

## Testing Recommendations

1. Verify that buyer addresses are masked in purchase history
2. Verify that seller addresses are masked in sales history (for non-owners)
3. Verify that users can see their own addresses in full
4. Verify that marketplace listings show seller addresses (needed for payment)
5. Verify that transaction history shows masked addresses
6. Verify that CardanoScan links work correctly with transaction hashes

## Notes

- Seller wallet addresses in marketplace listings are intentionally kept visible as they are needed for payment transactions (similar to public payment addresses)
- The primary security focus is on protecting buyer addresses and preventing address correlation attacks
- All sensitive address information is masked by default, with full addresses only shown when necessary and authorized

