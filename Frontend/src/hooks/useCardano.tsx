import { useState, useEffect, useCallback, useRef } from "react";
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
  sendTransaction: (recipientAddress: string, amountADA: number, metadata?: string) => Promise<string>;
  
  // Errors
  error: string | null;
  wallets: Array<{ key: string; name: string; icon?: string }>;
  walletKey: string | null;
  setWalletKey: (key: string) => void;
}

const PREVIEW_NETWORK_ID = 0; // Preview testnet network ID
const LOVELACE_PER_ADA = 1_000_000n;

// Helper function to fetch protocol parameters from Blockfrost (Preview testnet)
async function fetchProtocolParameters(): Promise<{
  minFeeA: string;
  minFeeB: string;
  coinsPerUtxoWord: string;
  poolDeposit: string;
  keyDeposit: string;
  maxValueSize: number;
  maxTxSize: number;
}> {
  const blockfrostProjectId = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
  const network = import.meta.env.VITE_CARDANO_NETWORK || "preview";
  
  if (!blockfrostProjectId) {
    // Fallback to Preview testnet defaults if Blockfrost not configured
    console.warn("⚠️ [Cardano] Blockfrost not configured, using Preview testnet defaults");
    return {
      minFeeA: "44",
      minFeeB: "155381",
      coinsPerUtxoWord: "34482",
      poolDeposit: "500000000",
      keyDeposit: "2000000",
      maxValueSize: 5000,
      maxTxSize: 16384,
    };
  }

  try {
    const blockfrostUrl = `https://cardano-${network}.blockfrost.io/api/v0`;
    const response = await fetch(`${blockfrostUrl}/epochs/latest/parameters`, {
      headers: {
        "project_id": blockfrostProjectId,
      },
    });

    if (!response.ok) {
      throw new Error(`Blockfrost API error: ${response.status}`);
    }

    const params = await response.json();
    return {
      minFeeA: params.min_fee_a?.toString() || "44",
      minFeeB: params.min_fee_b?.toString() || "155381",
      coinsPerUtxoWord: params.coins_per_utxo_word?.toString() || "34482",
      poolDeposit: params.pool_deposit?.toString() || "500000000",
      keyDeposit: params.key_deposit?.toString() || "2000000",
      maxValueSize: params.max_val_size || 5000,
      maxTxSize: params.max_tx_size || 16384,
    };
  } catch (error) {
    console.warn("⚠️ [Cardano] Failed to fetch protocol parameters, using defaults:", error);
    // Return Preview testnet defaults on error
    return {
      minFeeA: "44",
      minFeeB: "155381",
      coinsPerUtxoWord: "34482",
      poolDeposit: "500000000",
      keyDeposit: "2000000",
      maxValueSize: 5000,
      maxTxSize: 16384,
    };
  }
}

