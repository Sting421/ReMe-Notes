# Cardano Wallet Integration

This document describes the Lace wallet (CIP-30) integration added to the ReMe-Notes frontend application.

## Overview

The integration provides a complete Cardano wallet connection and transaction functionality using:
- **CIP-30** standard for wallet communication
- **Lace wallet** as the primary wallet provider
- **Cardano Serialization Library (CSL)** for transaction building
- **Blockfrost** (optional) for chain queries and transaction submission
- **Preview testnet** as the target network

## Files Added

### Core Hook
- `src/hooks/useCardano.tsx` - Main React hook for wallet operations

### Components
- `src/components/CardanoWallet/WalletButton.tsx` - Connect/disconnect button
- `src/components/CardanoWallet/WalletPanel.tsx` - Wallet information and send form
- `src/components/CardanoWallet/index.ts` - Component exports

### Configuration
- `src/main.tsx` - Added Buffer polyfill for Vite

### Dependencies Added
- `@blaze-cardano/sdk` - Blaze Cardano SDK (for future enhancements)
- `@emurgo/cardano-serialization-lib-browser` - Cardano transaction serialization
- `buffer` - Buffer polyfill for browser environment

## Environment Variables

Create a `.env` file in the `Frontend` directory with the following variables:

```env
# Blockfrost Configuration (optional, for transaction submission fallback)
VITE_BLOCKFROST_PROJECT_ID=your_blockfrost_project_id_here

# Cardano Network (defaults to "preview" if not set)
VITE_CARDANO_NETWORK=preview
```

### Getting a Blockfrost Project ID

