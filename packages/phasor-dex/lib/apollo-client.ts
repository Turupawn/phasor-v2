"use client";

import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
  "http://localhost:8000/subgraphs/name/phasor/phasor-v2";

const httpLink = new HttpLink({
  uri: SUBGRAPH_URL,
  fetch: (uri, options) => {
    return fetch(uri, options).catch((error) => {
      console.debug("Subgraph fetch error:", error);
      return new Response(JSON.stringify({ data: null, errors: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
  },
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Token: {
        // Ensure tokens are cached by their ID
        keyFields: ["id"],
      },
      Pair: {
        // Ensure pairs are cached by their ID
        keyFields: ["id"],
      },
      Query: {
        fields: {
          pairs: {
            // Merge strategy for paginated results
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
