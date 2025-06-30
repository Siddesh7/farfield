# Farfield Purchase System

A secure blockchain-based purchase system for digital products using USDC on Base Sepolia.

## Architecture Overview

The system uses a two-phase commit approach for security:

1. **Initiation**: Backend generates transaction payloads
2. **Confirmation**: Backend verifies on-chain execution

## Key Files Created

- `lib/blockchain/constants.ts` - Contract addresses and ABIs
- `lib/blockchain/client.ts` - Viem utilities and contract interactions
- `models/purchase.ts` - Purchase database model
- `app/api/purchase/initiate/route.ts` - Purchase initiation endpoint
- `app/api/purchase/confirm/route.ts` - Purchase confirmation endpoint
- `app/api/purchase/history/route.ts` - Purchase history endpoint
- `app/api/products/[id]/access/route.ts` - Product access checker
- `docs/purchase-api.md` - Detailed API documentation

## Smart Contract Details

- **Network**: Base Sepolia (84532)
- **USDC**: `0xfE1Cf9c0b43a009Bfc57041f977f4718A031FA6a`
- **Farfield**: `0xAe8b2B4285776DbfD9972E1586F423701C6761B9`
- **Fee**: 1% platform fee

## Security Features

- On-chain purchase verification
- Unique purchase IDs prevent replay attacks
- Amount matching with blockchain
- 15-minute purchase expiration
- Authentication required for all endpoints

## Installation

```bash
pnpm add viem nanoid
```

## Usage

See `docs/purchase-api.md` for complete API documentation and examples.
