#!/bin/bash

# Deploy subgraph to local Graph node
# Usage: ./scripts/deploy-local.sh

set -e

echo "Creating subgraph on local Graph node..."
yarn graph create --node http://localhost:8020/ phasor/phasor-v2

echo "Deploying subgraph to local Graph node..."
yarn graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 phasor/phasor-v2 v2-subgraph.yaml

echo "✅ Subgraph deployed successfully!"
echo "GraphQL endpoint: http://localhost:8000/subgraphs/name/phasor/phasor-v2"
