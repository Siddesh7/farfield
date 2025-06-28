# User API Endpoints - Complete Examples

## 📋 **Overview**

Complete API documentation for user management in a TypeScript/Next.js project with MongoDB, Privy authentication, and Farcaster integration. Users can now have **multiple wallets** with only the address being required.

**Total Endpoints: 14**

## 🔐 **Authentication**

Protected endpoints require Privy authentication via Bearer token:

```
Authorization: Bearer <your_privy_access_token>
```

**Getting Access Token:**

- Frontend: Use `getAccessToken()` from `usePrivy` hook
- Use `useAuthenticatedAPI()` hook for automatic token handling

**Protected Endpoints:** All `/api/users/me/*` routes  
**Public Endpoints:** User lookup routes (by ID, username, etc.)

## 📊 **Response Format**

All endpoints follow the standardized API response format:

```typescript
{
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}
```

---

## 🧍 **Core User Management**

### 1. Get Current User

**`GET /api/users/me`** 🔒 _Protected_

```bash
curl -X GET "http://localhost:3000/api/users/me" \
  -H "Authorization: Bearer <your_access_token>"
```

**Response:**

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "_id": "677123456789abcdef",
    "farcasterFid": 12345,
    "farcaster": {
      "ownerAddress": "0x742d35cc6490c0532c26c20c0531b1bb3b8b0b8b",
      "displayName": "Alice Smith",
      "username": "alicesmith",
      "bio": "Building the future of web3",
      "pfp": "https://example.com/pfp.jpg"
    },
    "wallets": [
      {
        "address": "0x742d35cc6490c0532c26c20c0531b1bb3b8b0b8b",
        "chainType": "ethereum",
        "walletClientType": "metamask",
        "connectorType": "injected",
        "isPrimary": true
      },
      {
        "address": "0x8ba1f109551bd432803012645hbf8c8f9edc7d",
        "chainType": "polygon",
        "isPrimary": false
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T15:45:00.000Z"
  }
}
```

### 2. Update Current User

**`PUT /api/users/me`** 🔒 _Protected_

```bash
curl -X PUT "http://localhost:3000/api/users/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "farcaster": {
      "displayName": "Alice Cooper",
      "bio": "Web3 enthusiast and builder"
    }
  }'
```

### 3. Delete Current User

**`DELETE /api/users/me`** 🔒 _Protected_

```bash
curl -X DELETE "http://localhost:3000/api/users/me" \
  -H "Authorization: Bearer <your_access_token>"
```

### 4. Register New User

**`POST /api/users/register`**

```bash
curl -X POST "http://localhost:3000/api/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "privyId": "privy_user_456",
    "farcasterFid": 67890,
    "farcaster": {
      "ownerAddress": "0x8ba1f109551bd432803012645hbf8c8f9edc7d",
      "displayName": "Bob Johnson",
      "username": "bobjohnson",
      "bio": "DeFi researcher",
      "pfp": "https://example.com/bob-pfp.jpg"
    },
    "wallet": {
      "address": "0x8ba1f109551bd432803012645hbf8c8f9edc7d"
    }
  }'
