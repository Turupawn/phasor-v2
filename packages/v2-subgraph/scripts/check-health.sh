#!/bin/bash

# Check subgraph deployment health
# Usage: ./scripts/check-health.sh [GRAPH_NODE_URL]

GRAPH_NODE_URL="${1:-http://localhost:8000}"
SUBGRAPH_NAME="${SUBGRAPH_NAME:-phasor/phasor-v2}"

echo "🔍 Checking Subgraph Health"
echo "========================================"
echo "Graph Node: $GRAPH_NODE_URL"
echo "Subgraph: $SUBGRAPH_NAME"
echo ""

# Test GraphQL endpoint
echo "1. Testing GraphQL endpoint..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$GRAPH_NODE_URL/subgraphs/name/$SUBGRAPH_NAME")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "302" ]; then
    echo "   ✅ Endpoint is accessible (HTTP $RESPONSE)"
else
    echo "   ❌ Endpoint returned HTTP $RESPONSE"
    exit 1
fi

# Check metadata
echo ""
echo "2. Checking subgraph metadata..."
METADATA=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"query": "{ _meta { block { number hash } deployment hasIndexingErrors } }"}' \
    "$GRAPH_NODE_URL/subgraphs/name/$SUBGRAPH_NAME")

if echo "$METADATA" | grep -q "block"; then
    BLOCK_NUMBER=$(echo "$METADATA" | grep -o '"number":[0-9]*' | head -1 | cut -d: -f2)
    HAS_ERRORS=$(echo "$METADATA" | grep -o '"hasIndexingErrors":[a-z]*' | cut -d: -f2)

    echo "   ✅ Latest indexed block: $BLOCK_NUMBER"

    if [ "$HAS_ERRORS" = "true" ]; then
        echo "   ⚠️  Warning: Subgraph has indexing errors"
    else
        echo "   ✅ No indexing errors"
    fi
else
    echo "   ❌ Could not fetch metadata"
    echo "   Response: $METADATA"
fi

# Check if data exists
echo ""
echo "3. Checking indexed data..."
PAIRS=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"query": "{ pairs(first: 1) { id } }"}' \
    "$GRAPH_NODE_URL/subgraphs/name/$SUBGRAPH_NAME")

if echo "$PAIRS" | grep -q '"id"'; then
    PAIR_COUNT=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"query": "{ pairs { id } }"}' \
        "$GRAPH_NODE_URL/subgraphs/name/$SUBGRAPH_NAME" | \
        grep -o '"id"' | wc -l)

    echo "   ✅ Found $PAIR_COUNT pairs indexed"
else
    echo "   ⚠️  No pairs found yet (might still be syncing)"
fi

# Sample query
echo ""
echo "4. Running sample query..."
SAMPLE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"query": "{ pairs(first: 3 orderBy: reserveUSD orderDirection: desc) { id token0 { symbol } token1 { symbol } reserveUSD } }"}' \
    "$GRAPH_NODE_URL/subgraphs/name/$SUBGRAPH_NAME")

if echo "$SAMPLE" | grep -q "token0"; then
    echo "   ✅ Sample query successful"
    echo ""
    echo "   Top 3 pools by TVL:"
    echo "$SAMPLE" | grep -o '"symbol":"[^"]*"' | cut -d\" -f4 | paste -d "/" - - | nl
else
    echo "   ⚠️  Sample query returned no results"
fi

echo ""
echo "========================================"
echo "Health check complete!"
echo ""
echo "GraphQL Playground: $GRAPH_NODE_URL/subgraphs/name/$SUBGRAPH_NAME"
