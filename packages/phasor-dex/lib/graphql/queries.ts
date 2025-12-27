import { gql } from "@apollo/client";
import { PAIR_FIELDS, PAIR_DAY_DATA_FIELDS, PAIR_HOUR_DATA_FIELDS } from "./fragments";

export const GET_POOLS = gql`
  query GetPools($first: Int = 100, $skip: Int = 0, $orderBy: String = "reserveUSD", $orderDirection: String = "desc") {
    pairs(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      ...PairFields
    }
  }
  ${PAIR_FIELDS}
`;

export const GET_POOL = gql`
  query GetPool($id: ID!) {
    pair(id: $id) {
      ...PairFields
      pairDayData(first: 7, orderBy: date, orderDirection: desc) {
        ...PairDayDataFields
      }
    }
  }
  ${PAIR_FIELDS}
  ${PAIR_DAY_DATA_FIELDS}
`;

export const GET_PAIR_CHART_DATA = gql`
  query GetPairChartData($pairAddress: String!, $startTime: Int!) {
    pairHourDatas(
      first: 1000
      orderBy: hourStartUnix
      orderDirection: asc
      where: { pair: $pairAddress, hourStartUnix_gte: $startTime }
    ) {
      ...PairHourDataFields
    }
  }
  ${PAIR_HOUR_DATA_FIELDS}
`;

export const GET_PAIR_DAY_DATA = gql`
  query GetPairDayData($pairAddress: String!, $startTime: Int!) {
    pairDayDatas(
      first: 1000
      orderBy: date
      orderDirection: asc
      where: { pairAddress: $pairAddress, date_gte: $startTime }
    ) {
      ...PairDayDataFields
    }
  }
  ${PAIR_DAY_DATA_FIELDS}
`;

export const GET_USER_POSITIONS = gql`
  query GetUserPositions($user: String!) {
    # Get mints (liquidity additions)
    mints(
      where: { to: $user }
      orderBy: timestamp
      orderDirection: desc
      first: 1000
    ) {
      id
      timestamp
      pair {
        id
        token0 {
          id
          symbol
          decimals
        }
        token1 {
          id
          symbol
          decimals
        }
      }
      to
      liquidity
      amount0
      amount1
      amountUSD
    }
    # Get burns (liquidity removals)
    burns(
      where: { sender: $user }
      orderBy: timestamp
      orderDirection: desc
      first: 1000
    ) {
      id
      timestamp
      pair {
        id
        token0 {
          id
          symbol
          decimals
        }
        token1 {
          id
          symbol
          decimals
        }
      }
      sender
      liquidity
      amount0
      amount1
      amountUSD
    }
  }
`;

export const GET_PROTOCOL_DATA = gql`
  query GetProtocolData {
    uniswapFactory(id: "0x9a676e781a523b5d0c0e43731313a708cb607508") {
      id
      pairCount
      totalVolumeUSD
      totalVolumeETH
      untrackedVolumeUSD
      totalLiquidityUSD
      totalLiquidityETH
      txCount
    }
  }
`;

export const GET_TOKENS = gql`
  query GetTokens($first: Int = 100, $skip: Int = 0) {
    tokens(
      first: $first
      skip: $skip
      orderBy: tradeVolumeUSD
      orderDirection: desc
      where: { tradeVolumeUSD_gt: "0" }
    ) {
      id
      symbol
      name
      decimals
      tradeVolumeUSD
      totalLiquidity
    }
  }
`;
