"use client";

import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
  "http://localhost:8000/subgraphs/name/phasor-v2";

/** @deprecated Use apolloClient instead - only one subgraph (phasor-v2) exists */
const TOKENS_SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_TOKENS_SUBGRAPH_URL ||
  SUBGRAPH_URL; // Fallback to main subgraph

const createHttpLink = (uri: string) =>
  new HttpLink({
    uri,
    fetch: (uri, options) => {
      return fetch(uri, options).catch((error) => {
        if (process.env.NODE_ENV === "development") {
          console.debug("Subgraph fetch error:", error);
        }
        return new Response(JSON.stringify({ data: null, errors: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });
    },
  });

const httpLink = createHttpLink(SUBGRAPH_URL);
const tokensHttpLink = createHttpLink(TOKENS_SUBGRAPH_URL);

// Main subgraph client for DEX data (pairs, swaps, mints, burns)
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Token: {
        keyFields: ["id"],
      },
      Pair: {
        keyFields: ["id"],
      },
      Query: {
        fields: {
          pairs: {
            keyArgs: false,
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "cache-first",
      errorPolicy: "all",
    },
  },
});

/**
 * @deprecated Use apolloClient instead.
 * There is only one subgraph (phasor-v2) which contains all data
 * including tokenDayData and tokenHourData.
 */
export const tokensApolloClient = new ApolloClient({
  link: tokensHttpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Token: {
        keyFields: ["id"],
      },
      TokenDayData: {
        keyFields: ["id"],
      },
      TokenHourData: {
        keyFields: ["id"],
      },
      Bundle: {
        keyFields: ["id"],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-first",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "cache-first",
      errorPolicy: "all",
    },
  },
});
