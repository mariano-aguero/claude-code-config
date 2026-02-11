---
name: solidity-foundry
description: Solidity 0.8.33 smart contract development with Foundry framework and OpenZeppelin 5.4 patterns. Use when writing, testing, or auditing smart contracts, implementing access control, upgradeable contracts, or security patterns. Triggers on Solidity development, Foundry testing (forge test), fuzz testing, invariant testing, deployment scripts, or security best practices like CEI pattern and reentrancy guards.
---

# Solidity Best Practices

Professional Solidity 0.8.33 development with Foundry and OpenZeppelin 5.4.

## Quick Reference

| Task | Reference |
|------|-----------|
| Project setup, config, structure | [references/foundry.md](references/foundry.md) |
| Access control, vaults, governance, upgrades | [references/openzeppelin.md](references/openzeppelin.md) |
| Permit2, Uniswap V4 hooks, flash loans, clones | [references/protocols.md](references/protocols.md) |
| Reentrancy, oracles, timelocks | [references/security.md](references/security.md) |
| Unit, fuzz, invariant, fork testing | [references/testing.md](references/testing.md) |
| Storage packing, unchecked, custom errors | [references/gas-optimization.md](references/gas-optimization.md) |

## Foundry Commands

```bash
# Build & test
forge build
forge test -vvv
forge test --match-test testFuzz_

# Gas optimization
forge test --gas-report
forge snapshot

# Fork testing
forge test --fork-url $ETH_RPC_URL

# Deploy
forge script script/Deploy.s.sol --rpc-url $RPC --broadcast
```

## Project Structure

```
├── src/                 # Contracts
├── test/                # Tests (.t.sol)
├── script/              # Deploy scripts (.s.sol)
├── foundry.toml         # Config
└── remappings.txt       # Import mappings
```

## Security Checklist

| Vulnerability | Prevention |
|--------------|------------|
| Reentrancy | CEI pattern, ReentrancyGuard |
| Access Control | Ownable2Step, AccessManager |
| Oracle Manipulation | TWAP, Chainlink staleness checks |
| Flash Loan Attacks | Same-block checks, invariants |
| Centralization | Timelocks, multisig |

## Best Practices

1. **Foundry** - Fastest toolchain, built-in fuzzing
2. **OpenZeppelin 5.x** - AccessManager, Ownable2Step
3. **CEI Pattern** - Checks-Effects-Interactions always
4. **Custom Errors** - Save ~50 gas per revert
5. **Test Coverage** - Unit + fuzz + invariant + fork
