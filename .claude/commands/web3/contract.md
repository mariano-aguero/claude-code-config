# /contract - Generate Solidity Contract

Generate a Solidity smart contract with Foundry tests and deployment script.

## Usage

```
/contract <ContractName> [options]
```

## Options

- `--erc20` - ERC-20 token
- `--erc721` - ERC-721 NFT
- `--erc1155` - ERC-1155 multi-token
- `--upgradeable` - UUPS upgradeable
- `--ownable` - With Ownable access control
- `--access-control` - With AccessControl roles
- `--pausable` - With Pausable functionality
- `--with-tests` - Generate test file
- `--with-script` - Generate deployment script

## Templates

### Basic Contract

```solidity
// src/${ContractName}.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ${ContractName}
/// @notice ${description}
/// @dev ${implementation_notes}
contract ${ContractName} is Ownable, ReentrancyGuard {
    // ============ Errors ============
    error InvalidAmount();
    error InsufficientBalance();

    // ============ Events ============
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    // ============ State Variables ============
    mapping(address => uint256) public balances;
    uint256 public totalDeposits;

    // ============ Constructor ============
    constructor() Ownable(msg.sender) {}

    // ============ External Functions ============

    /// @notice Deposit ETH into the contract
    function deposit() external payable nonReentrant {
        if (msg.value == 0) revert InvalidAmount();

        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;

        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Withdraw ETH from the contract
    /// @param amount Amount to withdraw
    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert InvalidAmount();
        if (balances[msg.sender] < amount) revert InsufficientBalance();

        balances[msg.sender] -= amount;
        totalDeposits -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    // ============ View Functions ============

    /// @notice Get balance of an account
    /// @param account Address to check
    /// @return Balance of the account
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
}
```

### ERC-20 Token

```solidity
// src/${TokenName}.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ${TokenName} is ERC20, ERC20Permit, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;

    error ExceedsMaxSupply();

    constructor() ERC20("${TokenName}", "${SYMBOL}") ERC20Permit("${TokenName}") Ownable(msg.sender) {
        _mint(msg.sender, 100_000_000 * 10 ** 18); // Initial supply
    }

    function mint(address to, uint256 amount) external onlyOwner {
        if (totalSupply() + amount > MAX_SUPPLY) revert ExceedsMaxSupply();
        _mint(to, amount);
    }
}
```

### ERC-721 NFT

```solidity
// src/${NFTName}.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ${NFTName} is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    uint256 public constant MAX_SUPPLY = 10_000;
    uint256 public mintPrice = 0.05 ether;

    error MaxSupplyReached();
    error InsufficientPayment();

    constructor() ERC721("${NFTName}", "${SYMBOL}") Ownable(msg.sender) {}

    function mint(string memory uri) external payable returns (uint256) {
        if (_nextTokenId >= MAX_SUPPLY) revert MaxSupplyReached();
        if (msg.value < mintPrice) revert InsufficientPayment();

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        return tokenId;
    }

    function setMintPrice(uint256 price) external onlyOwner {
        mintPrice = price;
    }

    function withdraw() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success);
    }

    // Overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
```

### UUPS Upgradeable

```solidity
// src/${ContractName}.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract ${ContractName} is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    uint256 public value;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address owner_) public initializer {
        __Ownable_init(owner_);
        __UUPSUpgradeable_init();
    }

    function setValue(uint256 newValue) external onlyOwner {
        value = newValue;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // Storage gap for future upgrades
    uint256[49] private __gap;
}
```

### Test File

```solidity
// test/${ContractName}.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {${ContractName}} from "../src/${ContractName}.sol";

contract ${ContractName}Test is Test {
    ${ContractName} public instance;
    address public owner = makeAddr("owner");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    event Deposited(address indexed user, uint256 amount);

    function setUp() public {
        vm.prank(owner);
        instance = new ${ContractName}();
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
    }

    function test_Deposit() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit Deposited(alice, 1 ether);
        instance.deposit{value: 1 ether}();

        assertEq(instance.balanceOf(alice), 1 ether);
        assertEq(instance.totalDeposits(), 1 ether);
    }

    function test_RevertWhen_DepositZero() public {
        vm.prank(alice);
        vm.expectRevert(${ContractName}.InvalidAmount.selector);
        instance.deposit{value: 0}();
    }

    function testFuzz_Deposit(uint256 amount) public {
        amount = bound(amount, 1, 100 ether);
        vm.deal(alice, amount);

        vm.prank(alice);
        instance.deposit{value: amount}();

        assertEq(instance.balanceOf(alice), amount);
    }
}
```

### Deployment Script

```solidity
// script/Deploy${ContractName}.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {${ContractName}} from "../src/${ContractName}.sol";

contract Deploy${ContractName} is Script {
    function run() public returns (${ContractName}) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        ${ContractName} instance = new ${ContractName}();

        console2.log("${ContractName} deployed at:", address(instance));

        vm.stopBroadcast();

        return instance;
    }
}
```

## Examples

```
/contract Vault --ownable --with-tests
/contract MyToken --erc20 --with-script
/contract MyNFT --erc721 --pausable
/contract VaultV1 --upgradeable --with-tests --with-script
```

## File Structure Generated

```
├── src/
│   └── ${ContractName}.sol
├── test/
│   └── ${ContractName}.t.sol
└── script/
    └── Deploy${ContractName}.s.sol
```

## Post-Execution

After executing this command, update the project's `CLAUDE.md` file:

1. Add the new contract to the "Contracts" or "Architecture" section
2. Document the contract's purpose, key functions, and dependencies
3. Add deployment addresses for each network when deployed
4. Update the testing section with new test commands
