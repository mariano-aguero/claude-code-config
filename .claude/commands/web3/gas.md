# /gas - Gas Optimization Analysis

Analyze and optimize gas usage in Solidity smart contracts.

## Usage

```
/gas <contract-path> [options]
```

## Options

- `--report` - Generate detailed report
- `--compare` - Compare before/after
- `--benchmark` - Run gas benchmarks

## Gas Cost Reference

| Operation              | Gas Cost                  |
| ---------------------- | ------------------------- |
| SSTORE (0 → non-0)     | 20,000                    |
| SSTORE (non-0 → non-0) | 5,000                     |
| SSTORE (non-0 → 0)     | Refund 4,800              |
| SLOAD                  | 2,100 (cold) / 100 (warm) |
| CALL                   | 2,600 (cold) / 100 (warm) |
| Memory expansion       | Quadratic                 |
| MLOAD/MSTORE           | 3                         |
| ADD/SUB/MUL            | 3-5                       |
| Deployment per byte    | 200                       |

## Optimization Patterns

### 1. Storage Packing

```solidity
// BAD: 3 storage slots (60k gas to write all)
struct User {
    uint256 id;       // slot 0
    address wallet;   // slot 1
    uint256 balance;  // slot 2
}

// GOOD: 2 storage slots (40k gas to write all)
struct User {
    uint256 id;       // slot 0
    address wallet;   // slot 1 (20 bytes)
    uint96 balance;   // slot 1 (12 bytes) - packed!
}
```

### 2. Use `unchecked` for Safe Math

```solidity
// BAD: ~130 gas per iteration
for (uint256 i = 0; i < length; i++) {
    // ...
}

// GOOD: ~80 gas per iteration
for (uint256 i = 0; i < length; ) {
    // ...
    unchecked { ++i; }
}
```

### 3. Cache Storage Variables

```solidity
// BAD: Multiple SLOADs (~2,100 each)
function bad() external view returns (uint256) {
    return balances[msg.sender] + balances[msg.sender] * rate / 100;
}

// GOOD: Single SLOAD
function good() external view returns (uint256) {
    uint256 balance = balances[msg.sender];
    return balance + balance * rate / 100;
}
```

### 4. Use `calldata` for Read-Only Arrays

```solidity
// BAD: Copies to memory (~3 gas per byte + memory expansion)
function bad(uint256[] memory data) external {
    // ...
}

// GOOD: Reads directly from calldata (~3 gas per element)
function good(uint256[] calldata data) external {
    // ...
}
```

### 5. Short-Circuit Conditions

```solidity
// BAD: Expensive check first
if (expensiveCheck() && simpleCheck) { }

// GOOD: Cheap check first
if (simpleCheck && expensiveCheck()) { }
```

### 6. Use Custom Errors

```solidity
// BAD: ~50+ gas per character
require(balance >= amount, "Insufficient balance for withdrawal");

// GOOD: ~24 gas total
error InsufficientBalance();
if (balance < amount) revert InsufficientBalance();
```

### 7. Use `immutable` and `constant`

```solidity
// BAD: SLOAD every access (~2,100 gas)
uint256 public fee = 100;

// GOOD: Embedded in bytecode (0 gas)
uint256 public constant FEE = 100;

// GOOD: Set in constructor, embedded (0 gas after deploy)
uint256 public immutable deployTime;
constructor() { deployTime = block.timestamp; }
```

### 8. Minimize Storage Writes

```solidity
// BAD: Multiple writes
balances[msg.sender] -= amount;
balances[to] += amount;
totalTransfers += 1;

// GOOD: Batch when possible, consider if totalTransfers is needed
unchecked {
    balances[msg.sender] -= amount;
    balances[to] += amount;
}
```

### 9. Use Mappings Over Arrays

```solidity
// BAD: O(n) search
address[] public whitelist;
function isWhitelisted(address user) public view returns (bool) {
    for (uint i = 0; i < whitelist.length; i++) {
        if (whitelist[i] == user) return true;
    }
    return false;
}

// GOOD: O(1) lookup
mapping(address => bool) public whitelist;
function isWhitelisted(address user) public view returns (bool) {
    return whitelist[user];
}
```

### 10. Avoid Redundant Checks

```solidity
// BAD: SafeMath adds overhead in Solidity 0.8+
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
using SafeMath for uint256;
balance = balance.add(amount);

// GOOD: Built-in overflow checks
balance += amount;

// EVEN BETTER: When overflow is impossible
unchecked { balance += amount; }
```

### 11. Use Assembly for Hot Paths

```solidity
// Standard Solidity
function transfer(address to, uint256 amount) external {
    balances[msg.sender] -= amount;
    balances[to] += amount;
}

// Assembly (saves ~100 gas)
function transfer(address to, uint256 amount) external {
    assembly {
        // Load sender balance
        mstore(0x00, caller())
        mstore(0x20, balances.slot)
        let senderSlot := keccak256(0x00, 0x40)
        let senderBalance := sload(senderSlot)

        // Check and update
        if lt(senderBalance, amount) { revert(0, 0) }
        sstore(senderSlot, sub(senderBalance, amount))

        // Update recipient
        mstore(0x00, to)
        let recipientSlot := keccak256(0x00, 0x40)
        sstore(recipientSlot, add(sload(recipientSlot), amount))
    }
}
```

### 12. ERC-20 Optimizations

```solidity
// Use Solady or Solmate for optimized ERC-20
import {ERC20} from "solady/tokens/ERC20.sol";

// Or implement minimal needed functions
// Skip name()/symbol() if not needed on-chain
```

## Benchmarking

```solidity
// test/Gas.t.sol
contract GasTest is Test {
    function test_GasDeposit() public {
        uint256 gasBefore = gasleft();
        vault.deposit{value: 1 ether}();
        uint256 gasUsed = gasBefore - gasleft();
        console2.log("Deposit gas:", gasUsed);
    }
}
```

```bash
# Run gas benchmark
forge test --match-test test_Gas -vvv

# Generate gas snapshot
forge snapshot

# Compare with baseline
forge snapshot --check

# Diff two snapshots
forge snapshot --diff .gas-snapshot
```

## Report Template

```markdown
# Gas Optimization Report

## Summary

| Metric     | Before  | After   | Savings |
| ---------- | ------- | ------- | ------- |
| Deploy     | 500,000 | 400,000 | 20%     |
| deposit()  | 50,000  | 35,000  | 30%     |
| withdraw() | 45,000  | 30,000  | 33%     |

## Optimizations Applied

### 1. Storage Packing

- Reduced slots from 5 to 3
- Estimated savings: 40,000 gas per tx

### 2. Unchecked Math

- Applied to loop counters
- Estimated savings: 500 gas per iteration

...
```

## Examples

```
/gas src/Vault.sol --report
/gas src/ --benchmark
/gas src/Token.sol --compare
```

## Post-Execution

After executing this command, update the project's `CLAUDE.md` file:

1. Add gas optimization results to the "Performance" section
2. Document any optimizations applied and their impact
3. Update the gas benchmarks baseline for future comparisons
