#!/bin/bash

# Deploy subgraph to a hosted Graph node
# Usage: ./scripts/deploy-hosted.sh

set -e

# Configuration - update these with your hosted Graph node details
GRAPH_NODE_URL="${GRAPH_NODE_URL:-http://your-graph-node:8020}"
IPFS_URL="${IPFS_URL:-http://your-ipfs-node:5001}"
SUBGRAPH_NAME="${SUBGRAPH_NAME:-phasor/phasor-v2}"

echo "🚀 Deploying Phasor V2 Subgraph to Hosted Graph Node"
echo "=================================================="
echo ""
echo "Configuration:"
echo "  Graph Node: $GRAPH_NODE_URL"
echo "  IPFS: $IPFS_URL"
echo "  Subgraph: $SUBGRAPH_NAME"
echo ""

# Check if subgraph manifest exists
if [ ! -f "v2-subgraph.yaml" ]; then
    echo "❌ Error: v2-subgraph.yaml not found!"
    echo "Run 'yarn build --network monad --subgraph-type v2' first"
    exit 1
fi

# Create subgraph (ignore error if already exists)
echo "📝 Creating subgraph..."
yarn graph create --node "$GRAPH_NODE_URL" "$SUBGRAPH_NAME" 2>/dev/null || true

# Deploy subgraph
echo "📤 Deploying subgraph..."
yarn graph deploy \
    --node "$GRAPH_NODE_URL" \
    --ipfs "$IPFS_URL" \
    --version-label "v$(date +%Y%m%d-%H%M%S)" \
    "$SUBGRAPH_NAME" \
    v2-subgraph.yaml

echo ""
echo "✅ Subgraph deployed successfully!"
echo ""
echo "GraphQL endpoint: ${GRAPH_NODE_URL/8020/8000}/subgraphs/name/$SUBGRAPH_NAME"
echo ""
echo "Update your frontend .env with:"
echo "NEXT_PUBLIC_SUBGRAPH_URL=${GRAPH_NODE_URL/8020/8000}/subgraphs/name/$SUBGRAPH_NAME"
echo ""
