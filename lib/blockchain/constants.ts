// Base Sepolia Network Configuration
export const CHAIN_ID = process.env.NEXT_PUBLIC_APP_ENV === "prod"
  ? 8453
  : 84532
;
export const BASE_RPC_URL =
  process.env.NEXT_PUBLIC_APP_ENV === "prod"
    ? process.env.NEXT_PUBLIC_BASE_RPC_URL
    : process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL;

// Contract Addresses
export const USDC_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USDC_CONTRACT;
export const FARFIELD_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_FARFIELD_CONTRACT;

// Farfield Marketplace ABI
export const FARFIELD_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_usdcToken", type: "address" },
      { internalType: "address", name: "_platformWallet", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "seller",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "remainingBalance",
        type: "uint256",
      },
    ],
    name: "EarningsWithdrawn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "oldFee",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newFee",
        type: "uint256",
      },
    ],
    name: "PlatformFeeUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "oldWallet",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newWallet",
        type: "address",
      },
    ],
    name: "PlatformWalletUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "string",
        name: "purchaseId",
        type: "string",
      },
      {
        indexed: true,
        internalType: "address",
        name: "buyer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "platformFee",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address[]",
        name: "sellers",
        type: "address[]",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "sellerAmounts",
        type: "uint256[]",
      },
    ],
    name: "PurchaseProcessed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "string",
        name: "purchaseId",
        type: "string",
      },
      {
        indexed: true,
        internalType: "address",
        name: "buyer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "RefundProcessed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
    type: "event",
  },
  { stateMutability: "payable", type: "fallback" },
  {
    inputs: [],
    name: "MAX_PLATFORM_FEE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256[]", name: "productPrices", type: "uint256[]" },
    ],
    name: "calculatePurchaseCost",
    outputs: [
      { internalType: "uint256", name: "totalUserPays", type: "uint256" },
      { internalType: "uint256", name: "platformFee", type: "uint256" },
      { internalType: "uint256", name: "totalToSellers", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "purchaseId", type: "string" }],
    name: "emergencyRefund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "emergencyWithdrawUSDC",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getContractUSDCBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMarketplaceStats",
    outputs: [
      { internalType: "uint256", name: "volume", type: "uint256" },
      { internalType: "uint256", name: "totalPurchaseCount", type: "uint256" },
      { internalType: "uint256", name: "feePercentage", type: "uint256" },
      { internalType: "address", name: "platform", type: "address" },
      { internalType: "address", name: "token", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "purchaseId", type: "string" }],
    name: "getPurchaseDetails",
    outputs: [
      {
        components: [
          { internalType: "string", name: "purchaseId", type: "string" },
          { internalType: "address", name: "buyer", type: "address" },
          { internalType: "address[]", name: "sellers", type: "address[]" },
          {
            internalType: "uint256[]",
            name: "sellerAmounts",
            type: "uint256[]",
          },
          { internalType: "uint256", name: "totalAmount", type: "uint256" },
          { internalType: "uint256", name: "platformFee", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "bool", name: "exists", type: "bool" },
          { internalType: "bool", name: "refunded", type: "bool" },
        ],
        internalType: "struct FarfieldMarketplace.Purchase",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "sellerAddress", type: "address" },
    ],
    name: "getSellerInfo",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "totalEarnings", type: "uint256" },
          {
            internalType: "uint256",
            name: "availableBalance",
            type: "uint256",
          },
          { internalType: "uint256", name: "totalWithdrawn", type: "uint256" },
          { internalType: "uint256", name: "totalSales", type: "uint256" },
        ],
        internalType: "struct FarfieldMarketplace.SellerInfo",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "platformFeePercentage",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "platformWallet",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "purchaseId", type: "string" },
      { internalType: "uint256[]", name: "productPrices", type: "uint256[]" },
      { internalType: "address[]", name: "sellerAddresses", type: "address[]" },
    ],
    name: "processPurchase",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "", type: "string" }],
    name: "purchaseIdUsed",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "", type: "string" }],
    name: "purchases",
    outputs: [
      { internalType: "string", name: "purchaseId", type: "string" },
      { internalType: "address", name: "buyer", type: "address" },
      { internalType: "uint256", name: "totalAmount", type: "uint256" },
      { internalType: "uint256", name: "platformFee", type: "uint256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "bool", name: "exists", type: "bool" },
      { internalType: "bool", name: "refunded", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "sellerInfos",
    outputs: [
      { internalType: "uint256", name: "totalEarnings", type: "uint256" },
      { internalType: "uint256", name: "availableBalance", type: "uint256" },
      { internalType: "uint256", name: "totalWithdrawn", type: "uint256" },
      { internalType: "uint256", name: "totalSales", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalPurchases",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalVolumeProcessed",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "newFeePercentage", type: "uint256" },
    ],
    name: "updatePlatformFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "newPlatformWallet", type: "address" },
    ],
    name: "updatePlatformWallet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "usdcToken",
    outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "purchaseId", type: "string" }],
    name: "verifyPurchase",
    outputs: [
      { internalType: "bool", name: "exists", type: "bool" },
      { internalType: "address", name: "buyer", type: "address" },
      { internalType: "uint256", name: "totalAmount", type: "uint256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "bool", name: "refunded", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawEarnings",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "withdrawPartialEarnings",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { stateMutability: "payable", type: "receive" },
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
