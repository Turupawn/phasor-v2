import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts/index'

// Monad Testnet - Factory address
export const FACTORY_ADDRESS = '0x29105b90e042dd07be40ba8377ba2c72886aba59'

// WMON (Wrapped MON) - Reference token for pricing
export const REFERENCE_TOKEN = '0xbbdbcfef20072142e233f61ed26005c7d2983c5f'

// Stable token pairs for USD pricing (WMON-USDC, WMON-USDT, etc.)
// Add pair addresses here once you create pools
export const STABLE_TOKEN_PAIRS: string[] = [
  '0x9e43f6324187696837cf29691f031707ce5411a8', // WMON-USDT
]

// Token whitelist - from tokenlist.json
// Tokens that should contribute to tracked volume and liquidity
export const WHITELIST: string[] = [
  '0xbbdbcfef20072142e233f61ed26005c7d2983c5f', // WMON - Wrapped Monad
  '0xf817257fed379853cde0fa4f97ab987181b1e5ea', // USDC
  '0x4b6e26969bfa65263ef86f0f9326c6835509038f', // USDT
  '0xcf5a6076cfa32686c0df13abada2b40dec133f1d', // WBTC
  '0x762eef937f98d7a83fc134b5925b539dec482900', // WETH
  '0x5387c85a4965769f6b0df430638a1388493486f1', // SOL
  '0x0f0bdebf0f83cd1ee3974779bcb7315f9808c714', // DAK - Molandak
  '0xe0590015a873bf326bd645c3e1266d4db41c4e6b', // CHOG
  '0xfe140e1dce99be9f4f15d657cd9b7bf622270c50', // YAKI - Moyaki
  '0x090972399c8dfffa24690b7a21b6c48630d8703d', // FOLKS
  '0x57f8b44f3413e61c5612e787fb97f9a2f79862bf', // TEST TOKEN 1
  '0xf94db31f845fa943d02c576b3d847d4084112718', // TEST TOKEN 2
  '0xf7c38e465e79c4fcd53641c3da8ab0a4104ba285', // TEST TOKEN 3
  '0x4ce3d67b365692c1fe0ac793f3c86787ae943cdd', // TEST TOKEN 4
]

// Stablecoins for USD pricing
export const STABLECOINS = [
  '0xf817257fed379853cde0fa4f97ab987181b1e5ea', // USDC
  '0x4b6e26969bfa65263ef86f0f9326c6835509038f', // USDT
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

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = [
  {
    address: Address.fromString('0xbbdbcfef20072142e233f61ed26005c7d2983c5f'),
    symbol: 'WMON',
    name: 'Wrapped Monad',
    decimals: BigInt.fromI32(18),
  },
]

export const SKIP_TOTAL_SUPPLY: string[] = []
