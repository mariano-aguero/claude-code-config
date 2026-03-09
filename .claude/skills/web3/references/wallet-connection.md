# Wallet Connection with Reown AppKit

## Installation

```bash
pnpm add @reown/appkit @reown/appkit-adapter-wagmi wagmi viem @tanstack/react-query
```

## Configuration

```tsx
// config.ts
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, arbitrum, optimism, base } from "@reown/appkit/networks";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!;

const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet, arbitrum, optimism, base],
  projectId,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, arbitrum, optimism, base],
  defaultNetwork: mainnet,
  projectId,
  metadata: {
    name: "My dApp",
    description: "My Web3 Application",
    url: "https://myapp.com",
    icons: ["https://myapp.com/icon.png"],
  },
  features: {
    analytics: true,
    email: true,
    socials: ["google", "x", "discord"],
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
```

## Provider Setup

```tsx
// providers.tsx
"use client";

import { useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "./config";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
```

## Built-in Components

```tsx
// Pre-built buttons
<appkit-button />
<appkit-account-button />
<appkit-network-button />
```

## Custom Connect Button

```tsx
import {
  useAppKit,
  useAppKitAccount,
  useDisconnect,
} from "@reown/appkit/react";

export function ConnectButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div>
        <span>
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }

  return <button onClick={() => open()}>Connect Wallet</button>;
}
```
