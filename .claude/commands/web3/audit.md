# /audit - Smart Contract Security Audit

Perform a security audit on Solidity smart contracts.

## Usage

```
/audit <contract-path> [options]
```

## Options

- `--quick` - Fast scan for common issues
- `--full` - Comprehensive analysis
- `--gas` - Include gas optimization
- `--report` - Generate markdown report

## Audit Checklist

### High Severity

- [ ] **Reentrancy** - External calls before state updates
- [ ] **Access Control** - Missing/incorrect modifiers
- [ ] **Integer Overflow** - Unchecked math in Solidity < 0.8
- [ ] **Unchecked Returns** - External call return values ignored
- [ ] **Delegatecall** - Arbitrary delegatecall targets
- [ ] **Self-destruct** - Unauthorized selfdestruct
- [ ] **Flash Loan Attacks** - Price manipulation vulnerabilities

### Medium Severity

- [ ] **Front-running** - Vulnerable to MEV
- [ ] **Oracle Manipulation** - Single oracle dependency
- [ ] **Signature Replay** - Missing nonce/chainId
- [ ] **Centralization** - Single owner controls critical functions
- [ ] **DoS** - Unbounded loops, block gas limit
- [ ] **Timestamp Dependence** - Using block.timestamp for randomness

### Low Severity

- [ ] **Floating Pragma** - Use fixed Solidity version
- [ ] **Missing Events** - State changes without events
- [ ] **Magic Numbers** - Use named constants
- [ ] **Dead Code** - Unused functions/variables
- [ ] **Shadowing** - Variable name shadows parent

### Informational

- [ ] **NatSpec** - Missing documentation
- [ ] **Code Style** - Inconsistent formatting
- [ ] **Gas Optimization** - Inefficient patterns

## Vulnerability Patterns

### Reentrancy

```solidity
// VULNERABLE
function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount);
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
    balances[msg.sender] -= amount; // State update AFTER call
}

// SECURE - CEI Pattern
function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount);
    balances[msg.sender] -= amount; // State update BEFORE call
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
}

// SECURE - ReentrancyGuard
function withdraw(uint256 amount) external nonReentrant {
    // ...
}
```

### Access Control

```solidity
// VULNERABLE - No access control
function setPrice(uint256 newPrice) external {
    price = newPrice;
}

// VULNERABLE - tx.origin check
function withdraw() external {
    require(tx.origin == owner); // Can be phished
}

// SECURE
function setPrice(uint256 newPrice) external onlyOwner {
    price = newPrice;
}
```

### Unchecked External Calls

```solidity
// VULNERABLE
IERC20(token).transfer(to, amount); // Return value ignored

// SECURE
bool success = IERC20(token).transfer(to, amount);
require(success, "Transfer failed");

// BEST - SafeERC20
using SafeERC20 for IERC20;
IERC20(token).safeTransfer(to, amount);
```

### Flash Loan Attack

```solidity
// VULNERABLE - Spot price manipulation
function getPrice() public view returns (uint256) {
    return tokenA.balanceOf(pool) / tokenB.balanceOf(pool);
}

// SECURE - TWAP oracle
function getPrice() public view returns (uint256) {
    return oracle.consult(tokenA, 1e18, tokenB);
}
```

### Signature Replay

```solidity
// VULNERABLE
function execute(bytes memory signature) external {
    address signer = ECDSA.recover(messageHash, signature);
    // No nonce, can replay
}

// SECURE
mapping(bytes32 => bool) public usedNonces;

function execute(bytes memory signature, bytes32 nonce) external {
    require(!usedNonces[nonce], "Nonce used");
    usedNonces[nonce] = true;

    bytes32 hash = keccak256(abi.encodePacked(
        block.chainid,
        address(this),
        nonce,
        // ... other params
    ));

    address signer = ECDSA.recover(hash, signature);
}
```

## Tools Integration

### Slither

```bash
# Run Slither
slither . --json slither-output.json

# Specific detectors
slither . --detect reentrancy-eth,unchecked-transfer

# Exclude paths
slither . --exclude-dependencies
```

### Aderyn

```bash
# Run Aderyn
aderyn .

# Output to specific file
aderyn . -o report.md
```

### Foundry Tests

```bash
# Run tests with verbosity
forge test -vvv

# Gas report
forge test --gas-report

# Coverage
forge coverage

# Fuzz testing
forge test --fuzz-runs 10000
```

## Report Template

```markdown
# Security Audit Report

## Project: ${ProjectName}
## Auditor: ${Auditor}
## Date: ${Date}

---

## Executive Summary

Brief overview of findings and overall security posture.

## Scope

| File | SLOC | Complexity |
|------|------|------------|
| Contract.sol | 150 | Medium |

## Findings Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 1 |
| Medium | 2 |
| Low | 3 |
| Informational | 5 |

---

## Findings

### [H-1] Reentrancy in withdraw function

**Severity:** High
**Status:** Open

**Description:**
The withdraw function is vulnerable to reentrancy...

**Location:**
\`src/Vault.sol:45\`

**Recommendation:**
Apply CEI pattern or use ReentrancyGuard.

**Code:**
\`\`\`solidity
// Before
function withdraw() external {
    // vulnerable code
}

// After
function withdraw() external nonReentrant {
    // fixed code
}
\`\`\`

---

## Gas Optimizations

### [G-1] Use unchecked for safe math

...

---

## Conclusion

Overall assessment and recommendations.
```

## Examples

```
/audit src/Vault.sol --full --report
/audit src/ --quick
/audit src/Token.sol --gas
```

## Post-Execution

After executing this command, update the project's `CLAUDE.md` file:

1. Add a summary of findings to the "Security" section
2. Document any vulnerabilities found and their resolution status
3. Update the audit history with date, auditor, and scope
4. Add any new security patterns or mitigations implemented
