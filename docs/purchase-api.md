# Purchase API Documentation

This document describes the purchase flow API endpoints for the Farfield marketplace using smart contracts on Base Sepolia.

## Overview

The purchase system uses a two-step process:

1. **Initiate Purchase**: Backend creates purchase record and returns transaction payload
2. **Confirm Purchase**: Frontend sends transaction hash, backend verifies on-chain

## Smart Contract Details

- **Network**: Base Sepolia (Chain ID: 84532)
- **Farfield Contract**: `0xAe8b2B4285776DbfD9972E1586F423701C6761B9`
- **USDC Contract**: `0xfE1Cf9c0b43a009Bfc57041f977f4718A031FA6a`
- **Payment Token**: USDC (6 decimals)
- **Platform Fee**: 1% (configurable on-chain)

## API Endpoints

### 1. Initiate Purchase

**Endpoint**: `POST /api/purchase/initiate`

**Purpose**: Creates a pending purchase record and returns transaction payloads for the frontend to execute.

**Authentication**: Required (Privy token)

**Request Body**:

```json
{
  "items": [
    {
      "productId": "string",
      "quantity": 1 // Optional, for future use
    }
  ],
  "buyerWallet": "0x..."
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "purchaseId": "purchase_abc123",
    "transactions": [
      {
        "type": "approval", // Only if needed
        "description": "Approve USDC spending",
        "to": "0xfE1Cf9c0b43a009Bfc57041f977f4718A031FA6a",
        "data": "0x...",
        "value": "0x0",
        "gas": "50000"
      },
      {
        "type": "purchase",
        "description": "Process purchase",
        "to": "0xAe8b2B4285776DbfD9972E1586F423701C6761B9",
        "data": "0x...",
        "value": "0x0",
        "gas": "200000"
      }
    ],
    "summary": {
      "items": [...],
      "totalAmount": 10.50,
      "platformFee": 0.11,
      "expiresAt": "2024-01-01T12:00:00Z"
    },
    "blockchain": {
      "network": "Base Sepolia",
      "contractAddress": "0xAe8b2B4285776DbfD9972E1586F423701C6761B9",
      "requiredApproval": true
    }
  }
}
```

**Validations**:

- User must be authenticated
- Products must exist and be published
- User must not already own the products
- Seller wallets must be valid
- User must have sufficient USDC balance

### 2. Confirm Purchase

**Endpoint**: `POST /api/purchase/confirm`

**Purpose**: Verifies the transaction on-chain and marks the purchase as completed.

**Authentication**: Required (Privy token)

**Request Body**:

```json
{
  "purchaseId": "purchase_abc123",
  "transactionHash": "0x..."
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "purchaseId": "purchase_abc123",
    "status": "completed",
    "transactionHash": "0x...",
    "completedAt": "2024-01-01T12:00:00Z",
    "items": [
      {
        "productId": "product_123",
        "price": 10.0
      }
    ],
    "totalAmount": 10.5,
    "platformFee": 0.11,
    "blockchain": {
      "blockchainTimestamp": 1704110400,
      "verified": true
    }
  }
}
```

**Verifications**:

- Transaction must be successful
- Purchase must exist on smart contract
- Buyer address must match
- Amount must match (±1 cent tolerance)
- Purchase must not be refunded

### 3. Purchase History

**Endpoint**: `GET /api/purchase/history`

**Purpose**: Retrieves user's purchase history with pagination.

**Authentication**: Required (Privy token)

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `status`: Filter by status (completed, pending, failed, expired)

**Response**:

```json
{
  "success": true,
  "data": {
    "purchases": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    },
    "summary": {
      "totalPurchases": 45,
      "completedPurchases": 42,
      "pendingPurchases": 1,
      "totalSpent": 245.67
    }
  }
}
```

### 4. Check Product Access

**Endpoint**: `GET /api/products/[id]/access`

**Purpose**: Checks if the authenticated user has access to a specific product.

**Authentication**: Required (Privy token)

**Response**:

```json
{
  "success": true,
  "data": {
    "productId": "product_123",
    "productTitle": "Design System",
    "hasAccess": true,
    "isCreator": false,
    "hasPurchased": true,
    "purchaseDetails": {
      "purchaseId": "purchase_abc123",
      "purchasedAt": "2024-01-01T12:00:00Z",
      "pricePaid": 10.0,
      "transactionHash": "0x..."
    },
    "access": {
      "canDownload": true,
      "canView": true,
      "canEdit": false
    }
  }
}
```

## Purchase Flow

### Frontend Integration

1. **Initiate Purchase**:

   ```javascript
   const response = await fetch("/api/purchase/initiate", {
     method: "POST",
     headers: {
       Authorization: `Bearer ${privyToken}`,
       "Content-Type": "application/json",
     },
     body: JSON.stringify({
       items: [{ productId: "product_123" }],
       buyerWallet: userWallet,
     }),
   });

   const { data } = await response.json();
   ```

2. **Execute Transactions**:

   ```javascript
   // Execute each transaction in sequence
   for (const tx of data.transactions) {
     const hash = await wallet.sendTransaction({
       to: tx.to,
       data: tx.data,
       value: tx.value,
       gas: tx.gas,
     });

     // Wait for confirmation
     await hash.wait();
   }
   ```

3. **Confirm Purchase**:
   ```javascript
   await fetch("/api/purchase/confirm", {
     method: "POST",
     headers: {
       Authorization: `Bearer ${privyToken}`,
       "Content-Type": "application/json",
     },
     body: JSON.stringify({
       purchaseId: data.purchaseId,
       transactionHash: finalTxHash,
     }),
   });
   ```

## Security Features

- **On-chain Verification**: All purchases are verified against the smart contract
- **Purchase ID Uniqueness**: Each purchase ID can only be used once
- **Amount Verification**: Backend verifies exact amounts match on-chain
- **Expiration**: Pending purchases expire after 15 minutes
- **Authentication**: All endpoints require valid Privy tokens

## Error Handling

Common error responses:

- `400`: Invalid request data, insufficient balance, already owned
- `401`: Authentication required or invalid token
- `404`: Product/purchase not found
- `500`: Server or blockchain errors

## Database Schema

Purchase records include:

- Unique purchase ID
- Buyer FID and wallet address
- Product details and prices
- Status tracking (pending → completed/failed)
- Blockchain verification flags
- Expiration timestamps

## Smart Contract Integration

The system uses viem for blockchain interactions:

- Reading contract state (balances, allowances, costs)
- Generating transaction payloads
- Verifying transactions and receipts
- Checking purchase existence on-chain
