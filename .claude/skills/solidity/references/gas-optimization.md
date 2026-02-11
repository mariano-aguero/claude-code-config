# Gas Optimization

## Storage Packing

```solidity
// BAD - 4 storage slots
struct BadUser {
    uint256 id;         // slot 0
    address wallet;     // slot 1
    uint256 balance;    // slot 2
    bool isActive;      // slot 3
}

// GOOD - 2 storage slots
struct GoodUser {
    uint256 id;         // slot 0
    address wallet;     // slot 1 (20 bytes)
    uint80 balance;     // slot 1 (10 bytes)
    bool isActive;      // slot 1 (1 byte)
    uint8 tier;         // slot 1 (1 byte)
}
```

## Unchecked Arithmetic

```solidity
function sum(uint256[] calldata arr) external pure returns (uint256 total) {
    uint256 len = arr.length;
    for (uint256 i; i < len; ) {
        total += arr[i];
        unchecked { ++i; } // Safe: i bounded by array length
    }
}

function withdraw(uint256 amount) external {
    uint256 balance = balances[msg.sender];
    require(balance >= amount);
    unchecked {
        balances[msg.sender] = balance - amount; // Safe: checked above
    }
}
```

## Custom Errors

```solidity
// Expensive
require(balance >= amount, "Insufficient balance for withdrawal");

// Cheap (~50 gas saved per revert)
error InsufficientBalance(uint256 available, uint256 required);

if (balance < amount) revert InsufficientBalance(balance, amount);
```

## Assembly for Hot Paths

```solidity
// Reading mappings
function balanceOf(address account) external view returns (uint256 balance) {
    assembly {
        mstore(0x00, account)
        mstore(0x20, balances.slot)
        balance := sload(keccak256(0x00, 0x40))
    }
}

// Address check
function isContract(address account) internal view returns (bool) {
    uint256 size;
    assembly { size := extcodesize(account) }
    return size > 0;
}
```

## Key Optimizations

| Technique | Gas Saved |
|-----------|-----------|
| Custom errors vs require strings | ~50 gas/revert |
| Unchecked increment in loops | ~30-40 gas/iteration |
| Packing storage variables | ~20,000 gas/slot saved |
| ++i vs i++ | ~5 gas |
| Cache storage in memory | ~100 gas/read |
| Short-circuit && and \|\| | Variable |
