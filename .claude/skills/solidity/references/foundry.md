# Foundry Setup & Configuration

## Installation

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Create Project

```bash
forge init my-project
cd my-project

# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts
forge install OpenZeppelin/openzeppelin-contracts-upgradeable
```

## foundry.toml Configuration

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.33"
optimizer = true
optimizer_runs = 200
via_ir = false
ffi = false
fs_permissions = [{ access = "read", path = "./"}]

[profile.default.fuzz]
runs = 1000
max_test_rejects = 65536

[profile.default.invariant]
runs = 256
depth = 15
fail_on_revert = false

[profile.ci]
fuzz = { runs = 10000 }
invariant = { runs = 1000 }

[fmt]
line_length = 100
tab_width = 4
bracket_spacing = true
```

## Project Structure

```
├── src/                 # Contract source files
│   ├── interfaces/      # Interface definitions
│   ├── libraries/       # Library contracts
│   └── Vault.sol
├── test/                # Test files
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   ├── invariant/       # Invariant tests
│   └── Vault.t.sol
├── script/              # Deployment scripts
│   └── Deploy.s.sol
├── foundry.toml         # Configuration
└── remappings.txt       # Import remappings
```

## Remappings

```
@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
@openzeppelin/contracts-upgradeable/=lib/openzeppelin-contracts-upgradeable/contracts/
```
