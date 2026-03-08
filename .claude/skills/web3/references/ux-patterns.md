# Web3 UX Patterns

## Transaction State Machine

```tsx
type TxState =
  | { status: "idle" }
  | { status: "preparing" }
  | { status: "awaiting-signature" }
  | { status: "pending"; hash: `0x${string}` }
  | { status: "confirmed"; hash: `0x${string}` }
  | { status: "failed"; error: string };

function TransactionButton({ onSubmit }) {
  const [state, setState] = useState<TxState>({ status: "idle" });

  async function handleClick() {
    try {
      setState({ status: "awaiting-signature" });
      const hash = await onSubmit();
      setState({ status: "pending", hash });
      await publicClient.waitForTransactionReceipt({ hash });
      setState({ status: "confirmed", hash });
    } catch (error) {
      setState({ status: "failed", error: parseError(error) });
    }
  }
}
```

## Optimistic Updates

```tsx
function useOptimisticBalance() {
  const { data: balance, refetch } = useBalance({ address });
  const [optimistic, setOptimistic] = useState<bigint | null>(null);

  const displayBalance = optimistic ?? balance?.value ?? 0n;

  const update = (delta: bigint) =>
    setOptimistic((prev) => (prev ?? balance?.value ?? 0n) + delta);
  const clear = () => {
    setOptimistic(null);
    refetch();
  };

  return { displayBalance, update, clear };
}
```

## Token Amount Input

```tsx
function TokenInput({ token, value, onChange, balance }) {
  const isOverBalance = parseUnits(value || "0", token.decimals) > balance;

  return (
    <div>
      <div className="flex justify-between">
        <span>Amount</span>
        <span>
          Balance: {formatUnits(balance, token.decimals)}
          <button
            onClick={() => onChange(formatUnits(balance, token.decimals))}
          >
            MAX
          </button>
        </span>
      </div>
      <input
        value={value}
        onChange={(e) =>
          /^\d*\.?\d*$/.test(e.target.value) && onChange(e.target.value)
        }
        className={isOverBalance ? "text-red-500" : ""}
      />
    </div>
  );
}
```

## Toast Notifications

```tsx
import { toast } from "sonner";

function useTransactionToast() {
  const showPending = (hash, message) =>
    toast.loading(message, {
      id: hash,
      action: {
        label: "View",
        onClick: () => window.open(`https://etherscan.io/tx/${hash}`),
      },
    });

  const showSuccess = (hash, message) => toast.success(message, { id: hash });
  const showError = (hash, error) =>
    toast.error("Failed", { id: hash, description: error });

  return { showPending, showSuccess, showError };
}
```

## Zustand Store for Web3 State

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Web3Store {
  slippage: number;
  recentTransactions: Transaction[];
  setSlippage: (slippage: number) => void;
  addTransaction: (tx: Transaction) => void;
}

export const useWeb3Store = create<Web3Store>()(
  persist(
    (set) => ({
      slippage: 0.5,
      recentTransactions: [],
      setSlippage: (slippage) => set({ slippage }),
      addTransaction: (tx) =>
        set((state) => ({
          recentTransactions: [tx, ...state.recentTransactions].slice(0, 10),
        })),
    }),
    { name: "web3-storage" },
  ),
);
```

## Loading Skeletons

```tsx
function TokenListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Network Status

```tsx
function NetworkStatus() {
  const { chain } = useNetwork();
  const [blockNumber, setBlockNumber] = useState<bigint>();

  useEffect(() => {
    return publicClient.watchBlockNumber({ onBlockNumber: setBlockNumber });
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <span>{chain?.name}</span>
      {blockNumber && <span>Block: {blockNumber.toLocaleString()}</span>}
    </div>
  );
}
```
