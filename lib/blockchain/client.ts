import {
  createPublicClient,
  createWalletClient,
  http,
  encodeFunctionData,
  parseUnits,
  formatUnits,
} from "viem";
import { baseSepolia } from "viem/chains";
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
    return `$${formatUnits(amount, 6)}`;
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
        address: FARFIELD_CONTRACT_ADDRESS,
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
        to: FARFIELD_CONTRACT_ADDRESS,
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
        address: USDC_CONTRACT_ADDRESS,
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
        address: USDC_CONTRACT_ADDRESS,
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
        to: USDC_CONTRACT_ADDRESS,
        data,
        value: "0x0",
      };
    } catch (error) {
      throw new Error(`Failed to generate approval transaction: ${error}`);
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
