# Security Patterns

## Transient Storage Reentrancy Lock (EIP-1153)

```solidity
// Solidity 0.8.24+ with Cancun
contract ReentrancyGuardTransient {
    bytes32 constant REENTRANCY_GUARD_SLOT = keccak256("reentrancy.guard");

    modifier nonReentrant() {
        assembly {
            if tload(REENTRANCY_GUARD_SLOT) {
                mstore(0, 0x37ed32e8)
                revert(0x1c, 0x04)
            }
            tstore(REENTRANCY_GUARD_SLOT, 1)
        }
        _;
        assembly {
            tstore(REENTRANCY_GUARD_SLOT, 0)
        }
    }
}
```

## Chainlink Oracle Integration

```solidity
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PriceConsumer {
    AggregatorV3Interface internal immutable priceFeed;
    uint256 public constant STALENESS_THRESHOLD = 1 hours;

    function getLatestPrice() public view returns (uint256) {
        (uint80 roundId, int256 price, , uint256 updatedAt, uint80 answeredInRound) =
            priceFeed.latestRoundData();

        if (price <= 0) revert InvalidPrice();
        if (updatedAt < block.timestamp - STALENESS_THRESHOLD) revert StalePrice();
        if (answeredInRound < roundId) revert StalePrice();

        return uint256(price);
    }
}
```

## Timelock for Critical Operations

```solidity
contract TimelockController {
    uint256 public constant MINIMUM_DELAY = 2 days;
    mapping(bytes32 => uint256) public timestamps;

    function schedule(address target, uint256 value, bytes calldata data, bytes32 salt, uint256 delay)
        external onlyAdmin returns (bytes32 id)
    {
        require(delay >= MINIMUM_DELAY, "Invalid delay");
        id = hashOperation(target, value, data, salt);
        timestamps[id] = block.timestamp + delay;
    }

    function execute(address target, uint256 value, bytes calldata data, bytes32 salt)
        external payable returns (bytes memory)
    {
        bytes32 id = hashOperation(target, value, data, salt);
        require(block.timestamp >= timestamps[id], "Not ready");
        delete timestamps[id];
        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success);
        return result;
    }
}
```

## Vulnerabilities Checklist

| Vulnerability       | Prevention                                      |
| ------------------- | ----------------------------------------------- |
| Reentrancy          | CEI pattern, ReentrancyGuard, transient storage |
| Access Control      | Ownable2Step, AccessManager                     |
| Integer Overflow    | Solidity 0.8+, careful unchecked blocks         |
| Unchecked Returns   | SafeERC20                                       |
| Front-running       | Commit-reveal, private mempools                 |
| Oracle Manipulation | TWAP, Chainlink staleness checks                |
| Signature Replay    | Nonce, chainId, EIP-712                         |
| Flash Loan Attacks  | Same-block checks, invariants                   |
| Centralization      | Timelocks, multisig                             |
