# PHASOR Ecosystem - Complete Implementation Plan

## Current Status

| Component | Contract | Tests | Cannon Deploy | Status |
|-----------|----------|-------|---------------|--------|
| PhasorToken | ✅ | ✅ | ❌ | Needs deployment config |
| MasterChef | ✅ | ✅ | ❌ | Needs deployment config |
| Launchpad | ❌ | ❌ | ❌ | Not started |

---

## 1. Native Token (PhasorToken)

**File**: `packages/core/contracts/token/PhasorToken.sol` ✅ EXISTS

**Features**:
- ERC20 token with OpenZeppelin v5.1.0
- Max supply: 1 billion PHASOR (1,000,000,000 * 1e18)
- Initial supply: 100 million PHASOR (10% of max) minted to deployer
- Minting restricted to owner (will be transferred to MasterChef)

**Key Functions**:
```solidity
function mint(address to, uint256 amount) external onlyOwner
```

**Tests**: `packages/core/test/PhasorToken.t.sol` ✅ EXISTS
- Initial supply verification
- Minting functionality
- Owner-only restriction
- Max supply enforcement

**Cannon Deployment** ❌ NEEDS TO BE ADDED:
```toml
[deploy.PhasorToken]
artifact = "packages/core/contracts/token/PhasorToken.sol:PhasorToken"
```

---

## 2. Farming (MasterChef)

**File**: `packages/core/contracts/farming/MasterChef.sol` ✅ EXISTS

**Features**:
- SushiSwap V2 pattern yield farming
- Distributes PHASOR rewards to LP stakers
- Multiple pool support with allocation points
- 100 PHASOR per block reward rate (configurable)
- ReentrancyGuard protection
- Emergency withdraw (forfeits rewards)

**Key Structs**:
```solidity
struct UserInfo {
    uint256 amount;     // LP tokens staked
    uint256 rewardDebt; // Reward debt for calculation
}

struct PoolInfo {
    IERC20 lpToken;           // LP token contract
    uint256 allocPoint;       // Allocation points
    uint256 lastRewardBlock;  // Last reward block
    uint256 accPhasorPerShare; // Accumulated PHASOR per share
}
```

**Key Functions**:
- `add(allocPoint, lpToken)` - Add new pool (owner only)
- `set(pid, allocPoint)` - Update pool allocation (owner only)
- `deposit(pid, amount)` - Stake LP tokens
- `withdraw(pid, amount)` - Unstake and harvest
- `pendingPhasor(pid, user)` - View pending rewards
- `emergencyWithdraw(pid)` - Emergency exit (no rewards)

**Tests**: `packages/core/test/MasterChef.t.sol` ✅ EXISTS
- Pool management
- Deposit/withdraw
- Harvest rewards
- Multi-user proportional distribution
- Emergency withdraw

**Cannon Deployment** ❌ NEEDS TO BE ADDED:
```toml
[deploy.MasterChef]
artifact = "packages/core/contracts/farming/MasterChef.sol:MasterChef"
args = [
    "<%= contracts.PhasorToken.address %>",
    "<%= BigInt(100000000000000000000) %>",  # 100 PHASOR per block
    "<%= settings.startBlock || 1 %>"
]
depends = ["deploy.PhasorToken"]

# Transfer PhasorToken ownership to MasterChef so it can mint rewards
[invoke.transfer_phasor_ownership]
target = ["PhasorToken"]
func = "transferOwnership"
args = ["<%= contracts.MasterChef.address %>"]
depends = ["deploy.MasterChef"]
```

---

## 3. Launchpad Architecture

Minimal 3-contract system using battle-tested patterns:

```
LaunchpadFactory
    │ creates (clone pattern)
    v
FairLaunch (pro-rata token sale)
    │ creates (if vesting enabled)
    v
TokenVesting (linear + cliff)
```

---

## Implementation Steps

### Step 1: TokenVesting.sol

Simple OpenZeppelin-style vesting contract:

