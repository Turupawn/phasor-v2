# Phasor V2 Subgraph

Indexes Phasor DEX events for fast querying via GraphQL.

## Local Development (Phasor)

For local development, use the deploy script from repository root:

```bash
# Full deployment includes subgraph setup
./deploy-local-full.sh
```

Or manually:

```bash
# Start Graph Node (requires Docker)
docker-compose up -d

# Create and deploy subgraph
npm run create-local
npm run deploy-local
```

**Query Endpoint**: `http://localhost:8000/subgraphs/name/phasor-v2`

## Documentation

See [Infrastructure Documentation](../../docs/INFRASTRUCTURE.md) for detailed setup.

---

## Original Development (Uniswap)

1. Install dependencies
`yarn install`

2. Build a v2 subgraph
`yarn build --network <network> --subgraph-type v2` 

3. Deploy a v2 subgraph
`yarn build --network <network> --subgraph-type v2 --deploy`

4. Build a v2-tokens subgraph
`yarn build --network <network> --subgraph-type v2-tokens`

5. Deploy a v2-tokens subgraph
`yarn build --network <network> --subgraph-type v2-tokens --deploy`

Note: Deployments will fail if there are uncommitted changes in the subgraph. Please commit your changes before deploying.

