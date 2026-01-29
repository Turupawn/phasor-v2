# PhasorFi DEX 🌊

**Decentralized Exchange built on Uniswap V2, deployed on Monad Testnet**

---

## 🚀 Deployed Contracts

All contracts are **verified** on Monad Testnet.

| Contract | Address | Explorer |
|----------|---------|----------|
| **UniswapV2Factory** | `0xD04c253F3bdf475Ee184a667F66C886940Bea6de` | [View ✅](https://testnet.monadscan.com/address/0xD04c253F3bdf475Ee184a667F66C886940Bea6de#code) |
| **UniswapV2Router02** | `0x8CA682eC73A7D92b27c79120C260862B3cc9Bd3B` | [View ✅](https://testnet.monadscan.com/address/0x8CA682eC73A7D92b27c79120C260862B3cc9Bd3B#code) |
| **PHASOR Token** | `0x5c4673457F013c416eDE7d31628195904D3b5FDe` | [View ✅](https://testnet.monadscan.com/address/0x5c4673457F013c416eDE7d31628195904D3b5FDe#code) |

---

## 💧 Active Liquidity Pools

| Pool | Pair Address | Reserves |
|------|--------------|----------|
| **MON/PHASOR** | [`0x32db15e63c9e50Ce98a7E464119985690F7eD292`](https://testnet.monadscan.com/address/0x32db15e63c9e50Ce98a7E464119985690F7eD292) | 2 MON + 10,000 PHASOR |

Initial Price: **1 MON = 5,000 PHASOR**

---

## 📊 Token Information

| Token | Symbol | Decimals | Address |
|-------|--------|----------|---------|
| Phasor Token | PHASOR | 18 | `0x5c4673457F013c416eDE7d31628195904D3b5FDe` |
| Wrapped MON | WMON | 18 | `0xFb8bf4c1CC7a94c73D209a149eA2AbEa852BC541` |

---

## 🔧 Technical Details

- **Network:** Monad Testnet (Chain ID: 10143)
- **RPC URL:** https://testnet-rpc.monad.xyz
- **Explorer:** https://testnet.monadscan.com
- **INIT_CODE_HASH:** `0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f`

---

## 🏃 Running the Frontend

```bash
# Navigate to phasor-dex package
cd packages/phasor-dex

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the DEX.

---

## 📁 Project Structure

```
phasor-v2/
├── packages/
│   ├── core/              # UniswapV2 Core contracts
│   ├── periphery/         # UniswapV2 Router contracts
│   ├── phasor-contracts/  # Custom PhasorFi contracts
│   ├── phasor-dex/        # Next.js Frontend
│   └── v2-subgraph/       # TheGraph indexer
└── docs/                  # Documentation
```

---

## 🔗 Links

- **MonadVision (Sourcify):** [Verified Contracts](https://monadvision.com)
- **Monadscan:** [Block Explorer](https://testnet.monadscan.com)

---

## 📜 License

GPL-3.0