**File**: `packages/core/contracts/launchpad/TokenVesting.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TokenVesting {
    address public immutable beneficiary;
    address public immutable token;
    uint256 public immutable totalAmount;
    uint256 public immutable startTime;
    uint256 public immutable cliffTime;
    uint256 public immutable endTime;
    uint256 public released;

    // Core functions:
    // - vestedAmount() view
    // - releasable() view
    // - release() external
}
```

### Step 2: FairLaunch.sol

Pro-rata token sale (batch auction model):

**File**: `packages/core/contracts/launchpad/FairLaunch.sol`

**Key structs:**
```solidity
struct SaleInfo {
    address saleToken;        // Token being sold
    address paymentToken;     // WMON/USDC (address(0) = native ETH)
    uint256 totalTokens;      // Total for sale
    uint256 startTime;
    uint256 endTime;
    uint256 softCap;          // Min raise (0 = none)
    uint256 hardCap;          // Max raise (0 = unlimited)
    uint256 vestingDuration;  // 0 = instant distribution
    uint256 vestingCliff;
}
```

**Core functions:**
- `commit(uint256 amount)` - Users commit payment tokens
- `claim()` - Claim tokens after finalization (creates vesting if enabled)
- `withdraw()` - Refund if cancelled or soft cap not met
- `finalize()` - End sale, distribute funds, create DEX liquidity
- `cancel()` - Creator cancels sale
- `getAllocation(address user)` - Pro-rata calculation

**Pro-rata formula:**
```solidity
allocation = (userCommitment * totalTokens) / totalRaised
```

**DEX integration on finalize:**
1. Calculate platform fee (2%)
2. Calculate liquidity amount (30% of raise)
3. Transfer creator funds
4. Call router.addLiquidity() or addLiquidityETH()

### Step 3: LaunchpadFactory.sol

**File**: `packages/core/contracts/launchpad/LaunchpadFactory.sol`

**Core functions:**
- `createFairLaunch(...)` - Deploy new sale (clone pattern)
- `getAllLaunches()` - List all launches
- `getLaunchesByCreator(address)` - Filter by creator

**Configuration:**
- Platform fee: 200 bps (2%)
- Default liquidity: 3000 bps (30%)
- Fee recipient: Owner address

---

## Test Scenarios

**File**: `packages/core/test/FairLaunch.t.sol`

1. **Basic sale flow** - Create, commit, finalize, claim
2. **Pro-rata distribution** - 2 users get proportional tokens
3. **Soft cap not met** - Refunds enabled
4. **Hard cap reached** - Excess commitment rejected
5. **Vesting claim** - TokenVesting wallet created
6. **DEX liquidity** - LP pair created on finalize
7. **Cancel sale** - Full refunds

---

## Cannon Deployment

Add to `cannonfile.local-full.toml`:

```toml
# ============================================================================
# PHASOR Token Ecosystem
# ============================================================================

# Native token
[deploy.PhasorToken]
artifact = "packages/core/contracts/token/PhasorToken.sol:PhasorToken"

# Farming contract
[deploy.MasterChef]
artifact = "packages/core/contracts/farming/MasterChef.sol:MasterChef"
args = [
    "<%= contracts.PhasorToken.address %>",
    "<%= BigInt(100000000000000000000) %>",  # 100 PHASOR per block
    "1"                                       # startBlock
]
depends = ["deploy.PhasorToken"]

# Transfer ownership so MasterChef can mint rewards
[invoke.transfer_phasor_ownership]
target = ["PhasorToken"]
func = "transferOwnership"
args = ["<%= contracts.MasterChef.address %>"]
depends = ["deploy.MasterChef"]

# ============================================================================
# Launchpad Ecosystem
# ============================================================================

# FairLaunch template (for cloning)
[deploy.FairLaunchTemplate]
artifact = "packages/core/contracts/launchpad/FairLaunch.sol:FairLaunch"
depends = ["deploy.UniswapV2Router"]

# LaunchpadFactory
[deploy.LaunchpadFactory]
artifact = "packages/core/contracts/launchpad/LaunchpadFactory.sol:LaunchpadFactory"
args = [
    "<%= contracts.UniswapV2Factory.address %>",
    "<%= contracts.UniswapV2Router.address %>",
    "<%= contracts.WMON.address %>",
    "<%= contracts.FairLaunchTemplate.address %>",
    "<%= settings.owner %>",
    "200"                                      # 2% platform fee
]
depends = ["deploy.FairLaunchTemplate"]
```

