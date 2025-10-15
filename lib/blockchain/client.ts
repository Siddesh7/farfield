// 1. React imports
// (none needed for this utility file)

// 2. Third-party imports
import {
  createPublicClient,
  createWalletClient,
  http,
  encodeFunctionData,
  parseUnits,
  formatUnits,
} from "viem";
import { sendCalls, getCallsStatus } from "@wagmi/core";
import { baseSepolia } from "viem/chains";

// 3. Internal imports (absolute paths)
// (none needed for this utility file)

// 4. Relative imports
import {
  BASE_RPC_URL,
  FARFIELD_CONTRACT_ADDRESS,
  USDC_CONTRACT_ADDRESS,
  FARFIELD_ABI,
  USDC_ABI,
} from "./constants";

// Public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(BASE_RPC_URL),
});

// Utility functions for USDC conversions
export const usdcUtils = {
  // Convert dollars to USDC units (6 decimals)
  toUnits: (amount: number): bigint => {
    return parseUnits(amount.toString(), 6);
  },

  // Convert USDC units to dollars
  fromUnits: (amount: bigint): number => {
    return parseFloat(formatUnits(amount, 6));
  },

  // Format for display
  formatDisplay: (amount: bigint): string => {
    return `${formatUnits(amount, 6)}`;
  },
};

// Farfield contract interaction functions
export const farfieldContract = {
  // Calculate purchase cost breakdown
  async calculatePurchaseCost(productPrices: bigint[]) {
    try {
      const result = await publicClient.readContract({
        address: FARFIELD_CONTRACT_ADDRESS as `0x${string}`,
        abi: FARFIELD_ABI,
        functionName: "calculatePurchaseCost",
        args: [productPrices],
      });

      return {
        totalUserPays: result[0],
        platformFee: result[1],
        totalToSellers: result[2],
      };
    } catch (error) {
      throw new Error(`Failed to calculate purchase cost: ${error}`);
    }
  },

  // Verify purchase exists on-chain
  async verifyPurchase(purchaseId: string) {
    try {
      const result = await publicClient.readContract({
        address: FARFIELD_CONTRACT_ADDRESS as `0x${string}`,
        abi: FARFIELD_ABI,
        functionName: "verifyPurchase",
        args: [purchaseId],
      });

      return {
        exists: result[0],
        buyer: result[1],
        totalAmount: result[2],
        timestamp: result[3],
        refunded: result[4],
      };
    } catch (error) {
      throw new Error(`Failed to verify purchase: ${error}`);
    }
  },

  // Generate transaction data for processPurchase
  generatePurchaseTransaction(
    purchaseId: string,
    productPrices: bigint[],
    sellerAddresses: `0x${string}`[]
  ) {
    try {
      const data = encodeFunctionData({
        abi: FARFIELD_ABI,
        functionName: "processPurchase",
        args: [purchaseId, productPrices, sellerAddresses],
      });

      return {
        to: FARFIELD_CONTRACT_ADDRESS as `0x${string}`,
        data,
        value: "0x0", // No ETH value needed for USDC transactions
      };
    } catch (error) {
      throw new Error(`Failed to generate purchase transaction: ${error}`);
    }
  },
};