1. Visit [Blockfrost.io](https://blockfrost.io)
2. Sign up for a free account
3. Create a new project for **Preview testnet**
4. Copy your project ID and add it to `.env`

**Note:** The Blockfrost project ID is only required if you want to use Blockfrost for transaction submission. The wallet's built-in `submitTx` method is preferred and will be used if available.

## Usage

### Basic Integration

```tsx
import { WalletButton, WalletPanel } from "@/components/CardanoWallet";

function MyComponent() {
  return (
    <div>
      <WalletButton />
      <WalletPanel />
    </div>
  );
}
```

### Using the Hook Directly

```tsx
import { useCardano } from "@/hooks/useCardano";

function MyComponent() {
  const {
    isConnected,
    balanceADA,
    addresses,
    connect,
    disconnect,
    sendTransaction,
  } = useCardano();

  // Your component logic
}
```

## Features

### Wallet Connection
- Detects Lace wallet extension
- Connects via CIP-30 `enable()` method
- Verifies network (must be Preview testnet)
- Shows connection status and network information

### Wallet Information
- **Balance**: Displayed in both ADA (6 decimal places) and lovelace
- **Addresses**: Shows all used and unused addresses
- **UTXO Count**: Number of unspent transaction outputs
- **Refresh**: Manual refresh button to update wallet data

### Transaction Sending
- Send ADA to any Cardano address
- Input validation (amount, balance checks)
- Automatic change calculation
- Transaction signing via wallet
- Submission via wallet or Blockfrost fallback

## Testing on Preview Testnet

### Prerequisites

1. **Install Lace Wallet**
   - Download from [Lace.io](https://www.lace.io/)
   - Install the browser extension
   - Create or import a wallet

2. **Switch to Preview Testnet**
   - Open Lace wallet extension
   - Go to Settings → Network
   - Select **Preview** testnet
   - Save settings

3. **Get Test ADA**
   - Visit the [Cardano Preview Testnet Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet)
   - Enter your wallet address
   - Request test ADA (usually 1000-10000 ADA per request)
   - Wait for confirmation (may take a few minutes)

### Running the Application

```bash
cd Frontend
npm run dev
```

The application will start on `http://localhost:5137` (or the port configured in `vite.config.ts`).

### Testing Workflow

1. **Connect Wallet**
   - Click "Connect Lace Wallet" button
   - Approve connection in Lace wallet popup
   - Verify network shows "Preview"

2. **View Wallet Info**
   - Check balance (should show your test ADA)
   - View addresses
   - Check UTXO count

3. **Send Transaction**
   - Enter a recipient address (hex format from CIP-30)
   - Enter amount in ADA
   - Click "Send Transaction"
   - Approve in Lace wallet
   - Wait for confirmation

## Production Readiness Warnings

⚠️ **This implementation is NOT production-ready** and contains several placeholders:

### Critical TODOs

1. **Fee Calculation**
   - Currently uses a conservative placeholder fee (200,000 lovelace)
   - **TODO**: Fetch protocol parameters from Blockfrost and calculate `min_fee` using CSL
   - Location: `useCardano.tsx` - `sendTransaction` function

2. **TTL (Time to Live)**
   - Currently uses placeholder slot number (0)
   - **TODO**: Fetch current slot from Blockfrost: `GET /api/v0/blocks/latest`
   - Location: `useCardano.tsx` - `sendTransaction` function

3. **Protocol Parameters**
   - Uses hardcoded values for Preview testnet
   - **TODO**: Fetch actual protocol parameters from Blockfrost: `GET /api/v0/epochs/latest/parameters`
   - Location: `useCardano.tsx` - `sendTransaction` function

4. **UTXO Selection**
   - Currently uses simple first-fit algorithm
   - **TODO**: Implement proper UTXO selection (coin selection algorithm)
   - Consider dust UTXOs and optimal change calculation

5. **Address Format Handling**
   - Currently assumes hex format from CIP-30
   - **TODO**: Add proper bech32 address support and conversion
   - Location: `useCardano.tsx` and `WalletPanel.tsx`

6. **Error Handling**
   - Basic error handling implemented
   - **TODO**: Add comprehensive error handling for network failures, insufficient funds, etc.

7. **Transaction Validation**
   - Minimal validation currently
   - **TODO**: Add full transaction validation before submission

## Security Considerations

- **Never commit** `.env` file with real Blockfrost project IDs
- **Never hardcode** private keys or sensitive data
- **Always validate** user inputs (addresses, amounts)
- **Use HTTPS** in production
- **Implement rate limiting** for transaction submissions
- **Add transaction confirmation** dialogs for large amounts

## Network IDs

- **Preview Testnet**: `0`
- **Mainnet**: `1`

The integration currently only supports Preview testnet. To support mainnet:
1. Change `PREVIEW_NETWORK_ID` constant in `useCardano.tsx`
2. Update Blockfrost project to mainnet
3. Update `VITE_CARDANO_NETWORK` to `mainnet`
4. **WARNING**: Never use test code on mainnet without thorough testing

## Troubleshooting

### Wallet Not Detected
- Ensure Lace wallet extension is installed and enabled
- Refresh the page after installing the extension
- Check browser console for errors

### Network Mismatch
- Verify Lace wallet is set to Preview testnet
- Check network ID in wallet settings
- Restart the application after changing network

### Transaction Failures
- Verify sufficient balance (including fees)
- Check recipient address format (should be hex from CIP-30)
- Ensure wallet is unlocked
- Check Blockfrost project ID if using fallback submission

### Balance Not Updating
- Click refresh button in WalletPanel
- Check if transaction was actually confirmed on chain
- Verify network connection

## Future Enhancements

- [ ] Support for multiple wallet providers (Nami, Eternl, etc.)
- [ ] Native token support
- [ ] Smart contract interaction
- [ ] Transaction history
- [ ] Multi-signature support
- [ ] Hardware wallet support
- [ ] Proper fee calculation using protocol parameters
- [ ] Advanced UTXO selection algorithms
- [ ] Transaction batching
- [ ] Offline transaction building

## Resources

- [CIP-30 Specification](https://cips.cardano.org/cips/cip30/)
- [Cardano Serialization Library](https://github.com/Emurgo/cardano-serialization-lib)
- [Blockfrost API Documentation](https://docs.blockfrost.io/)
- [Lace Wallet Documentation](https://www.lace.io/)
- [Cardano Preview Testnet Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify all environment variables are set correctly
4. Ensure wallet is properly configured for Preview testnet

