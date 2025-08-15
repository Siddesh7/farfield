# Privy Authentication Setup

This document explains how to set up proper Privy authentication for your Farfield application.

## Overview

The application now uses secure Privy access tokens instead of insecure `x-privy-id` headers for API authentication.

## Backend Authentication Flow

1. **Token Verification**: All protected API routes now verify Privy access tokens using `@privy-io/server-auth`
2. **Secure Claims**: Extract user information from verified JWT tokens
3. **Error Handling**: Proper authentication error responses

## Frontend Authentication Flow

1. **Token Retrieval**: Use `getAccessToken()` from `usePrivy` hook
2. **Automatic Headers**: Include `Authorization: Bearer <token>` in API requests
3. **Error Handling**: Handle authentication failures gracefully

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Privy Configuration (Required)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
NEXT_PUBLIC_PRIVY_CLIENT_ID=your_privy_client_id_here
PRIVY_APP_SECRET=your_privy_app_secret_here

# Database
MONGODB_URI=mongodb://localhost:27017/farfield

# RPC URLs
NEXT_PUBLIC_BASE_RPC_URL=your_base_rpc_url_here
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=your_base_sepolia_rpc_url_here

# Other
NEXT_PUBLIC_URL=http://localhost:3000
```

## Getting Your Privy App Secret

1. Go to the [Privy Dashboard](https://dashboard.privy.io)
2. Select your application
3. Navigate to **Configuration > App settings**
4. Copy the **App Secret** and add it to your environment variables

## Updated API Routes

The following routes now use proper token authentication:

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `DELETE /api/users/me` - Delete current user account
- `POST /api/users/me/wallet` - Add new wallet
- `DELETE /api/users/me/wallet` - Remove wallet
- `PUT /api/users/me/farcaster` - Update Farcaster profile

## Frontend Usage

### Using the Authentication Hook

```typescript
import { useAuthenticatedAPI } from "@/lib/hooks/use-authenticated-fetch";

function MyComponent() {
  const { get, post, put, delete: del } = useAuthenticatedAPI();

  const fetchUserProfile = async () => {
    try {
      const response = await get("/api/users/me");
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };
}
```

### Manual Token Usage

```typescript
import { usePrivy } from "@privy-io/react-auth";

function MyComponent() {
  const { getAccessToken } = usePrivy();

  const makeAuthenticatedRequest = async () => {
    const accessToken = await getAccessToken();

    const response = await fetch("/api/users/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
  };
}
```

## Security Benefits

1. **No Spoofing**: JWT tokens are cryptographically signed by Privy
2. **Expiration**: Tokens automatically expire (1 hour)
3. **Verification**: Server verifies token authenticity with Privy
4. **User Claims**: Secure access to user's Privy DID and session info

## Migration from x-privy-id

### Before (Insecure)

```javascript
const response = await fetch("/api/users/me", {
  headers: {
    "x-privy-id": "user_123", // Can be spoofed!
    "Content-Type": "application/json",
  },
});
```

### After (Secure)

```javascript
const { get } = useAuthenticatedAPI();
const response = await get("/api/users/me"); // Automatically includes verified token
```

## Error Handling

The authentication system returns proper HTTP status codes:

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Valid token but insufficient permissions
- `200 OK` - Successfully authenticated

## Token Refresh

Privy handles token refresh automatically when using `getAccessToken()`. The frontend will:

1. Check if current token is expired/expiring
2. Automatically refresh if needed
3. Return the fresh token

## Troubleshooting

### "Authentication token required"

- Ensure you're logged in with Privy
- Check that `getAccessToken()` is being called correctly

### "Invalid or expired token"

- Token might be expired - Privy will refresh automatically
- Verify your `PRIVY_APP_SECRET` is correct
- Check that your Privy App ID matches

### "Token verification failed"

- Verify your environment variables are set correctly
- Ensure your Privy app configuration is correct
- Check network connectivity to Privy's servers
