import { useState, useEffect, useCallback } from "react";
import * as CSL from "@emurgo/cardano-serialization-lib-browser";

// CIP-30 Wallet API types
interface WalletApi {
  getNetworkId: () => Promise<number>;
  getUtxos: () => Promise<string[] | undefined>;
  getBalance: () => Promise<string>;
  getUsedAddresses: () => Promise<string[]>;
  getUnusedAddresses: () => Promise<string[]>;
  getChangeAddress: () => Promise<string>;
  getRewardAddresses: () => Promise<string[]>;
  signTx: (tx: string, partialSign?: boolean) => Promise<string>;
  signData: (addr: string, payload: string) => Promise<{ signature: string; key: string }>;
  submitTx: (tx: string) => Promise<string>;
  getCollateral?: () => Promise<string[] | undefined>;
  experimental?: {
    [key: string]: any;
  };
}

interface WalletInfo {
  name: string;
  icon: string;
  version: string;
  apiVersion: string;
  enable: () => Promise<WalletApi>;
  isEnabled: () => Promise<boolean>;
}

interface CardanoWindow extends Window {
  cardano?: {
    lace?: WalletInfo;
    [key: string]: WalletInfo | undefined;
  };
}

declare const window: CardanoWindow;

interface UseCardanoReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  walletApi: WalletApi | null;
  walletName: string | null;
  networkId: number | null;
  
  // Wallet data
  addresses: string[];
  balance: bigint; // in lovelace
  balanceADA: string; // formatted ADA
  utxoCount: number;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
  sendTransaction: (recipientAddress: string, amountADA: number) => Promise<string>;
  
  // Errors
  error: string | null;
  wallets: Array<{ key: string; name: string; icon?: string }>;
  walletKey: string | null;
  setWalletKey: (key: string) => void;
}

const PREVIEW_NETWORK_ID = 0; // Preview testnet network ID
const LOVELACE_PER_ADA = 1_000_000n;

// Get all available wallets from window.cardano
function getWalletsFromWindow(): Array<{ key: string; name: string; icon?: string; info: WalletInfo }> {
  if (typeof window === "undefined" || !window.cardano) return [];
  return Object.entries(window.cardano)
    .filter(([_key, w]: any) => !!w && typeof w.enable === "function" && typeof w.name === "string")
    .map(([key, w]: any) => ({ key, name: w.name, icon: w.icon, info: w }));
}

