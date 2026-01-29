# Uniswap V2 Core (Fork)

This package is a **direct fork of Uniswap V2 Core**. Do not modify these contracts.

## Contracts

| Contract | Description |
|----------|-------------|
| `UniswapV2Factory` | Creates and tracks trading pairs |
| `UniswapV2Pair` | AMM pool (constant product x*y=k) |
| `UniswapV2ERC20` | LP token implementation |

## Custom PHASOR Contracts

Custom Phasor DEX contracts (PhasorToken, MasterChef, Launchpad) are located in [`packages/phasor-contracts`](../phasor-contracts/README.md).

## Documentation

- [Original Uniswap V2 Docs](https://docs.uniswap.org/contracts/v2/overview)
- [Smart Contracts Overview](../../docs/SMART_CONTRACTS.md)

## Development

Build and test from repository root:

```bash
# Build all contracts
forge build

# Run tests
forge test
```

## Original README

In-depth documentation on Uniswap V2 is available at [uniswap.org](https://uniswap.org/docs).

The built contract artifacts can be browsed via [unpkg.com](https://unpkg.com/browse/@uniswap/v2-core@latest/).
