# OpenZeppelin 5.x Patterns

## Access Control with AccessManager

```solidity
import {AccessManager} from "@openzeppelin/contracts/access/manager/AccessManager.sol";
import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";

contract Treasury is AccessManaged {
    constructor(address manager) AccessManaged(manager) {}

    function withdraw(uint256 amount) external restricted {
        // Only callable by accounts with permission
    }
}

// Setup
AccessManager manager = new AccessManager(admin);
uint64 constant WITHDRAWER_ROLE = 1;
manager.grantRole(WITHDRAWER_ROLE, withdrawer, 0);

bytes4[] memory selectors = new bytes4[](1);
selectors[0] = Treasury.withdraw.selector;
manager.setTargetFunctionRole(address(treasury), selectors, WITHDRAWER_ROLE);
```

## Ownable2Step

```solidity
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";

contract Vault is Ownable2Step {
    constructor() Ownable(msg.sender) {}
}
// Transfer requires: 1. transferOwnership(newOwner) 2. newOwner.acceptOwnership()
```

## ERC-2612 Permit

```solidity
import {ERC20Permit, ERC20} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract MyToken is ERC20Permit {
    constructor() ERC20("MyToken", "MTK") ERC20Permit("MyToken") {}
}

function depositWithPermit(uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external {
    token.permit(msg.sender, address(this), amount, deadline, v, r, s);
    token.transferFrom(msg.sender, address(this), amount);
}
```

## ERC-4626 Tokenized Vaults

```solidity
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

contract YieldVault is ERC4626 {
    constructor(IERC20 asset_) ERC4626(asset_) ERC20("Vault Shares", "vSHARE") {}

    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this)) + _calculateYield();
    }
}
```

## UUPS Upgradeable

```solidity
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract VaultV1 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    function initialize(address owner_) public initializer {
        __Ownable_init(owner_);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    uint256[50] private __gap; // Reserve 50 slots; reduce by 1 for each added state variable
}
```

## ERC-7201 Namespaced Storage

```solidity
abstract contract VaultStorage {
    /// @custom:storage-location erc7201:vault.storage
    struct VaultStorageStruct {
        mapping(address => uint256) balances;
        uint256 totalSupply;
    }

    bytes32 private constant VAULT_STORAGE_LOCATION = 0x1234...;

    function _getVaultStorage() internal pure returns (VaultStorageStruct storage $) {
        assembly { $.slot := VAULT_STORAGE_LOCATION }
    }
}
```