---

## All Files Summary

### Existing (No Changes Needed)
| File | Status |
|------|--------|
| `packages/core/contracts/token/PhasorToken.sol` | ✅ Complete |
| `packages/core/contracts/farming/MasterChef.sol` | ✅ Complete |
| `packages/core/test/PhasorToken.t.sol` | ✅ Complete |
| `packages/core/test/MasterChef.t.sol` | ✅ Complete |

### To Create (Launchpad)
| File | Description |
|------|-------------|
| `packages/core/contracts/launchpad/TokenVesting.sol` | Linear vesting with cliff |
| `packages/core/contracts/launchpad/FairLaunch.sol` | Pro-rata token sale |
| `packages/core/contracts/launchpad/LaunchpadFactory.sol` | Factory for creating sales |
| `packages/core/test/FairLaunch.t.sol` | Sale + factory + vesting tests |

### To Update (Deployment)
| File | Changes Needed |
|------|----------------|
| `cannonfile.local-full.toml` | Add PhasorToken, MasterChef, Launchpad deployment |

---

## Verification Steps

### 1. Build contracts
```bash
forge build
```

### 2. Run all tests
```bash
# Run all PHASOR ecosystem tests
forge test --match-path "test/PhasorToken.t.sol" -vvv
forge test --match-path "test/MasterChef.t.sol" -vvv
forge test --match-path "test/FairLaunch.t.sol" -vvv
```

### 3. Deploy locally
```bash
./deploy-local-full.sh --skip-history
```

### 4. Test PhasorToken + MasterChef via cast
```bash
# Check PhasorToken
cast call $PHASOR_TOKEN "name()" | cast --to-ascii
cast call $PHASOR_TOKEN "totalSupply()" | cast --to-dec

# Check MasterChef owns PhasorToken (can mint)
cast call $PHASOR_TOKEN "owner()"  # Should be MasterChef address

# Add LP pool to MasterChef (owner does this)
cast send $MASTERCHEF "add(uint256,address)" 1000 $LP_TOKEN --private-key $PK

# Deposit LP tokens to farm
cast send $LP_TOKEN "approve(address,uint256)" $MASTERCHEF $(cast --max-uint) --private-key $PK
cast send $MASTERCHEF "deposit(uint256,uint256)" 0 1000000000000000000 --private-key $PK

# Check pending rewards
cast call $MASTERCHEF "pendingPhasor(uint256,address)" 0 $USER
```

### 5. Test Launchpad via cast
```bash
# Create a fair launch (as creator)
cast send $LAUNCHPAD_FACTORY "createFairLaunch(...)" --private-key $PK

# Commit to sale (as user)
cast send $FAIR_LAUNCH "commit(uint256)" 0 --value 1ether --private-key $PK

# Check allocation
cast call $FAIR_LAUNCH "getAllocation(address)" $USER
```

---

## Security Considerations

- ReentrancyGuard on commit/claim/withdraw/finalize
- SafeERC20 for all token transfers
- Checks-effects-interactions pattern
- Only creator can cancel before finalization
- Pro-rata model prevents front-running

---

## Frontend Integration (After Contracts)

Key events to index in subgraph:
- `LaunchCreated`
- `Committed`
- `Claimed`
- `SaleFinalized`

Key view functions:
- `getAllocation(user)` - User's token allocation
- `getCurrentPrice()` - Current token price
- `isActive()` - Sale active status
- `saleInfo` / `saleStatus` - Full details
