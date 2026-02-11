# /wagmi-hook - Generate Wagmi/Viem Hook

Generate a custom hook for blockchain interactions using Wagmi and Viem.

## Usage

```
/wagmi-hook <hookName> [options]
```

## Options

- `--read` - Read contract data
- `--write` - Write to contract
- `--event` - Watch events
- `--balance` - Token balance hook
- `--multicall` - Batched reads
- `--with-types` - Generate TypeScript types

## Templates

### Read Contract Hook

```tsx
// hooks/use-${contract}-${method}.ts
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";

const ${CONTRACT}_ADDRESS = "0x..." as const;

const ${CONTRACT}_ABI = [
  {
    name: "${method}",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
] as const;

interface Use${Hook}Options {
  account?: `0x${string}`;
  enabled?: boolean;
}

export function use${Hook}({ account, enabled = true }: Use${Hook}Options = {}) {
  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: ${CONTRACT}_ADDRESS,
    abi: ${CONTRACT}_ABI,
    functionName: "${method}",
    args: account ? [account] : undefined,
    query: {
      enabled: enabled && !!account,
      refetchInterval: 10_000,
    },
  });

  return {
    data: data ? formatUnits(data, 18) : undefined,
    rawData: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
```

### Write Contract Hook

```tsx
// hooks/use-${contract}-${method}.ts
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";

const ${CONTRACT}_ADDRESS = "0x..." as const;

const ${CONTRACT}_ABI = [
  {
    name: "${method}",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
] as const;

interface Use${Hook}Params {
  to: `0x${string}`;
  amount: string;
}

export function use${Hook}() {
  const {
    writeContract,
    data: hash,
    isPending,
    isError: isWriteError,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    isError: isConfirmError,
  } = useWaitForTransactionReceipt({ hash });

  const execute = ({ to, amount }: Use${Hook}Params) => {
    writeContract({
      address: ${CONTRACT}_ADDRESS,
      abi: ${CONTRACT}_ABI,
      functionName: "${method}",
      args: [to, parseEther(amount)],
    });
  };

  return {
    execute,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError: isWriteError || isConfirmError,
    error: writeError,
  };
}
```

### Token Balance Hook

```tsx
// hooks/use-token-balance.ts
import { useReadContract, useAccount } from "wagmi";
import { erc20Abi, formatUnits } from "viem";

interface UseTokenBalanceOptions {
  tokenAddress: `0x${string}`;
  decimals?: number;
  enabled?: boolean;
}

export function useTokenBalance({
  tokenAddress,
  decimals = 18,
  enabled = true,
}: UseTokenBalanceOptions) {
  const { address } = useAccount();

  const { data: balance, ...query } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: enabled && !!address,
      refetchInterval: 10_000,
    },
  });

  return {
    balance: balance ? formatUnits(balance, decimals) : "0",
    rawBalance: balance ?? 0n,
    ...query,
  };
}
```

### Multicall Hook

```tsx
// hooks/use-${contract}-data.ts
import { useReadContracts } from "wagmi";
import { formatUnits } from "viem";

const ${CONTRACT}_ADDRESS = "0x..." as const;
const ${CONTRACT}_ABI = [...] as const;

export function use${Contract}Data(userAddress?: `0x${string}`) {
  const { data, isLoading, isError, refetch } = useReadContracts({
    contracts: [
      {
        address: ${CONTRACT}_ADDRESS,
        abi: ${CONTRACT}_ABI,
        functionName: "totalSupply",
      },
      {
        address: ${CONTRACT}_ADDRESS,
        abi: ${CONTRACT}_ABI,
        functionName: "balanceOf",
        args: userAddress ? [userAddress] : undefined,
      },
      {
        address: ${CONTRACT}_ADDRESS,
        abi: ${CONTRACT}_ABI,
        functionName: "name",
      },
      {
        address: ${CONTRACT}_ADDRESS,
        abi: ${CONTRACT}_ABI,
        functionName: "symbol",
      },
    ],
    query: {
      enabled: !!userAddress,
    },
  });

  const [totalSupply, balance, name, symbol] = data ?? [];

  return {
    totalSupply: totalSupply?.result ? formatUnits(totalSupply.result, 18) : "0",
    balance: balance?.result ? formatUnits(balance.result, 18) : "0",
    name: name?.result ?? "",
    symbol: symbol?.result ?? "",
    isLoading,
    isError,
    refetch,
  };
}
```

### Event Watcher Hook

```tsx
// hooks/use-${contract}-events.ts
import { useWatchContractEvent } from "wagmi";
import { useState, useCallback } from "react";

const ${CONTRACT}_ADDRESS = "0x..." as const;

const ${CONTRACT}_ABI = [
  {
    name: "Transfer",
    type: "event",
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
  },
] as const;

interface TransferEvent {
  from: `0x${string}`;
  to: `0x${string}`;
  value: bigint;
  transactionHash: `0x${string}`;
}

export function use${Contract}Events() {
  const [events, setEvents] = useState<TransferEvent[]>([]);

  useWatchContractEvent({
    address: ${CONTRACT}_ADDRESS,
    abi: ${CONTRACT}_ABI,
    eventName: "Transfer",
    onLogs(logs) {
      const newEvents = logs.map((log) => ({
        from: log.args.from!,
        to: log.args.to!,
        value: log.args.value!,
        transactionHash: log.transactionHash,
      }));
      setEvents((prev) => [...newEvents, ...prev].slice(0, 50));
    },
  });

  const clearEvents = useCallback(() => setEvents([]), []);

  return { events, clearEvents };
}
```

### Approve + Action Hook

```tsx
// hooks/use-approve-and-${action}.ts
import { useWriteContract, useReadContract, useAccount } from "wagmi";
import { erc20Abi, maxUint256 } from "viem";

const SPENDER_ADDRESS = "0x..." as const;

export function useApproveAnd${Action}(tokenAddress: `0x${string}`) {
  const { address } = useAccount();

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, SPENDER_ADDRESS] : undefined,
  });

  const { writeContract: approve, isPending: isApproving } = useWriteContract();
  const { writeContract: execute, isPending: isExecuting } = useWriteContract();

  const needsApproval = (amount: bigint) => {
    return (allowance ?? 0n) < amount;
  };

  const handleApprove = () => {
    approve({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [SPENDER_ADDRESS, maxUint256],
    });
  };

  const handle${Action} = (amount: bigint) => {
    execute({
      address: SPENDER_ADDRESS,
      abi: SPENDER_ABI,
      functionName: "${action}",
      args: [tokenAddress, amount],
    });
  };

  return {
    allowance,
    needsApproval,
    approve: handleApprove,
    execute: handle${Action},
    isApproving,
    isExecuting,
    refetchAllowance,
  };
}
```

## Examples

```
/wagmi-hook useVaultDeposit --write
/wagmi-hook useTokenBalance --read --balance
/wagmi-hook usePoolData --multicall
/wagmi-hook useTransferEvents --event
```

## Best Practices

1. **Type contract addresses** as `0x${string}`
2. **Use const assertions** for ABIs (`as const`)
3. **Format values** for display (formatUnits/formatEther)
4. **Parse values** for transactions (parseUnits/parseEther)
5. **Handle loading/error states**
6. **Add refetch interval** for real-time data
7. **Use enabled option** for conditional fetching

## Post-Execution

After executing this command, update the project's `CLAUDE.md` file:

1. Add the new hook to the "Hooks" section
2. Document the hook's purpose and which contract it interacts with
3. Add the contract ABI reference if new ABIs were introduced
4. Update the architecture section with the new blockchain interaction pattern
