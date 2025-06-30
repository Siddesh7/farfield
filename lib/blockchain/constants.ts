// Base Sepolia Network Configuration
export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const BASE_SEPOLIA_RPC_URL =
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL;

// Contract Addresses on Base Sepolia
export const USDC_CONTRACT_ADDRESS =
  "0xfE1Cf9c0b43a009Bfc57041f977f4718A031FA6a";
export const FARFIELD_CONTRACT_ADDRESS =
  "0xAe8b2B4285776DbfD9972E1586F423701C6761B9";

// Farfield Marketplace ABI
export const FARFIELD_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_usdcToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_platformWallet",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "purchaseId",
        type: "string",
      },
      {
        internalType: "uint256[]",
        name: "productPrices",
        type: "uint256[]",
      },
      {
        internalType: "address[]",
        name: "sellerAddresses",
        type: "address[]",
      },
    ],
    name: "processPurchase",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[]",
        name: "productPrices",
        type: "uint256[]",
      },
    ],
    name: "calculatePurchaseCost",
    outputs: [
      {
        internalType: "uint256",
        name: "totalUserPays",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "platformFee",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalToSellers",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "purchaseId",
        type: "string",
      },
    ],
    name: "verifyPurchase",
    outputs: [
      {
        internalType: "bool",
        name: "exists",
        type: "bool",
      },
      {
        internalType: "address",
        name: "buyer",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "totalAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "refunded",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// USDC ABI (minimal - only what we need)
export const USDC_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
