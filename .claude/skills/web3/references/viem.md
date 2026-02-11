# Viem Core Usage

## Creating Clients

```typescript
import { createPublicClient, createWalletClient, http, custom } from "viem";
import { mainnet } from "viem/chains";

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http("https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"),
});

const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum!),
});
```

## Reading Contracts

```typescript
import { getContract, formatUnits } from "viem";
import { erc20Abi } from "viem";

// Single read
const balance = await publicClient.readContract({
  address: "0x...",
  abi: erc20Abi,
  functionName: "balanceOf",
  args: ["0x..."],
});

// Contract instance
const token = getContract({ address, abi: erc20Abi, client: publicClient });
const [name, symbol] = await Promise.all([token.read.name(), token.read.symbol()]);
```

## Writing Contracts

```typescript
// Simulate first (recommended)
const { request } = await publicClient.simulateContract({
  address, abi, functionName: "deposit", args: [parseEther("1")], account,
});

// Execute
const hash = await walletClient.writeContract(request);

// Wait for confirmation
const receipt = await publicClient.waitForTransactionReceipt({ hash });
```

## Multicall

```typescript
const results = await publicClient.multicall({
  contracts: [
    { address, abi, functionName: "balanceOf", args: [user] },
    { address, abi, functionName: "allowance", args: [user, spender] },
  ],
});

// Handle results
const [balance, allowance] = results;
if (balance.status === "success") console.log(balance.result);
```

## Events

```typescript
// Watch new events
const unwatch = publicClient.watchContractEvent({
  address, abi, eventName: "Transfer",
  onLogs: (logs) => logs.forEach(log => console.log(log.args)),
});

// Historical events
const logs = await publicClient.getContractEvents({
  address, abi, eventName: "Transfer", fromBlock, toBlock,
});
```

## Signing

```typescript
// Personal sign
const signature = await walletClient.signMessage({ account, message: "Hello" });

// EIP-712 typed data
const signature = await walletClient.signTypedData({
  account, domain, types, primaryType: "Permit", message,
});
```

## Error Handling

```typescript
import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from "viem";

if (error instanceof UserRejectedRequestError) return "Cancelled by user";
if (error instanceof BaseError) {
  const revert = error.walk(e => e instanceof ContractFunctionRevertedError);
  if (revert) return revert.data?.errorName;
}
```