// Helper function to fetch current slot from Blockfrost (Preview testnet)
async function fetchCurrentSlot(): Promise<number> {
  const blockfrostProjectId = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
  const network = import.meta.env.VITE_CARDANO_NETWORK || "preview";
  
  if (!blockfrostProjectId) {
    // Fallback: return a large slot number to avoid expiration
    console.warn("⚠️ [Cardano] Blockfrost not configured, using placeholder slot");
    return 100000000; // Large placeholder
  }

  try {
    const blockfrostUrl = `https://cardano-${network}.blockfrost.io/api/v0`;
    const response = await fetch(`${blockfrostUrl}/blocks/latest`, {
      headers: {
        "project_id": blockfrostProjectId,
      },
    });

    if (!response.ok) {
      throw new Error(`Blockfrost API error: ${response.status}`);
    }

    const block = await response.json();
    return block.slot || 100000000;
  } catch (error) {
    console.warn("⚠️ [Cardano] Failed to fetch current slot, using placeholder:", error);
    return 100000000; // Large placeholder to avoid expiration
  }
}

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
  
  // Global transaction mutex: only ONE transaction can run at a time
  const transactionMutexRef = useRef<boolean>(false);

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

      // Enforce Preview testnet network
      if (networkId !== PREVIEW_NETWORK_ID) {
        throw new Error(`Wrong network selected in wallet. Expected Preview testnet (id ${PREVIEW_NETWORK_ID}), got network id ${networkId}.`);
      }

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
  const sendTransaction = useCallback(async (recipientAddress: string, amountADA: number, metadata?: string): Promise<string> => {
    // Global transaction mutex: prevent concurrent transactions
    if (transactionMutexRef.current) {
      console.warn("⚠️ [Cardano] Transaction already in progress, ignoring duplicate request");
      throw new Error("A transaction is already in progress. Please wait for it to complete.");
    }

    // Acquire mutex
    transactionMutexRef.current = true;
    console.log("📤 [Cardano] Starting transaction...");
    console.log(`📤 [Cardano] Recipient: ${recipientAddress.substring(0, 20)}...`);
    console.log(`📤 [Cardano] Amount: ${amountADA} ADA`);
    if (metadata) {
      console.log(`📝 [Cardano] Metadata: ${metadata.substring(0, 100)}${metadata.length > 100 ? '...' : ''}`);
    }
    
    try {
      if (!walletApi) {
        console.error("❌ [Cardano] Wallet not connected");
        throw new Error("Wallet not connected");
      }

      // Enforce Preview network for sending as well
      if (networkId !== PREVIEW_NETWORK_ID) {
        console.error(`❌ [Cardano] Wrong network. Expected Preview testnet (id ${PREVIEW_NETWORK_ID}), got ${networkId}`);
        throw new Error("Wallet is connected to the wrong network. Please switch your wallet to Preview testnet.");
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

      // Fetch protocol parameters from Blockfrost (Preview testnet)
      console.log("📋 [Cardano] Fetching protocol parameters from Blockfrost...");
      const protocolParams = await fetchProtocolParameters();
      console.log("📋 [Cardano] Protocol parameters:", protocolParams);

      // Build transaction using CSL TransactionBuilder with actual protocol parameters
      const linearFee = CSL.LinearFee.new(
        CSL.BigNum.from_str(protocolParams.minFeeA),
        CSL.BigNum.from_str(protocolParams.minFeeB)
      );
      
      // Create TransactionBuilderConfig with Preview testnet parameters
      const txBuilderConfig = CSL.TransactionBuilderConfigBuilder.new()
        .fee_algo(linearFee)
        .coins_per_utxo_word(CSL.BigNum.from_str(protocolParams.coinsPerUtxoWord))
        .pool_deposit(CSL.BigNum.from_str(protocolParams.poolDeposit))
        .key_deposit(CSL.BigNum.from_str(protocolParams.keyDeposit))
        .max_value_size(protocolParams.maxValueSize)
        .max_tx_size(protocolParams.maxTxSize)
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

      // Fetch current slot from Blockfrost and set TTL (Time to Live) BEFORE building outputs
      // TTL must be set before adding outputs for proper fee calculation
      console.log("⏰ [Cardano] Fetching current slot from Blockfrost...");
      const currentSlot = await fetchCurrentSlot();
      // Add 2 hour buffer (7200 slots ≈ 2 hours on Preview testnet)
      const ttl = currentSlot + 7200;
      console.log(`⏰ [Cardano] Current slot: ${currentSlot}, TTL: ${ttl}`);
      txBuilder.set_ttl(ttl);

      // Add output to recipient
      const recipientAmount = CSL.Value.new(CSL.BigNum.from_str(amountLovelace.toString()));
      txBuilder.add_output(
        CSL.TransactionOutput.new(recipientAddr, recipientAmount)
      );

      // Parse and validate change address
      let changeAddr: CSL.Address;
      try {
        changeAddr = CSL.Address.from_bytes(Buffer.from(changeAddress, "hex"));
        // Verify change address is on the same network as recipient
        const changeNetworkId = changeAddr.network_id();
        const recipientNetworkId = recipientAddr.network_id();
        if (changeNetworkId !== recipientNetworkId) {
          console.warn(`⚠️ [Cardano] Network mismatch: change=${changeNetworkId}, recipient=${recipientNetworkId}`);
        }
      } catch (e) {
        throw new Error(`Invalid change address format: ${e instanceof Error ? e.message : "Unknown error"}`);
      }

      // Add metadata if provided (CIP-20 for transaction messages)
      if (metadata) {
        console.log("📝 [Cardano] Adding metadata to transaction...");
        try {
          // Create auxiliary data with metadata
          const auxData = CSL.AuxiliaryData.new();
          const generalMetadata = CSL.GeneralTransactionMetadata.new();
          
          // Use label 674 (CIP-20 standard for transaction messages)
          // This makes it viewable on CardanoScan and other blockchain explorers
          const metadataLabel = CSL.BigNum.from_str("674");
          
          // Create metadata content as a map
          const metadataMap = CSL.MetadataMap.new();
          
          // Add "msg" key with array of message chunks (max 64 bytes per chunk)
          const msgKey = CSL.TransactionMetadatum.new_text("msg");
          const msgArray = CSL.MetadataList.new();
          
          // Split metadata into 64-byte chunks (Cardano metadata limit)
          const maxChunkSize = 64;
          for (let i = 0; i < metadata.length; i += maxChunkSize) {
            const chunk = metadata.substring(i, i + maxChunkSize);
            msgArray.add(CSL.TransactionMetadatum.new_text(chunk));
          }
          
          metadataMap.insert(msgKey, CSL.TransactionMetadatum.new_list(msgArray));
          
          // Add the metadata map to general metadata with label 674
          generalMetadata.insert(metadataLabel, CSL.TransactionMetadatum.new_map(metadataMap));
          auxData.set_metadata(generalMetadata);
          
          // Set auxiliary data to transaction builder
          txBuilder.set_auxiliary_data(auxData);
          
          console.log(`📝 [Cardano] Metadata added: ${Math.ceil(metadata.length / maxChunkSize)} chunk(s), ${metadata.length} bytes total`);
        } catch (metadataErr) {
          console.error("❌ [Cardano] Failed to add metadata:", metadataErr);
          throw new Error(`Failed to add metadata: ${metadataErr instanceof Error ? metadataErr.message : "Unknown error"}`);
        }
      }

      // Let the TransactionBuilder calculate fee and change output automatically
      // This must be called AFTER all inputs, outputs, and metadata are added
      txBuilder.add_change_if_needed(changeAddr);

      // Build transaction body (this calculates the actual fee)
      let txBody: CSL.TransactionBody;
      try {
        txBody = txBuilder.build();
      } catch (e) {
        throw new Error(`Failed to build transaction: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
      
      // Log transaction details for debugging
      const fee = BigInt(txBody.fee().to_str());
      const inputCount = txBody.inputs().len();
      const outputCount = txBody.outputs().len();
      
      console.log(`💰 [Cardano] Transaction fee: ${fee} lovelace (${Number(fee) / 1_000_000} ADA)`);
      console.log(`📊 [Cardano] Transaction inputs: ${inputCount}, Total input: ${totalInput} lovelace`);
      console.log(`📊 [Cardano] Transaction outputs: ${outputCount}`);
      
      // Validate transaction has sufficient funds
      const totalOutput = Array.from({ length: outputCount }, (_, i) => {
        const output = txBody.outputs().get(i);
        return BigInt(output.amount().coin().to_str());
      }).reduce((sum, val) => sum + val, 0n);
      
      console.log(`📊 [Cardano] Total output: ${totalOutput} lovelace (${Number(totalOutput) / 1_000_000} ADA)`);
      
      if (totalInput < totalOutput + fee) {
        throw new Error(`Insufficient funds: Input ${totalInput} < Output ${totalOutput} + Fee ${fee}`);
      }
      
      // Validate transaction structure
      if (inputCount === 0) {
        throw new Error("Transaction has no inputs");
      }
      if (outputCount === 0) {
        throw new Error("Transaction has no outputs");
      }
      
      // Verify TTL is set
      const txTtl = txBody.ttl();
      if (!txTtl || txTtl === 0) {
        throw new Error("Transaction TTL is not set or invalid");
      }
      console.log(`⏰ [Cardano] Transaction TTL: ${txTtl}`);

      // Wrap transaction body into a Transaction (body + empty witness set)
      const tx = CSL.Transaction.new(
        txBody,
        CSL.TransactionWitnessSet.new(),
        undefined
      );

      // Serialize full unsigned transaction to CBOR hex for CIP-30 signTx
      const txBytes = tx.to_bytes();
      const txHex = Buffer.from(txBytes).toString("hex");
      console.log(`📦 [Cardano] Transaction CBOR size: ${txHex.length / 2} bytes`);
      
      // Validate transaction hex format
      if (!txHex || txHex.length === 0) {
        throw new Error("Transaction serialization failed: empty CBOR");
      }
      if (!/^[0-9a-fA-F]+$/.test(txHex)) {
        throw new Error("Transaction serialization failed: invalid hex format");
      }
      
      // Validate transaction can be deserialized (ensures valid CBOR)
      try {
        const testDeserialize = CSL.Transaction.from_bytes(Buffer.from(txHex, "hex"));
        const testBody = testDeserialize.body();
        const testInputs = testBody.inputs();
        const testOutputs = testBody.outputs();
        console.log(`✅ [Cardano] Transaction CBOR validation passed: ${testInputs.len()} inputs, ${testOutputs.len()} outputs`);
      } catch (deserializeErr) {
        console.error("❌ [Cardano] Transaction CBOR validation failed:", deserializeErr);
        throw new Error(`Invalid transaction CBOR: cannot deserialize. ${deserializeErr instanceof Error ? deserializeErr.message : "Unknown error"}`);
      }
      
      // Log transaction summary for user
      console.log("📋 [Cardano] Transaction Summary:");
      console.log(`   - Sending: ${amountADA} ADA (${amountLovelace} lovelace)`);
      console.log(`   - Fee: ${Number(fee) / 1_000_000} ADA (${fee} lovelace)`);
      console.log(`   - Change: ${Number(totalInput - amountLovelace - fee) / 1_000_000} ADA`);
      console.log(`   - Recipient: ${recipientAddress.substring(0, 20)}...`);

      // Verify wallet API is still valid before signing
      if (!walletApi || typeof walletApi.signTx !== "function") {
        throw new Error("Wallet API is not available. Please reconnect your wallet.");
      }
      
      // For Lace wallet, verify it's still enabled (some wallets require re-enabling)
      // Note: We check the wallet object, not the API, as the API might be stale
      let activeWalletApi = walletApi;
      const wallet = getCurrentWallet();
      if (wallet && typeof wallet.isEnabled === "function") {
        try {
          const isEnabled = await wallet.isEnabled();
          if (isEnabled === false) {
            console.warn("⚠️ [Cardano] Wallet not enabled, attempting to re-enable...");
            const reEnabledApi = await wallet.enable();
            setWalletApi(reEnabledApi);
            activeWalletApi = reEnabledApi;
            console.log("✅ [Cardano] Wallet re-enabled successfully");
          }
        } catch (enableCheckErr) {
          console.warn("⚠️ [Cardano] Could not check wallet enabled status:", enableCheckErr);
          // Continue anyway - some wallets don't support isEnabled or might throw
        }
      }

      // Validate transaction hex one more time before sending to wallet
      if (!txHex || txHex.length < 100) {
        throw new Error(`Invalid transaction hex: too short (${txHex.length} chars)`);
      }
      console.log(`📦 [Cardano] Transaction hex length: ${txHex.length} characters`);
      console.log(`📦 [Cardano] Transaction hex (first 200 chars): ${txHex.substring(0, 200)}...`);

      // Sign transaction via wallet (request full signed tx, not just witness set)
      console.log("✍️ [Cardano] Requesting transaction signature from wallet...");
      console.log("⚠️ [Cardano] Please approve the transaction in your wallet popup");
      console.log(`📦 [Cardano] Wallet API signTx method available: ${typeof activeWalletApi.signTx === "function"}`);
      
      let witnessSetHex: string;
      try {
        // Use the active wallet API (either original or re-enabled)
        // signTx returns ONLY the witness set, not the full signed transaction
        witnessSetHex = await activeWalletApi.signTx(txHex, false);
        console.log(`✍️ [Cardano] Transaction signed successfully. Witness set length: ${witnessSetHex.length} characters`);
      } catch (signErr: any) {
        // Enhanced error logging for debugging
        console.error("❌ [Cardano] Transaction signing error details:", {
          name: signErr?.name,
          code: signErr?.code,
          info: signErr?.info,
          message: signErr?.message,
          stack: signErr?.stack,
          error: signErr,
        });
        
        // Check if it's a user cancellation
        const errorCode = signErr?.code;
        const errorName = signErr?.name;
        const errorInfo = signErr?.info;
        const errorMessage = signErr?.message;
        
        if (
          errorCode === 2 ||
          errorName === "TxSignError" ||
          (typeof errorInfo === "string" && 
            (errorInfo.toLowerCase().includes("user declined") ||
             errorInfo.toLowerCase().includes("declined signing"))) ||
          (typeof errorMessage === "string" &&
            errorMessage.toLowerCase().includes("user declined"))
        ) {
          // This is a user cancellation - re-throw as user cancelled
          const cancelledError = new Error("Transaction cancelled by user");
          (cancelledError as any).isUserCancelled = true;
          throw cancelledError;
        }
        
        // Re-throw other errors
        throw signErr;
      }

      // Combine the original transaction body with the signed witness set
      // to create the complete signed transaction
      console.log("🔧 [Cardano] Combining transaction body with witness set...");
      let signedTxHex: string;
      try {
        // Parse the witness set returned by the wallet
        const witnessSet = CSL.TransactionWitnessSet.from_bytes(Buffer.from(witnessSetHex, "hex"));
        
        // Get auxiliary data from transaction builder (includes metadata if added)
        const auxData = txBuilder.get_auxiliary_data();
        
        // Create the complete signed transaction by combining:
        // 1. Original transaction body
        // 2. Signed witness set from wallet
        // 3. Auxiliary data (metadata) if present
        const signedTx = CSL.Transaction.new(
          txBody,
          witnessSet,
          auxData // includes metadata if added
        );
        
        // Serialize the complete signed transaction to CBOR hex
        signedTxHex = Buffer.from(signedTx.to_bytes()).toString("hex");
        console.log(`🔧 [Cardano] Complete signed transaction CBOR length: ${signedTxHex.length} characters`);
        
        // Validate the signed transaction can be deserialized
        const testSignedTx = CSL.Transaction.from_bytes(Buffer.from(signedTxHex, "hex"));
        const witnessCount = testSignedTx.witness_set().vkeys()?.len() || 0;
        console.log(`✅ [Cardano] Signed transaction validated: ${witnessCount} witness(es)`);
      } catch (combineErr: any) {
        console.error("❌ [Cardano] Failed to combine transaction with witness set:", combineErr);
        throw new Error(`Failed to create signed transaction: ${combineErr.message || "Unknown error"}`);
      }

      // Submit transaction with Blockfrost fallback
      console.log("📡 [Cardano] Submitting transaction...");
      let txHash: string;
      
      // Always try Blockfrost first for more reliable submission
      const blockfrostProjectId = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
      if (blockfrostProjectId) {
        console.log("📡 [Cardano] Using Blockfrost for transaction submission...");
        try {
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
          txHash = typeof result === 'string' ? result : result.hash || result.txHash;
          
          if (!txHash) {
            // Extract tx hash from signed transaction if not in response
            const hash = CSL.hash_transaction(CSL.TransactionBody.from_bytes(Buffer.from(signedTxHex, "hex")));
            txHash = Buffer.from(hash.to_bytes()).toString("hex");
          }
          
          console.log(`✅ [Cardano] Transaction submitted via Blockfrost!`);
          console.log(`🆔 [Cardano] TRANSACTION ID: ${txHash}`);
          console.log(`🔍 [Cardano] View on CardanoScan: https://preview.cardanoscan.io/transaction/${txHash}`);
        } catch (blockfrostErr: any) {
          console.error("❌ [Cardano] Blockfrost submission failed:", blockfrostErr);
          
          // Try wallet submitTx as fallback
          if (activeWalletApi.submitTx) {
            console.log("📡 [Cardano] Trying wallet submitTx as fallback...");
            try {
              txHash = await activeWalletApi.submitTx(signedTxHex);
              console.log(`✅ [Cardano] Transaction submitted via wallet!`);
              console.log(`🆔 [Cardano] TRANSACTION ID: ${txHash}`);
              console.log(`🔍 [Cardano] View on CardanoScan: https://preview.cardanoscan.io/transaction/${txHash}`);
            } catch (walletErr: any) {
              console.error("❌ [Cardano] Wallet submission also failed:", walletErr);
              throw new Error(`Transaction submission failed: ${blockfrostErr.message || "Unknown error"}`);
            }
          } else {
            throw blockfrostErr;
          }
        }
      } else if (activeWalletApi.submitTx) {
        // No Blockfrost configured, try wallet
        console.log("📡 [Cardano] Using wallet's submitTx method...");
        try {
          txHash = await activeWalletApi.submitTx(signedTxHex);
          console.log(`✅ [Cardano] Transaction submitted successfully!`);
          console.log(`🆔 [Cardano] TRANSACTION ID: ${txHash}`);
          console.log(`🔍 [Cardano] View on CardanoScan: https://preview.cardanoscan.io/transaction/${txHash}`);
        } catch (submitErr: any) {
          console.error("❌ [Cardano] Transaction submission failed:", submitErr);
          throw new Error(`Transaction submission failed: ${submitErr.info || submitErr.message || "Unknown error"}`);
        }
      } else {
        throw new Error("No transaction submission method available. Configure Blockfrost or ensure wallet supports submitTx.");
      }

      // Refresh balance after successful send
      console.log("🔄 [Cardano] Refreshing balance after transaction...");
      await refresh();

      console.log("✅ [Cardano] Transaction completed successfully!");
      console.log(`🎉 [Cardano] FINAL TRANSACTION ID: ${txHash}`);
      return txHash;
    } catch (err: any) {
      let message = "Failed to send transaction";
      let isUserCancelled = false;

      // Handle specific wallet error types
      // Check for TxSignError with code 2 (user declined)
      // Error format: TxSignError { code: 2, info: "user declined signing tx" }
      const errorCode = err?.code;
      const errorName = err?.name;
      const errorInfo = err?.info;
      const errorMessage = err?.message;

      // Check if this is a user cancellation error (ONLY for signing, not submission)
      // TxSignError with code 2 is specifically for signing cancellation
      if (
        (errorCode === 2 && errorName === "TxSignError") ||
        (errorName === "TxSignError" && typeof errorInfo === "string" && 
          (errorInfo.toLowerCase().includes("user declined") ||
           errorInfo.toLowerCase().includes("declined signing"))) ||
        (typeof errorMessage === "string" &&
          errorMessage.toLowerCase().includes("user declined") &&
          errorMessage.toLowerCase().includes("sign"))
      ) {
        isUserCancelled = true;
        message = "Transaction cancelled by user";
        console.log("ℹ️ [Cardano] Transaction cancelled by user (this is normal)");
      } else if (errorName === "ApiError" || errorCode === -1) {
        message = `Wallet API error: ${errorInfo || errorMessage || "Unknown error"}`;
      } else if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "string") {
        message = err;
      } else if (errorInfo) {
        message = `Transaction signing failed: ${errorInfo}`;
      }

      // Only log as error if it's not a user cancellation
      if (!isUserCancelled) {
        console.error("❌ [Cardano] Transaction failed:", err);
        setError(message);
      }

      // Create a custom error that preserves the cancellation flag
      const error = new Error(message);
      (error as any).isUserCancelled = isUserCancelled;
      throw error;
    } finally {
      // Always release mutex, even on error or user cancellation
      transactionMutexRef.current = false;
      console.log("🔓 [Cardano] Transaction mutex released");
    }
  }, [walletApi, networkId, balance, refresh, getCurrentWallet]);

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
