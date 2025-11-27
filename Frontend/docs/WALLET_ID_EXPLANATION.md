# Wallet ID vs Addresses - Explanation

## Why Your Lace Wallet ID is Different from the Application

### Understanding the Difference

When you look at your **Lace wallet** and compare it to what's shown in the **ReMe-Notes application**, you'll notice they display different identifiers. Here's why:

---

## 1. **Lace Wallet ID** (What you see in Lace)

The **Wallet ID** shown in Lace is:
- An **internal identifier** used by the Lace wallet application
- A **user-friendly name or label** you may have given your wallet
- Used for **wallet management** within the Lace interface
- **NOT** a blockchain address
- Examples: "My Wallet", "Wallet 1", or an internal UUID

**Purpose:** Helps you identify and manage multiple wallets within Lace.

---

## 2. **Cardano Addresses** (What the application shows)

The **addresses** shown in the ReMe-Notes application are:
- **Actual Cardano blockchain addresses** (in hex format from CIP-30)
- **Public addresses** that can receive ADA and other assets
- **Derived from your wallet's cryptographic keys**
- **Used for transactions** on the Cardano blockchain
- Examples: `82d818582183581c...` (hex format) or `addr_test1q...` (bech32 format)

**Purpose:** These are the actual addresses where your ADA is stored on the blockchain.

---

## 3. **How They Relate**

```
┌─────────────────────────────────────────┐
│         Your Lace Wallet                │
│  (Wallet ID: "My Wallet" or UUID)       │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Cryptographic Keys (Private)     │  │
│  │  - Never exposed to applications  │  │
│  └───────────────────────────────────┘  │
│              │                          │
│              ▼                          │
│  ┌───────────────────────────────────┐  │
│  │  Derived Addresses (Public)       │  │
│  │  - addr_test1q... (used)         │  │
│  │  - addr_test1r... (unused)       │  │
│  │  - addr_test1s... (change)        │  │
│  └───────────────────────────────────┘  │
│              │                          │
│              ▼                          │
│  ┌───────────────────────────────────┐  │
│  │  Application sees these addresses │  │
│  │  via CIP-30 API                   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 4. **What the Application Actually Sees**

When you connect your Lace wallet to the ReMe-Notes application:

1. **The application does NOT see:**
   - Your wallet's internal ID/name
   - Your private keys
   - Your wallet's internal structure

2. **The application DOES see (via CIP-30):**
   - Your **public addresses** (used and unused)
   - Your **UTXOs** (unspent transaction outputs)
   - Your **balance** (calculated from UTXOs)
   - Your **network** (Preview/Mainnet)
   - Your **change address** (for transactions)

---

## 5. **Why This Design?**

### Security
- **Private keys never leave your wallet** - The application never sees them
- **Only public addresses are shared** - Safe to expose
- **You control what the app can do** - Via wallet approval dialogs

### Privacy
- The application can't identify which specific Lace wallet you're using
- It only sees the addresses you're using on the blockchain
- Multiple Lace wallets could have similar addresses (different keys)

### Flexibility
- One Lace wallet can have **many addresses**
- Addresses are derived deterministically from your keys
- You can generate new addresses as needed

---

## 6. **Verifying It's Your Wallet**

To verify the application is connected to **your** Lace wallet, check:

### ✅ **In the Browser Console:**
When you connect, you'll see logs like:
```
📊 [Cardano] WALLET SUMMARY:
   Wallet: Lace v1.x.x
   Network: Preview Testnet (ID: 0)
   Total Addresses: X
   Balance: X.XXXXXX ADA
   Change Address: 82d818582183581c...
```

### ✅ **Compare Addresses:**
1. **In Lace wallet:** Go to "Receive" or "Addresses" section
2. **In the application:** Check the addresses shown in the Wallet Panel
3. **They should match!** The addresses in the app should be the same as in Lace

### ✅ **Check Balance:**
- The balance shown in the application should match your Lace wallet balance
- If they differ, it might be due to:
  - Pending transactions
  - Different network (Preview vs Mainnet)
  - UTXO calculation differences

---

## 7. **Common Confusion Points**

### ❌ **"The wallet ID is different"**
- **Correct!** The wallet ID is Lace's internal identifier
- The application doesn't need or see this ID
- What matters is that the **addresses match**

### ❌ **"Why can't I see my wallet name?"**
- CIP-30 doesn't expose wallet names/IDs for privacy
- The application only knows it's "Lace" wallet, not which specific wallet
- This is by design for security

### ❌ **"The addresses look different"**
- Lace might show addresses in **bech32 format** (`addr_test1q...`)
- The application shows them in **hex format** (from CIP-30)
- They're the **same address**, just different representations
- You can convert between formats if needed

---

## 8. **How to Verify Connection**

### Step 1: Check Console Logs
Open browser DevTools (F12) → Console tab, then connect your wallet. You should see:
```
🔍 [Cardano] Detecting wallet...
✅ [Cardano] Lace wallet detected: { name: "Lace", version: "..." }
🔌 [Cardano] Starting wallet connection...
✅ [Cardano] Wallet enabled successfully!
🌐 [Cardano] Network ID: 0 (Preview)
📍 [Cardano] Used addresses: X
💰 [Cardano] Total balance: X ADA
```

### Step 2: Compare Addresses
1. In Lace: Copy one of your addresses
2. In the app: Check if that address appears in the address list
3. They should match (format might differ: bech32 vs hex)

### Step 3: Verify Balance
- Check balance in Lace wallet
- Check balance in the application
- They should be very close (might differ slightly due to pending transactions)

---

## 9. **Summary**

| Aspect | Lace Wallet Shows | Application Shows |
|--------|------------------|-------------------|
| **Identifier** | Wallet ID/Name (internal) | Public addresses (blockchain) |
| **Format** | User-friendly name | Hex addresses (CIP-30) |
| **Purpose** | Wallet management | Transaction operations |
| **Privacy** | Internal to Lace | Public on blockchain |
| **Security** | Never shared | Safe to share |

**Key Takeaway:** The "wallet ID" in Lace and the "addresses" in the application are **different things** serving **different purposes**. The addresses are what matter for blockchain operations, and they should match between Lace and the application.

---

## 10. **Troubleshooting**

### If addresses don't match:
1. **Check network:** Both should be on Preview testnet
2. **Refresh:** Click refresh in the application
3. **Reconnect:** Disconnect and reconnect the wallet
4. **Check console:** Look for error messages in browser console

### If balance doesn't match:
1. **Wait for sync:** Lace might need time to sync
2. **Check pending:** Pending transactions affect balance
3. **Verify network:** Must be same network (Preview)
4. **Check UTXOs:** Application calculates from UTXOs, might differ slightly

---

**Remember:** The application connects to your wallet via CIP-30, which only exposes public information (addresses, balance, UTXOs). Your private keys and wallet ID never leave your Lace wallet. This is by design for security! 🔒