export const useCardano = (): UseCardanoReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletApi, setWalletApi] = useState<WalletApi | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [networkId, setNetworkId] = useState<number | null>(null);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [balance, setBalance] = useState<bigint>(0n);
  const [utxoCount, setUtxoCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [walletKey, setWalletKey] = useState<string | null>(null);
  const [wallets, setWallets] = useState<Array<{ key: string; name: string; icon?: string }>>([]);

  // Format balance as ADA
  const balanceADA = (Number(balance) / Number(LOVELACE_PER_ADA)).toFixed(6);

  // On mount/discovery: update wallets and default selection
  useEffect(() => {
    const found = getWalletsFromWindow();
    setWallets(found);
    if (!walletKey && found.length > 0) setWalletKey(found[0].key);
  }, [walletKey]);

  // Get WalletInfo for the current walletKey
  const getCurrentWallet = useCallback((): WalletInfo | null => {
    if (!walletKey) return null;
    if (typeof window === "undefined" || !window.cardano) return null;
    const w = window.cardano[walletKey];
    return w && typeof w.enable === "function" ? w : null;
  }, [walletKey]);

  // Connect using selected walletKey
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    const wallet = getCurrentWallet();
    if (!wallet) {
      setIsConnecting(false);
      throw new Error("No wallet selected or wallet extension not found");
    }
    try {
      // See if already enabled
      await wallet.isEnabled?.(); // for some wallets side effect
      const api = await wallet.enable();
      setWalletApi(api);
      setWalletName(wallet.name);
      // rest unchanged (network, addresses, utxos, etc, as before...)
      const networkId = await api.getNetworkId();
      setNetworkId(networkId);
      setIsConnected(true);
      // Addresses
      const usedAddresses = await api.getUsedAddresses();
      const unusedAddresses = await api.getUnusedAddresses();
      setAddresses([...usedAddresses, ...unusedAddresses]);
      // UTXOs
      const utxos = await api.getUtxos();
      setUtxoCount(utxos ? utxos.length : 0);
      let totalBalance = 0n;
      if (utxos) for (let u of utxos) {
        try {
          const utxo = CSL.TransactionUnspentOutput.from_bytes(Buffer.from(u, 'hex'));
          totalBalance += BigInt(utxo.output().amount().coin().to_str());
        } catch {}
      }
      setBalance(totalBalance);
    } catch (err: any) {
      setError(err.message || "Failed to connect to wallet");
      setIsConnected(false);
      setWalletApi(null);
      setWalletName(null);
    } finally {
      setIsConnecting(false);
    }
  }, [getCurrentWallet]);

  // Refresh wallet data
  const refresh = useCallback(async () => {
    if (!walletApi) {
      console.warn("⚠️ [Cardano] Cannot refresh: wallet not connected");
      return;
    }

    console.log("🔄 [Cardano] Refreshing wallet data...");
    try {
      setError(null);

      // Get addresses
      const usedAddresses = await walletApi.getUsedAddresses();
      const unusedAddresses = await walletApi.getUnusedAddresses();
      const allAddresses = [...usedAddresses, ...unusedAddresses];
      setAddresses(allAddresses);
      console.log(`📍 [Cardano] Refresh - Addresses: ${allAddresses.length} total`);

      // Get UTXOs and calculate balance
      const utxos = await walletApi.getUtxos();
      if (utxos) {
        setUtxoCount(utxos.length);
        
        // Parse UTXOs and sum balance
        let totalBalance = 0n;
        for (const utxoHex of utxos) {
          try {
            const utxoBytes = Buffer.from(utxoHex, "hex");
            const utxo = CSL.TransactionUnspentOutput.from_bytes(utxoBytes);
            const output = utxo.output();
            const amount = output.amount();
            const coin = amount.coin();
            totalBalance += BigInt(coin.to_str());
          } catch (e) {
            console.warn("⚠️ [Cardano] Failed to parse UTXO:", e);
          }
        }
        console.log(`💰 [Cardano] Refresh - Balance: ${Number(totalBalance) / 1_000_000} ADA`);
        setBalance(totalBalance);
      } else {
        console.log("💰 [Cardano] Refresh - No UTXOs found");
        setUtxoCount(0);
        setBalance(0n);
      }
      console.log("✅ [Cardano] Wallet data refreshed");
    } catch (err: any) {
      console.error("❌ [Cardano] Refresh failed:", err);
      setError(err.message || "Failed to refresh wallet data");
    }
  }, [walletApi]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    console.log("🔌 [Cardano] Disconnecting wallet...");
    setIsConnected(false);
    setWalletApi(null);
    setWalletName(null);
    setNetworkId(null);
    setAddresses([]);
    setBalance(0n);
    setUtxoCount(0);
    setError(null);
    console.log("✅ [Cardano] Wallet disconnected");
  }, []);

  // Send transaction
  const sendTransaction = useCallback(async (recipientAddress: string, amountADA: number): Promise<string> => {
    console.log("📤 [Cardano] Starting transaction...");
    console.log(`📤 [Cardano] Recipient: ${recipientAddress.substring(0, 20)}...`);
    console.log(`📤 [Cardano] Amount: ${amountADA} ADA`);
    
    if (!walletApi) {
      console.error("❌ [Cardano] Wallet not connected");
      throw new Error("Wallet not connected");
    }

    if (amountADA <= 0) {
      console.error("❌ [Cardano] Invalid amount");
      throw new Error("Amount must be greater than 0");
    }

    const amountLovelace = BigInt(Math.floor(amountADA * Number(LOVELACE_PER_ADA)));
    console.log(`💰 [Cardano] Amount in lovelace: ${amountLovelace}`);
    
    if (amountLovelace > balance) {
      console.error(`❌ [Cardano] Insufficient balance. Have: ${balance}, Need: ${amountLovelace}`);
      throw new Error("Insufficient balance");
    }

    try {
      setError(null);
      console.log("🔨 [Cardano] Building transaction...");

      // Get UTXOs
      console.log("💎 [Cardano] Fetching UTXOs for transaction...");
      const utxos = await walletApi.getUtxos();
      console.log(`💎 [Cardano] Available UTXOs: ${utxos ? utxos.length : 0}`);
      if (!utxos || utxos.length === 0) {
        console.error("❌ [Cardano] No UTXOs available");
        throw new Error("No UTXOs available");
      }

      // Get change address
      console.log("💰 [Cardano] Getting change address...");
      const changeAddress = await walletApi.getChangeAddress();
      console.log(`💰 [Cardano] Change address: ${changeAddress.substring(0, 20)}...`);

      // Parse recipient address (supports both hex and bech32)
      let recipientAddr: CSL.Address;
      try {
        // Try parsing as hex first (CIP-30 format)
        if (recipientAddress.startsWith("0x")) {
          recipientAddr = CSL.Address.from_bytes(Buffer.from(recipientAddress.slice(2), "hex"));
        } else if (recipientAddress.length > 50 && /^[0-9a-fA-F]+$/.test(recipientAddress)) {
          // Hex without 0x prefix
          recipientAddr = CSL.Address.from_bytes(Buffer.from(recipientAddress, "hex"));
        } else {
          // Assume bech32 format
          recipientAddr = CSL.Address.from_bech32(recipientAddress);
        }
      } catch (e) {
        throw new Error(`Invalid recipient address format: ${e instanceof Error ? e.message : "Unknown error"}`);
      }

      // Build transaction using CSL TransactionBuilder
      // TODO: production - fetch actual protocol parameters from Blockfrost
      // These are placeholder values for Preview testnet (UNSAFE FOR PRODUCTION)
      const linearFee = CSL.LinearFee.new(
        CSL.BigNum.from_str("44"), // min_fee_a
        CSL.BigNum.from_str("155381") // min_fee_b
      );
      
      // Create TransactionBuilderConfig
      const txBuilderConfig = CSL.TransactionBuilderConfigBuilder.new()
        .fee_algo(linearFee)
        .coins_per_utxo_word(CSL.BigNum.from_str("34482")) // min_utxo calculation
        .pool_deposit(CSL.BigNum.from_str("500000000"))
        .key_deposit(CSL.BigNum.from_str("2000000"))
        .max_value_size(5000)
        .max_tx_size(16384)
        .build();
      
      const txBuilder = CSL.TransactionBuilder.new(txBuilderConfig);

      // Collect UTXOs and calculate total input
      let totalInput = 0n;
      const selectedUtxos: CSL.TransactionUnspentOutput[] = [];
      
      for (const utxoHex of utxos) {
        try {
          const utxoBytes = Buffer.from(utxoHex, "hex");
          const utxo = CSL.TransactionUnspentOutput.from_bytes(utxoBytes);
          const output = utxo.output();
          const amount = output.amount();
          const coin = BigInt(amount.coin().to_str());
          
          selectedUtxos.push(utxo);
          totalInput += coin;
          
          // Add input to transaction builder
          txBuilder.add_input(
            utxo.output().address(),
            utxo.input(),
            CSL.Value.new(amount.coin())
          );
          
          // Stop if we have enough (amount + estimated fee + min change)
          const estimatedFee = 200000n; // Conservative placeholder
          const minChange = 1000000n; // 1 ADA minimum
          if (totalInput >= amountLovelace + estimatedFee + minChange) {
            break;
          }
        } catch (e) {
          console.warn("Failed to parse UTXO:", e);
          continue;
        }
      }

      if (selectedUtxos.length === 0) {
        throw new Error("No valid UTXOs found");
      }

      if (totalInput < amountLovelace + 200000n) {
        throw new Error("Insufficient UTXOs to cover amount and fees");
      }

      // Add output to recipient
      const recipientAmount = CSL.Value.new(CSL.BigNum.from_str(amountLovelace.toString()));
      txBuilder.add_output(
        CSL.TransactionOutput.new(recipientAddr, recipientAmount)
      );

      // Calculate change (totalInput - amount - estimated fee)
      // TODO: production - calculate actual fee using txBuilder.min_fee() after building
      const estimatedFee = 200000n; // Conservative placeholder
      const changeAmount = totalInput - amountLovelace - estimatedFee;

      // Add change output if change is above minimum UTXO (1 ADA)
      const minUtxo = 1000000n;
      if (changeAmount >= minUtxo) {
        const changeAddr = CSL.Address.from_bytes(Buffer.from(changeAddress, "hex"));
        const changeValue = CSL.Value.new(CSL.BigNum.from_str(changeAmount.toString()));
        txBuilder.add_output(
          CSL.TransactionOutput.new(changeAddr, changeValue)
        );
      }

      // Set TTL (Time to Live) - TODO: production - fetch current slot from Blockfrost
      // For now using a placeholder (UNSAFE - transaction may expire)
      const currentSlot = 0; // Should fetch from: GET /api/v0/blocks/latest
      const ttl = currentSlot + 3600; // 1 hour buffer
      txBuilder.set_ttl(ttl);

      // Build transaction body
      const txBody = txBuilder.build();

      // Serialize transaction body to CBOR hex
      const txBodyBytes = txBody.to_bytes();
      const txBodyHex = Buffer.from(txBodyBytes).toString("hex");

      // Sign transaction via wallet
      console.log("✍️ [Cardano] Signing transaction via wallet...");
      const signedTxHex = await walletApi.signTx(txBodyHex, true);
      console.log(`✍️ [Cardano] Transaction signed. Signed TX length: ${signedTxHex.length} bytes`);

      // Submit transaction
      console.log("📡 [Cardano] Submitting transaction...");
      let txHash: string;
      if (walletApi.submitTx) {
        // Use wallet's submitTx if available
        console.log("📡 [Cardano] Using wallet's submitTx method...");
        txHash = await walletApi.submitTx(signedTxHex);
        console.log(`✅ [Cardano] Transaction submitted via wallet. TX Hash: ${txHash}`);
      } else {
        console.log("📡 [Cardano] Wallet submitTx not available, using Blockfrost fallback...");
        // Fallback to Blockfrost submission
        const blockfrostProjectId = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
        if (!blockfrostProjectId) {
          throw new Error("Blockfrost project ID not configured. Set VITE_BLOCKFROST_PROJECT_ID in .env");
        }

        const network = import.meta.env.VITE_CARDANO_NETWORK || "preview";
        const blockfrostUrl = `https://cardano-${network}.blockfrost.io/api/v0`;
        
        const response = await fetch(`${blockfrostUrl}/tx/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/cbor",
            "project_id": blockfrostProjectId,
          },
          body: Buffer.from(signedTxHex, "hex"),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Blockfrost submission failed: ${errorText}`);
        }

        const result = await response.json();
        txHash = result.hash || signedTxHex.substring(0, 64); // Fallback if no hash in response
      }

      // Refresh balance after successful send
      console.log("🔄 [Cardano] Refreshing balance after transaction...");
      await refresh();

      console.log("✅ [Cardano] Transaction completed successfully!");
      console.log(`📊 [Cardano] Transaction Hash: ${txHash}`);
      return txHash;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to send transaction";
      console.error("❌ [Cardano] Transaction failed:", errorMsg);
      setError(errorMsg);
      throw err;
    }
  }, [walletApi, balance, refresh]);

  // Auto-refresh on connection
  useEffect(() => {
    if (isConnected && walletApi) {
      refresh();
    }
  }, [isConnected, walletApi, refresh]);

  return {
    isConnected,
    isConnecting,
    walletApi,
    walletName,
    networkId,
    addresses,
    balance,
    balanceADA,
    utxoCount,
    connect,
    disconnect,
    refresh,
    sendTransaction,
    error,
    wallets,
    walletKey,
    setWalletKey,
  };
};

