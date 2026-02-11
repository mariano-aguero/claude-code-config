# Wagmi Hooks

## Reading Data

```tsx
import { useReadContract, useReadContracts, useBalance } from "wagmi";

// Single read
const { data: balance } = useReadContract({
  address: tokenAddress,
  abi: erc20Abi,
  functionName: "balanceOf",
  args: [address],
});

// Multiple reads (uses multicall automatically)
const { data } = useReadContracts({
  contracts: [
    { address, abi, functionName: "name" },
    { address, abi, functionName: "symbol" },
    { address, abi, functionName: "decimals" },
  ],
});

// Native balance
const { data: ethBalance } = useBalance({ address });
```

## Writing Data

```tsx
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

function TransferButton() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  return (
    <button
      onClick={() => writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "transfer",
        args: [recipient, parseEther("1")],
      })}
      disabled={isPending || isConfirming}
    >
      {isPending ? "Confirm in wallet..." : isConfirming ? "Confirming..." : "Transfer"}
    </button>
  );
}
```

## Account & Network

```tsx
import { useAccount, useChainId, useBalance, useEnsName } from "wagmi";

function Profile() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address });
  const { data: ensName } = useEnsName({ address });
}
```

## Access Viem Clients

```tsx
import { usePublicClient, useWalletClient } from "wagmi";

function ContractInteraction() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Use viem directly when needed
  const balance = await publicClient.readContract({...});
  const hash = await walletClient.writeContract({...});
}
```

## Switch Chain

```tsx
import { useSwitchChain } from "wagmi";

function NetworkSwitcher() {
  const { switchChain, chains } = useSwitchChain();
  return chains.map(chain => (
    <button onClick={() => switchChain({ chainId: chain.id })}>
      {chain.name}
    </button>
  ));
}
```