// USDC contract interaction functions
export const usdcContract = {
  // Check USDC balance
  async getBalance(address: `0x${string}`) {
    try {
      const balance = await publicClient.readContract({
        address: USDC_CONTRACT_ADDRESS as `0x${string}`,
        abi: USDC_ABI,
        functionName: "balanceOf",
        args: [address],
      });

      return balance as bigint;
    } catch (error) {
      throw new Error(`Failed to get USDC balance: ${error}`);
    }
  },

  // Check USDC allowance
  async getAllowance(owner: `0x${string}`, spender: `0x${string}`) {
    try {
      const allowance = await publicClient.readContract({
        address: USDC_CONTRACT_ADDRESS as `0x${string}`,
        abi: USDC_ABI,
        functionName: "allowance",
        args: [owner, spender],
      });

      return allowance as bigint;
    } catch (error) {
      throw new Error(`Failed to get USDC allowance: ${error}`);
    }
  },

  // Generate approval transaction data
  generateApprovalTransaction(spender: `0x${string}`, amount: bigint) {
    try {
      const data = encodeFunctionData({
        abi: [
          {
            inputs: [
              { internalType: "address", name: "spender", type: "address" },
              { internalType: "uint256", name: "value", type: "uint256" },
            ],
            name: "approve",
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "approve",
        args: [spender, amount],
      });

      return {
        to: USDC_CONTRACT_ADDRESS as `0x${string}`,
        data,
        value: "0x0",
      };
    } catch (error) {
      throw new Error(`Failed to generate approval transaction: ${error}`);
    }
  },
};

// Transaction batching utilities for sendCalls
export const transactionBatcher = {
  // Generate batched approval + purchase calls
  generatePurchaseBatch(
    approvalAmount: bigint,
    purchaseId: string,
    productPrices: bigint[],
    sellerAddresses: `0x${string}`[]
  ) {
    try {
      const approvalTx = usdcContract.generateApprovalTransaction(
        FARFIELD_CONTRACT_ADDRESS as `0x${string}`,
        approvalAmount
      );

      const purchaseTx = farfieldContract.generatePurchaseTransaction(
        purchaseId,
        productPrices,
        sellerAddresses
      );

      return [
        {
          to: approvalTx.to,
          data: approvalTx.data,
          value: BigInt(0),
        },
        {
          to: purchaseTx.to,
          data: purchaseTx.data,
          value: BigInt(0),
        },
      ];
    } catch (error) {
      throw new Error(`Failed to generate purchase batch: ${error}`);
    }
  },

  // Generate calls from transaction array (for API responses)
  generateCallsFromTransactions(transactions: any[]) {
    try {
      return transactions.map((tx) => ({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: BigInt(tx.value || 0),
      }));
    } catch (error) {
      throw new Error(`Failed to generate calls from transactions: ${error}`);
    }
  },

  // Check if approval is needed and generate appropriate batch
  async generateConditionalBatch(
    userAddress: `0x${string}`,
    requiredAmount: bigint,
    purchaseId: string,
    productPrices: bigint[],
    sellerAddresses: `0x${string}`[]
  ) {
    try {
      const currentAllowance = await usdcContract.getAllowance(
        userAddress,
        FARFIELD_CONTRACT_ADDRESS as `0x${string}`
      );

      const purchaseTx = farfieldContract.generatePurchaseTransaction(
        purchaseId,
        productPrices,
        sellerAddresses
      );

      // If allowance is sufficient, only return purchase transaction
      if (currentAllowance >= requiredAmount) {
        return [
          {
            to: purchaseTx.to,
            data: purchaseTx.data,
            value: BigInt(0),
          },
        ];
      }

      // Otherwise, return approval + purchase batch
      return this.generatePurchaseBatch(
        requiredAmount,
        purchaseId,
        productPrices,
        sellerAddresses
      );
    } catch (error) {
      throw new Error(`Failed to generate conditional batch: ${error}`);
    }
  },
};

// sendCalls execution utilities
export const sendCallsUtils = {
  // Execute batched calls with proper error handling
  async executeBatchedCalls(
    config: any,
    calls: { to: `0x${string}`; data: `0x${string}`; value: bigint }[],
    chainId: number
  ) {
    try {
      const result = await sendCalls(config, {
        calls,
        chainId,
      });
      return result;
    } catch (error) {
      throw new Error(`Failed to execute batched calls: ${error}`);
    }
  },

  // Get transaction hashes from batch ID
  async getTransactionHashesFromBatch(config: any, batchId: string) {
    try {
      const status = await getCallsStatus(config, { id: batchId });

      if (status.status === "pending") {
        throw new Error("Batch is still pending");
      }

      if (status.status === "failure") {
        throw new Error("Batch execution failed");
      }

      // Extract transaction hashes from receipts
      const transactionHashes =
        status.receipts?.map((receipt) => receipt.transactionHash) || [];

      return {
        status: status.status,
        transactionHashes,
        receipts: status.receipts,
      };
    } catch (error) {
      throw new Error(`Failed to get transaction hashes from batch: ${error}`);
    }
  },

  // Wait for batch completion and get transaction hashes
  async waitForBatchCompletion(
    config: any,
    batchId: string,
    maxAttempts: number = 30,
    intervalMs: number = 2000
  ) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await this.getTransactionHashesFromBatch(
          config,
          batchId
        );
        if (result.status === "success") {
          return result;
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes("pending")) {
          // Still pending, wait and retry
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
          continue;
        }
        throw error;
      }
    }
    throw new Error("Batch completion timeout");
  },

  // Execute purchase flow with automatic batching
  async executePurchaseFlow(
    config: any,
    purchaseData: {
      purchaseId: string;
      productPrices: bigint[];
      sellerAddresses: `0x${string}`[];
      requiredAmount: bigint;
    },
    userAddress: `0x${string}`,
    chainId: number
  ) {
    try {
      const calls = await transactionBatcher.generateConditionalBatch(
        userAddress,
        purchaseData.requiredAmount,
        purchaseData.purchaseId,
        purchaseData.productPrices,
        purchaseData.sellerAddresses
      );

      return await this.executeBatchedCalls(config, calls, chainId);
    } catch (error) {
      throw new Error(`Failed to execute purchase flow: ${error}`);
    }
  },
};

// Transaction verification utilities
export const transactionUtils = {
  // Get transaction receipt
  async getTransactionReceipt(hash: `0x${string}`) {
    try {
      const receipt = await publicClient.getTransactionReceipt({
        hash,
      });
      return receipt;
    } catch (error) {
      throw new Error(`Failed to get transaction receipt: ${error}`);
    }
  },

  // Check if transaction was successful
  async isTransactionSuccessful(hash: `0x${string}`) {
    try {
      const receipt = await this.getTransactionReceipt(hash);
      return receipt.status === "success";
    } catch (error) {
      return false;
    }
  },

  // Wait for transaction confirmation
  async waitForTransaction(hash: `0x${string}`, confirmations = 1) {
    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations,
      });
      return receipt;
    } catch (error) {
      throw new Error(`Failed to wait for transaction: ${error}`);
    }
  },
};
