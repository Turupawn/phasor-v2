# PHASOR Contracts

Custom smart contracts for the Phasor DEX ecosystem.

## Overview

This package contains all custom Phasor contracts, separate from the Uniswap V2 fork.

## Contracts

### Token (`contracts/token/`)

| Contract | Description |
|----------|-------------|
| `PhasorToken.sol` | ERC20 governance token with 1B max supply |

### Farming (`contracts/farming/`)

| Contract | Description |
|----------|-------------|
| `MasterChef.sol` | Yield farming with PHASOR rewards (100/block) |

### Launchpad (`contracts/launchpad/`)

| Contract | Description |
|----------|-------------|
| `FairLaunch.sol` | Pro-rata token sale with soft/hard caps |
| `LaunchpadFactory.sol` | Clone factory for deploying launches |
| `TokenVesting.sol` | Linear vesting with cliff support |

## Development

All commands run from **repository root**:

```bash
# Build contracts
forge build

# Run all tests
forge test

# Run only phasor-contracts tests
forge test --match-path "packages/phasor-contracts/test/*.t.sol" -vv

# Gas report
forge test --gas-report
```

## Test Coverage

| Contract | Tests | Status |
|----------|-------|--------|
| PhasorToken | 4 | Passing |
| MasterChef | 6 | Passing |
| FairLaunch | 7 | Passing |

## Dependencies

- OpenZeppelin Contracts v5.1.0 (ERC20, Ownable, ReentrancyGuard, SafeERC20, Clones)
- Foundry (forge-std)

## Documentation

See [Smart Contracts Documentation](../../docs/SMART_CONTRACTS.md) for detailed API reference.

## Security

- All state-changing functions use `ReentrancyGuard`
- Token transfers use `SafeERC20`
- Access control via `Ownable`

**Note**: These contracts have not been audited. Use at your own risk.
