---
name: web3-frontend
description: Web3 frontend integration with Viem, Wagmi, and Reown AppKit for Ethereum dApps. Use when building blockchain-connected UIs, implementing wallet connections, reading/writing smart contracts, or handling transactions. Triggers on tasks involving Viem clients, Wagmi hooks, Reown/RainbowKit configuration, multicall, or ERC-20/ERC-721 interactions.
---

# Web3 Integration Best Practices

Modern Web3 frontend development with Viem, Wagmi, and Reown AppKit.

## Quick Reference

| Task | Reference |
|------|-----------|
| Viem clients, read/write contracts, events | [references/viem.md](references/viem.md) |
| Wagmi hooks, useReadContract, useWriteContract | [references/wagmi.md](references/wagmi.md) |
| Reown AppKit setup, wallet connection | [references/wallet-connection.md](references/wallet-connection.md) |
| Transaction states, optimistic UI, toasts | [references/ux-patterns.md](references/ux-patterns.md) |

## Installation

```bash
# Core (viem 2.45+, wagmi 3.4+)
pnpm add viem wagmi @tanstack/react-query

# Wallet connection (Reown AppKit)
pnpm add @reown/appkit @reown/appkit-adapter-wagmi
```

## Core Pattern

```typescript
import { createPublicClient, createWalletClient, http } from "viem";
import { mainnet } from "viem/chains";

// Read blockchain
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

// Write transactions
const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum!),
});

// Simulate first, then execute
const { request } = await publicClient.simulateContract({...});
const hash = await walletClient.writeContract(request);
const receipt = await publicClient.waitForTransactionReceipt({ hash });
```

## Wagmi Hooks

```tsx
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";

// Read
const { data } = useReadContract({ address, abi, functionName, args });

// Write
const { writeContract, data: hash } = useWriteContract();
const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });
```

## Best Practices

1. **Viem** - Type-safe, performant, modern
2. **Multicall** - Batch reads to reduce RPC calls
3. **Simulate first** - Catch errors before signing
4. **Handle all errors** - Rejections, reverts, insufficient funds
5. **Loading states** - Pending, confirming, success
6. **Reown AppKit** - 400+ wallets, social logins
