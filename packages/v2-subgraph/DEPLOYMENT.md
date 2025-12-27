# Subgraph Deployment Guide

This guide covers deploying the Phasor V2 subgraph to production.

## Table of Contents
1. [Quick Start - Self-Hosted Graph Node](#option-1-self-hosted-graph-node)
2. [Alternative - Goldsky](#option-2-goldsky-recommended-for-easiest-setup)
3. [Alternative - The Graph Network](#option-3-the-graph-decentralized-network)
4. [Updating Your Frontend](#update-frontend-configuration)

---

## Option 1: Self-Hosted Graph Node

**Best for:** Full control, custom chains like Monad

### Prerequisites
- A VPS or cloud server (4GB+ RAM, 50GB+ disk)
- Docker and Docker Compose installed
- Access to a Monad RPC endpoint

### Steps

#### 1. Prepare Your Server

```bash
# SSH into your server
ssh user@your-server.com

# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

#### 2. Clone and Configure

```bash
# Clone your repo or copy the v2-subgraph folder to your server
git clone <your-repo> phasor-subgraph
cd phasor-subgraph/packages/v2-subgraph

# Create production environment file
cp .env.production.example .env.production

# Edit the configuration
nano .env.production
```

Update `.env.production`:
```env
ETHEREUM_RPC_URL=https://your-monad-rpc-endpoint.com
POSTGRES_PASSWORD=your-secure-password-123
```

#### 3. Start Graph Node

```bash
# Start the Graph node services
docker-compose -f docker-compose.production.yml up -d

# Check logs
docker-compose -f docker-compose.production.yml logs -f graph-node

# Wait for Graph node to be ready (look for "Starting JSON-RPC admin server")
```

#### 4. Build and Deploy Subgraph

```bash
# Install dependencies
yarn install

# Build the subgraph
yarn build --network monad --subgraph-type v2

# Deploy to your Graph node
export GRAPH_NODE_URL=http://localhost:8020
export IPFS_URL=http://localhost:5001
./scripts/deploy-hosted.sh
```

#### 5. Verify Deployment

```bash
# Check if subgraph is syncing
curl http://localhost:8000/subgraphs/name/phasor/phasor-v2

# Query the subgraph
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ pairs(first: 5) { id token0 { symbol } token1 { symbol } } }"}' \
  http://localhost:8000/subgraphs/name/phasor/phasor-v2
```

#### 6. Set Up Domain (Optional but Recommended)

```bash
# Install nginx
sudo apt-get install nginx

# Configure reverse proxy
sudo nano /etc/nginx/sites-available/subgraph
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name subgraph.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/subgraph /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Optional: Set up SSL with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d subgraph.yourdomain.com
```

Your subgraph is now available at: `https://subgraph.yourdomain.com/subgraphs/name/phasor/phasor-v2`

---

## Option 2: Goldsky (Recommended for Easiest Setup)

**Best for:** Quick deployment, managed service, no server management

### Steps

1. **Sign up for Goldsky**
   - Go to [goldsky.com](https://goldsky.com)
   - Create an account
   - Connect your GitHub

2. **Install Goldsky CLI**
   ```bash
   curl https://goldsky.com/install.sh | sh
   goldsky login
   ```

3. **Deploy Subgraph**
   ```bash
   cd packages/v2-subgraph

   # Build the subgraph
   yarn build --network monad --subgraph-type v2

   # Deploy to Goldsky
   goldsky subgraph deploy phasor-v2/v1.0.0 \
     --path ./v2-subgraph.yaml \
     --network monad
   ```

4. **Get Your Endpoint**
   ```bash
   goldsky subgraph list
   ```

   Your endpoint will be something like:
   `https://api.goldsky.com/api/public/project_<id>/subgraphs/phasor-v2/v1.0.0/gn`

---

## Option 3: The Graph Decentralized Network

**Best for:** Maximum decentralization, established networks

**Note:** The Graph Network may not support Monad yet. Check [thegraph.com/docs/en/developing/supported-networks/](https://thegraph.com/docs/en/developing/supported-networks/) for supported networks.

### Steps (if Monad is supported)

1. **Create Subgraph in Studio**
   - Go to [thegraph.com/studio](https://thegraph.com/studio)
   - Connect wallet
   - Click "Create a Subgraph"
   - Name it "phasor-v2"

2. **Install Graph CLI**
   ```bash
   npm install -g @graphprotocol/graph-cli
   ```

3. **Authenticate**
   ```bash
   graph auth --studio <DEPLOY_KEY>
   ```

4. **Deploy**
   ```bash
   cd packages/v2-subgraph
   yarn build --network monad --subgraph-type v2
   graph deploy --studio phasor-v2
   ```

5. **Publish to Network**
   - Go to Studio dashboard
   - Click "Publish"
   - Pay gas fees + signal GRT

---

## Update Frontend Configuration

After deploying, update your Vercel environment variables:

### In Vercel Dashboard

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add/Update:
   ```
   NEXT_PUBLIC_SUBGRAPH_URL=https://your-subgraph-endpoint.com/subgraphs/name/phasor/phasor-v2
   ```

### Examples by Deployment Method

**Self-hosted:**
```env
NEXT_PUBLIC_SUBGRAPH_URL=https://subgraph.yourdomain.com/subgraphs/name/phasor/phasor-v2
```

**Goldsky:**
```env
NEXT_PUBLIC_SUBGRAPH_URL=https://api.goldsky.com/api/public/project_<id>/subgraphs/phasor-v2/v1.0.0/gn
```

**The Graph Network:**
```env
NEXT_PUBLIC_SUBGRAPH_URL=https://gateway.thegraph.com/api/<API_KEY>/subgraphs/id/<SUBGRAPH_ID>
```

### Redeploy

After updating env vars in Vercel:
1. Go to "Deployments" tab
2. Click "..." on latest deployment
3. Click "Redeploy"

Or trigger a new deployment:
```bash
git commit --allow-empty -m "Update subgraph URL"
git push
```

---

## Monitoring and Maintenance

### Check Subgraph Health

```bash
# Query indexing status
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ indexingStatuses { subgraph synced health chains { latestBlock { number } chainHeadBlock { number } } } }"}' \
  http://your-graph-node:8030/graphql
```

### Common Issues

**Subgraph not syncing:**
- Check RPC endpoint is accessible
- Verify factory address and start block are correct
- Check Graph node logs: `docker-compose logs -f graph-node`

**Slow indexing:**
- Increase RPC rate limits
- Use archive node for historical data
- Adjust `GRAPH_ETHEREUM_MAX_BLOCK_RANGE_SIZE`

**Out of sync:**
- Redeploy with updated start block
- Check for chain reorgs

---

## Cost Estimates

### Self-Hosted (VPS)
- **DigitalOcean/Linode:** $24-48/month (4-8GB RAM droplet)
- **AWS/GCP:** $30-60/month (t3.medium or similar)
- **Domain + SSL:** $12/year (optional)

### Goldsky
- **Free tier:** Limited queries
- **Pro:** $99/month+ (unlimited queries)

### The Graph Network
- **Deployment:** ~$50-100 in gas
- **Curation signal:** Requires GRT tokens
- **Query fees:** Pay-per-query (usually very low)

---

## Recommended Approach

For Phasor on Monad, we recommend:

1. **Development:** Local Graph node (already set up)
2. **Production:**
   - **Option A (Easy):** Goldsky - if they support Monad
   - **Option B (Control):** Self-hosted on DigitalOcean droplet

### Quick Start with DigitalOcean

1. Create a $24/month droplet (4GB RAM, Ubuntu 22.04)
2. SSH in and run:
   ```bash
   git clone <your-repo>
   cd <repo>/packages/v2-subgraph
   cp .env.production.example .env.production
   # Edit .env.production with your RPC URL
   docker-compose -f docker-compose.production.yml up -d
   yarn install
   yarn build --network monad --subgraph-type v2
   ./scripts/deploy-hosted.sh
   ```
3. Point a subdomain to the droplet IP
4. Set up nginx + SSL
5. Update Vercel env vars

Total time: ~30 minutes
