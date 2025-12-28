import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts/index'

// Monad Testnet - Factory address
export const FACTORY_ADDRESS = '0x29105B90E042dD07bE40ba8377ba2C72886ABa59'

// WMON (Wrapped MON) - Reference token for pricing
export const REFERENCE_TOKEN = '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701'

// Stable token pairs for USD pricing (WMON-USDC, WMON-USDT, etc.)
// Add pair addresses here once you create pools
export const STABLE_TOKEN_PAIRS: string[] = []

// Token whitelist - from tokenlist.json
// Tokens that should contribute to tracked volume and liquidity
export const WHITELIST: string[] = [
  '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701', // WMON - Wrapped Monad
  '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea', // USDC
  '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D', // USDT
  '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d', // WBTC
  '0xB5a30b0FDc42e3E9760Cb8449Fb37',             // WETH
  '0x5387C85A4965769f6B0Df430638a1388493486F1', // SOL
  '0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714', // DAK - Molandak
  '0xE0590015A873bF326bd645c3E1266d4db41C4E6B', // CHOG
  '0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50', // YAKI - Moyaki
  '0x090972399c8DFfFa24690b7a21B6C48630d8703d', // FOLKS
  '0x57f8b44f3413e61C5612E787fB97f9A2f79862Bf', // TEST TOKEN 1
  '0xf94DB31F845Fa943d02c576B3D847D4084112718', // TEST TOKEN 2
]

// Stablecoins for USD pricing
export const STABLECOINS = [
  '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea', // USDC
  '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D', // USDT
]

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
export const MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('10000')

// minimum liquidity for price to get tracked
export const MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('100000')

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = []

export const SKIP_TOTAL_SUPPLY: string[] = []
