// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./TokenVesting.sol";

interface IUniswapV2Router02 {
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);

    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);

    function factory() external pure returns (address);
    function WETH() external pure returns (address);
}

interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

/**
 * @title FairLaunch
 * @notice Pro-rata token sale with DEX liquidity integration
 * @dev Batch auction model - all participants get same price based on total raised
 */
contract FairLaunch is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Sale configuration
    struct SaleInfo {
        address saleToken;        // Token being sold
        address paymentToken;     // Payment token (address(0) for native ETH)
        uint256 totalTokens;      // Total tokens for sale
        uint256 startTime;        // Sale start timestamp
        uint256 endTime;          // Sale end timestamp
        uint256 softCap;          // Minimum raise required (0 = no minimum)
        uint256 hardCap;          // Maximum raise allowed (0 = unlimited)
        uint256 vestingDuration;  // Vesting period in seconds (0 = instant)
        uint256 vestingCliff;     // Cliff period in seconds
    }

    /// @notice Sale state
    struct SaleStatus {
        uint256 totalRaised;       // Total payment tokens committed
        uint256 totalParticipants; // Number of unique contributors
        bool finalized;            // Whether sale has been settled
        bool cancelled;            // Whether sale was cancelled
    }

    // Immutable configuration
    SaleInfo public saleInfo;
    address public creator;
    address public router;
    address public factory;
    address public weth;
    uint256 public liquidityBps;      // % of raise for DEX liquidity (basis points)
    address public platformFeeRecipient;
    uint256 public platformFeeBps;    // Platform fee (basis points)
    uint256 public tokensForLiquidity; // Tokens reserved for liquidity

    // State
    SaleStatus public saleStatus;
    mapping(address => uint256) public commitments;
    mapping(address => bool) public claimed;
    mapping(address => address) public vestingWallets;

    // Events
    event SaleInitialized(
        address indexed saleToken,
        address indexed paymentToken,
        uint256 totalTokens,
        uint256 startTime,
        uint256 endTime
    );
    event Committed(address indexed user, uint256 amount, uint256 totalCommitment);
    event Claimed(address indexed user, uint256 tokenAmount, address vestingWallet);
    event Withdrawn(address indexed user, uint256 amount);
    event SaleFinalized(uint256 totalRaised, uint256 totalParticipants, uint256 liquidityAdded);
    event SaleCancelled();
    event LiquidityCreated(address indexed pair, uint256 tokenAmount, uint256 paymentAmount);

    /**
     * @notice Initialize a new fair launch sale
     * @param _saleInfo Sale configuration
     * @param _creator Sale creator address
     * @param _router DEX router address
     * @param _weth WETH/WMON address
     * @param _liquidityBps Percentage for DEX liquidity (basis points)
     * @param _tokensForLiquidity Tokens reserved for liquidity pool
     * @param _platformFeeRecipient Platform fee recipient
     * @param _platformFeeBps Platform fee (basis points)
     */
    function initialize(
        SaleInfo calldata _saleInfo,
        address _creator,
        address _router,
        address _weth,
        uint256 _liquidityBps,
        uint256 _tokensForLiquidity,
        address _platformFeeRecipient,
        uint256 _platformFeeBps
    ) external {
        require(saleInfo.saleToken == address(0), "FairLaunch: already initialized");
        require(_saleInfo.saleToken != address(0), "FairLaunch: invalid sale token");
        require(_saleInfo.totalTokens > 0, "FairLaunch: invalid total tokens");
        require(_saleInfo.startTime < _saleInfo.endTime, "FairLaunch: invalid times");
        require(_saleInfo.startTime >= block.timestamp, "FairLaunch: start in past");
        require(_creator != address(0), "FairLaunch: invalid creator");
        require(_liquidityBps <= 10000, "FairLaunch: invalid liquidity bps");
        require(_platformFeeBps <= 1000, "FairLaunch: fee too high"); // Max 10%

        saleInfo = _saleInfo;
        creator = _creator;
        router = _router;
        factory = IUniswapV2Router02(_router).factory();
        weth = _weth;
        liquidityBps = _liquidityBps;
        tokensForLiquidity = _tokensForLiquidity;
        platformFeeRecipient = _platformFeeRecipient;
        platformFeeBps = _platformFeeBps;

        emit SaleInitialized(
            _saleInfo.saleToken,
            _saleInfo.paymentToken,
            _saleInfo.totalTokens,
            _saleInfo.startTime,
            _saleInfo.endTime
        );
    }

    /**
     * @notice Commit payment tokens to the sale
     * @param amount Amount of payment tokens (ignored if paying with ETH)
     */
    function commit(uint256 amount) external payable nonReentrant {
        require(isActive(), "FairLaunch: sale not active");
        require(!saleStatus.cancelled, "FairLaunch: sale cancelled");

        uint256 commitAmount;
        if (saleInfo.paymentToken == address(0)) {
            // Native ETH payment
            commitAmount = msg.value;
            require(commitAmount > 0, "FairLaunch: zero commitment");
        } else {
            // ERC20 payment
            require(msg.value == 0, "FairLaunch: ETH not accepted");
            commitAmount = amount;
            require(commitAmount > 0, "FairLaunch: zero commitment");
            IERC20(saleInfo.paymentToken).safeTransferFrom(msg.sender, address(this), commitAmount);
        }

        // Check hard cap
        if (saleInfo.hardCap > 0) {
            uint256 maxCommit = saleInfo.hardCap - saleStatus.totalRaised;
            if (commitAmount > maxCommit) {
                // Refund excess
                uint256 excess = commitAmount - maxCommit;
                commitAmount = maxCommit;
                if (saleInfo.paymentToken == address(0)) {
                    (bool success, ) = msg.sender.call{value: excess}("");
                    require(success, "FairLaunch: ETH refund failed");
                } else {
                    IERC20(saleInfo.paymentToken).safeTransfer(msg.sender, excess);
                }
            }
        }

        require(commitAmount > 0, "FairLaunch: hard cap reached");

        // Track new participant
        if (commitments[msg.sender] == 0) {
            saleStatus.totalParticipants++;
        }

        commitments[msg.sender] += commitAmount;
        saleStatus.totalRaised += commitAmount;

        emit Committed(msg.sender, commitAmount, commitments[msg.sender]);
    }

    /**
     * @notice Claim allocated tokens after sale is finalized
     */
    function claim() external nonReentrant {
        require(saleStatus.finalized, "FairLaunch: not finalized");
        require(!claimed[msg.sender], "FairLaunch: already claimed");
        require(commitments[msg.sender] > 0, "FairLaunch: no commitment");

        claimed[msg.sender] = true;
        uint256 allocation = getAllocation(msg.sender);

        if (saleInfo.vestingDuration > 0) {
            // Create vesting wallet
            TokenVesting vesting = new TokenVesting(
                msg.sender,
                saleInfo.saleToken,
                allocation,
                block.timestamp,
                saleInfo.vestingCliff,
                saleInfo.vestingDuration
            );
            vestingWallets[msg.sender] = address(vesting);
            IERC20(saleInfo.saleToken).safeTransfer(address(vesting), allocation);
            emit Claimed(msg.sender, allocation, address(vesting));
        } else {
            // Instant distribution
            IERC20(saleInfo.saleToken).safeTransfer(msg.sender, allocation);
            emit Claimed(msg.sender, allocation, address(0));
        }
    }

    /**
     * @notice Withdraw commitment if sale is cancelled or soft cap not met
     */
    function withdraw() external nonReentrant {
        require(
            saleStatus.cancelled ||
            (block.timestamp > saleInfo.endTime && !softCapReached()),
            "FairLaunch: cannot withdraw"
        );
        require(commitments[msg.sender] > 0, "FairLaunch: no commitment");

        uint256 amount = commitments[msg.sender];
        commitments[msg.sender] = 0;

        if (saleInfo.paymentToken == address(0)) {
            (bool success, ) = msg.sender.call{value: amount}("");
            require(success, "FairLaunch: ETH transfer failed");
        } else {
            IERC20(saleInfo.paymentToken).safeTransfer(msg.sender, amount);
        }

        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Finalize the sale - distribute funds and create liquidity
     */
    function finalize() external nonReentrant {
        require(block.timestamp > saleInfo.endTime, "FairLaunch: sale not ended");
        require(!saleStatus.finalized, "FairLaunch: already finalized");
        require(!saleStatus.cancelled, "FairLaunch: sale cancelled");
        require(softCapReached(), "FairLaunch: soft cap not reached");

        saleStatus.finalized = true;

        uint256 raised = saleStatus.totalRaised;

        // Calculate distribution
        uint256 platformFee = (raised * platformFeeBps) / 10000;
        uint256 liquidityAmount = (raised * liquidityBps) / 10000;
        uint256 creatorAmount = raised - platformFee - liquidityAmount;

        // Transfer platform fee
        if (platformFee > 0) {
            _transferPayment(platformFeeRecipient, platformFee);
        }

        // Transfer creator funds
        if (creatorAmount > 0) {
            _transferPayment(creator, creatorAmount);
        }

        // Create DEX liquidity
        uint256 liquidityCreated = 0;
        if (liquidityAmount > 0 && tokensForLiquidity > 0) {
            liquidityCreated = _createLiquidity(tokensForLiquidity, liquidityAmount);
        }

        emit SaleFinalized(raised, saleStatus.totalParticipants, liquidityCreated);
    }

    /**
     * @notice Cancel the sale (creator only, before finalization)
     */
    function cancel() external {
        require(msg.sender == creator, "FairLaunch: not creator");
        require(!saleStatus.finalized, "FairLaunch: already finalized");
        require(!saleStatus.cancelled, "FairLaunch: already cancelled");

        saleStatus.cancelled = true;

        // Return sale tokens to creator
        uint256 tokenBalance = IERC20(saleInfo.saleToken).balanceOf(address(this));
        if (tokenBalance > 0) {
            IERC20(saleInfo.saleToken).safeTransfer(creator, tokenBalance);
        }

        emit SaleCancelled();
    }

    // ============================================================================
    // View Functions
    // ============================================================================

    /**
     * @notice Calculate tokens allocated to a user
     * @param user User address
     * @return Token allocation
     */
    function getAllocation(address user) public view returns (uint256) {
        if (saleStatus.totalRaised == 0) return 0;
        // Pro-rata: (userCommitment / totalRaised) * totalTokens
        return (commitments[user] * saleInfo.totalTokens) / saleStatus.totalRaised;
    }

    /**
     * @notice Get current token price based on commitments
     * @return Price in payment tokens per sale token (18 decimals precision)
     */
    function getCurrentPrice() external view returns (uint256) {
        if (saleStatus.totalRaised == 0) return 0;
        // price = totalRaised / totalTokens (scaled to 18 decimals)
        return (saleStatus.totalRaised * 1e18) / saleInfo.totalTokens;
    }

    /**
     * @notice Check if sale is currently active
     */
    function isActive() public view returns (bool) {
        return block.timestamp >= saleInfo.startTime &&
               block.timestamp <= saleInfo.endTime &&
               !saleStatus.finalized &&
               !saleStatus.cancelled;
    }

    /**
     * @notice Check if soft cap has been reached
     */
    function softCapReached() public view returns (bool) {
        return saleInfo.softCap == 0 || saleStatus.totalRaised >= saleInfo.softCap;
    }

    /**
     * @notice Check if hard cap has been reached
     */
    function hardCapReached() public view returns (bool) {
        return saleInfo.hardCap > 0 && saleStatus.totalRaised >= saleInfo.hardCap;
    }

    // ============================================================================
    // Internal Functions
    // ============================================================================

    function _transferPayment(address to, uint256 amount) internal {
        if (saleInfo.paymentToken == address(0)) {
            (bool success, ) = to.call{value: amount}("");
            require(success, "FairLaunch: ETH transfer failed");
        } else {
            IERC20(saleInfo.paymentToken).safeTransfer(to, amount);
        }
    }

    function _createLiquidity(uint256 tokenAmount, uint256 paymentAmount) internal returns (uint256) {
        IERC20(saleInfo.saleToken).approve(router, tokenAmount);

        uint256 liquidity;
        address pair;

        if (saleInfo.paymentToken == address(0)) {
            // ETH liquidity
            (, , liquidity) = IUniswapV2Router02(router).addLiquidityETH{value: paymentAmount}(
                saleInfo.saleToken,
                tokenAmount,
                0, // Accept any amount of tokens
                0, // Accept any amount of ETH
                creator, // LP tokens go to creator
                block.timestamp
            );
            pair = IUniswapV2Factory(factory).getPair(saleInfo.saleToken, weth);
        } else {
            // ERC20 liquidity
            IERC20(saleInfo.paymentToken).approve(router, paymentAmount);
            (, , liquidity) = IUniswapV2Router02(router).addLiquidity(
                saleInfo.saleToken,
                saleInfo.paymentToken,
                tokenAmount,
                paymentAmount,
                0,
                0,
                creator,
                block.timestamp
            );
            pair = IUniswapV2Factory(factory).getPair(saleInfo.saleToken, saleInfo.paymentToken);
        }

        emit LiquidityCreated(pair, tokenAmount, paymentAmount);
        return liquidity;
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
