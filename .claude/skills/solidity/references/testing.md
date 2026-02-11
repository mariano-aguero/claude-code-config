# Testing with Foundry

## Unit Tests

```solidity
import {Test, console2} from "forge-std/Test.sol";
import {Vault} from "../src/Vault.sol";

contract VaultTest is Test {
    Vault vault;
    address owner = makeAddr("owner");
    address alice = makeAddr("alice");

    function setUp() public {
        vm.prank(owner);
        vault = new Vault();
        vm.deal(alice, 100 ether);
    }

    function test_Deposit() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit Deposit(alice, 1 ether);
        vault.deposit{value: 1 ether}();

        assertEq(vault.balanceOf(alice), 1 ether);
    }

    function test_RevertWhen_ZeroDeposit() public {
        vm.prank(alice);
        vm.expectRevert(Vault.ZeroAmount.selector);
        vault.deposit{value: 0}();
    }
}
```

## Fuzz Testing

```solidity
function testFuzz_Deposit(uint256 amount) public {
    amount = bound(amount, 1, 1000 ether);
    vm.deal(alice, amount);

    vm.prank(alice);
    vault.deposit{value: amount}();

    assertEq(vault.balanceOf(alice), amount);
}
```

## Invariant Testing

```solidity
contract VaultInvariantTest is Test {
    Vault vault;
    VaultHandler handler;

    function setUp() public {
        vault = new Vault();
        handler = new VaultHandler(vault);
        targetContract(address(handler));
    }

    function invariant_SharesEqualBalance() public view {
        assertEq(vault.totalSupply(), address(vault).balance);
    }
}

contract VaultHandler is Test {
    Vault vault;
    address[] public actors;

    constructor(Vault vault_) {
        vault = vault_;
        actors.push(makeAddr("actor1"));
        actors.push(makeAddr("actor2"));
    }

    function deposit(uint256 actorSeed, uint256 amount) public {
        address actor = actors[actorSeed % actors.length];
        amount = bound(amount, 0, 10 ether);
        vm.deal(actor, amount);
        vm.prank(actor);
        vault.deposit{value: amount}();
    }
}
```

## Fork Testing

```solidity
contract ForkTest is Test {
    uint256 mainnetFork;
    IERC20 constant USDC = IERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);

    function setUp() public {
        mainnetFork = vm.createFork(vm.envString("ETH_RPC_URL"));
    }

    function test_ForkMainnet() public {
        vm.selectFork(mainnetFork);
        vm.rollFork(18_000_000); // Specific block

        // Test against real state
    }
}
```

## Commands

```bash
forge test --gas-report
forge snapshot
forge snapshot --diff
```