```

---

## 🔍 **User Lookup**

### 5. Get User by ID

**`GET /api/users/[id]`**

```bash
curl -X GET "http://localhost:3000/api/users/677123456789abcdef"
```

### 6. Get User by Privy ID

**`GET /api/users/privy/[privyId]`**

```bash
curl -X GET "http://localhost:3000/api/users/privy/privy_user_123"
```

### 7. Get User by Farcaster Username

**`GET /api/users/username/[username]`**

```bash
curl -X GET "http://localhost:3000/api/users/username/alicesmith"
```

### 8. Get User by Farcaster FID

**`GET /api/users/fid/[fid]`**

```bash
curl -X GET "http://localhost:3000/api/users/fid/12345"
```

### 9. Get User by Wallet Address

**`GET /api/users/wallet/[address]`**

```bash
curl -X GET "http://localhost:3000/api/users/wallet/0x742d35cc6490c0532c26c20c0531b1bb3b8b0b8b"
```

---

## 📚 **User Discovery**

### 10. List All Users (Paginated)

**`GET /api/users`**

```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10&sortBy=createdAt&sortOrder=desc&chainType=ethereum"
```

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | number | Page number | 1 |
| `limit` | number | Items per page (max 100) | 10 |
| `sortBy` | string | Sort field: createdAt, updatedAt, farcasterFid, displayName | createdAt |
| `sortOrder` | string | Sort direction: asc, desc | desc |
| `chainType` | string | Filter by primary wallet chain type | - |

### 11. Search Users

**`GET /api/users/search`**

```bash
curl -X GET "http://localhost:3000/api/users/search?query=alice&page=1&limit=5"
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Search in displayName, username, bio |
| `farcasterFid` | number | Exact FID match |
| `username` | string | Exact username match |
| `displayName` | string | Exact display name match |
| `page` | number | Page number |
| `limit` | number | Items per page |
| `sortBy` | string | Sort field |
| `sortOrder` | string | Sort direction |

---

## 🎭 **Farcaster Profile Management**

### 12. Update Farcaster Profile

**`PUT /api/users/me/farcaster`** 🔒 _Protected_

```bash
curl -X PUT "http://localhost:3000/api/users/me/farcaster" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "displayName": "Alice The Builder",
    "bio": "Building the future, one block at a time",
    "pfp": "https://example.com/new-pfp.jpg"
  }'
```

---

## 💰 **Multiple Wallet Management**

### 13. Add New Wallet

**`POST /api/users/me/wallet`** 🔒 _Protected_

**Note:** Only `address` is required. All other fields are optional.

```bash
curl -X POST "http://localhost:3000/api/users/me/wallet" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "address": "0x8ba1f109551bd432803012645hbf8c8f9edc7d",
    "chainType": "polygon",
    "walletClientType": "metamask",
    "connectorType": "injected",
    "isPrimary": false
  }'
```

**Minimal Example (only address):**

```bash
curl -X POST "http://localhost:3000/api/users/me/wallet" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "address": "0x8ba1f109551bd432803012645hbf8c8f9edc7d"
  }'
```

### 14. Remove Wallet

**`DELETE /api/users/me/wallet`** 🔒 _Protected_

**Note:** Cannot remove the last wallet. If removing primary wallet, first remaining wallet becomes primary.

```bash
curl -X DELETE "http://localhost:3000/api/users/me/wallet" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "address": "0x8ba1f109551bd432803012645hbf8c8f9edc7d"
  }'
```

---

## 🔧 **Wallet Management Rules**

### **Primary Wallet Logic:**

- ✅ First wallet added is automatically primary
- ✅ Setting `isPrimary: true` when adding new wallet removes primary status from other wallets
- ✅ If primary wallet is removed, first remaining wallet becomes primary
- ❌ Cannot remove the last wallet

### **Address Validation:**

- ✅ Must be valid Ethereum address format (`0x` + 40 hex characters)
- ✅ Must be unique across all users
- ✅ Cannot duplicate addresses within same user

### **Optional Fields:**

- `chainType`: ethereum, polygon, arbitrum, etc.
- `walletClientType`: metamask, walletconnect, coinbase, etc.
- `connectorType`: injected, walletconnect, etc.
- `isPrimary`: boolean (default: false)

---

## ❌ **Common Error Responses**

### Authentication Errors

```json
{
  "success": false,
  "message": "Authentication token is required",
  "error": "UNAUTHORIZED"
}
```

### Validation Errors

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "address is required and must be a string between 1 and 100 characters"
}
```

### Conflict Errors

```json
{
  "success": false,
  "message": "Wallet address already exists",
  "error": "CONFLICT"
}
```

### Wallet Management Errors

```json
{
  "success": false,
  "message": "Cannot remove the last wallet",
  "error": "BAD_REQUEST"
}
```
