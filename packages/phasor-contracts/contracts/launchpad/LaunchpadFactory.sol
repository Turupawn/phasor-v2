// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./FairLaunch.sol";

/**
 * @title LaunchpadFactory
 * @notice Factory for creating FairLaunch token sales
 * @dev Uses EIP-1167 minimal proxy pattern for gas-efficient deployments
 */
contract LaunchpadFactory is Ownable {
    using SafeERC20 for IERC20;
    using Clones for address;

    /// @notice Parameters for creating a launch (reduces stack depth)
    struct CreateLaunchParams {
        address saleToken;
        address paymentToken;
        uint256 totalTokens;
        uint256 tokensForLiquidity;
        uint256 startTime;
        uint256 endTime;
        uint256 softCap;
        uint256 hardCap;
        uint256 vestingDuration;
        uint256 vestingCliff;
        uint256 liquidityBps;
    }

    /// @notice DEX integration
    address public immutable uniswapFactory;
    address public immutable uniswapRouter;
    address public immutable weth;

    /// @notice FairLaunch implementation for cloning
    address public fairLaunchTemplate;

    /// @notice Platform configuration
    address public platformFeeRecipient;
    uint256 public platformFeeBps;        // Default: 200 (2%)
    uint256 public defaultLiquidityBps;   // Default: 3000 (30%)

    /// @notice Tracking
    address[] public allLaunches;
    mapping(address => bool) public isLaunch;
    mapping(address => address[]) public launchesByCreator;

    // Events
    event LaunchCreated(
        address indexed launch,
        address indexed creator,
        address indexed saleToken,
        address paymentToken,
        uint256 totalTokens,
        uint256 startTime,
        uint256 endTime
    );
    event TemplateUpdated(address oldTemplate, address newTemplate);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event PlatformFeeRecipientUpdated(address oldRecipient, address newRecipient);
    event DefaultLiquidityUpdated(uint256 oldBps, uint256 newBps);

    /**
     * @notice Constructor
     * @param _uniswapFactory Uniswap V2 factory address
     * @param _uniswapRouter Uniswap V2 router address
     * @param _weth WETH/WMON address
     * @param _fairLaunchTemplate FairLaunch implementation address
     * @param _platformFeeRecipient Platform fee recipient
     * @param _platformFeeBps Platform fee in basis points
     */
    constructor(
        address _uniswapFactory,
        address _uniswapRouter,
        address _weth,
        address _fairLaunchTemplate,
        address _platformFeeRecipient,
        uint256 _platformFeeBps
    ) Ownable(msg.sender) {
        require(_uniswapFactory != address(0), "LaunchpadFactory: invalid factory");
        require(_uniswapRouter != address(0), "LaunchpadFactory: invalid router");
        require(_weth != address(0), "LaunchpadFactory: invalid weth");
        require(_fairLaunchTemplate != address(0), "LaunchpadFactory: invalid template");
        require(_platformFeeRecipient != address(0), "LaunchpadFactory: invalid fee recipient");
        require(_platformFeeBps <= 1000, "LaunchpadFactory: fee too high"); // Max 10%

        uniswapFactory = _uniswapFactory;
        uniswapRouter = _uniswapRouter;
        weth = _weth;
        fairLaunchTemplate = _fairLaunchTemplate;
        platformFeeRecipient = _platformFeeRecipient;
        platformFeeBps = _platformFeeBps;
        defaultLiquidityBps = 3000; // 30% default
    }

    /**
     * @notice Create a new fair launch sale
     * @param params CreateLaunchParams struct containing all sale configuration
     * @return launch Address of created FairLaunch contract
     */
    function createFairLaunch(CreateLaunchParams calldata params) external returns (address launch) {
        require(params.saleToken != address(0), "LaunchpadFactory: invalid sale token");
        require(params.totalTokens > 0, "LaunchpadFactory: invalid total tokens");
        require(params.startTime > block.timestamp, "LaunchpadFactory: start in past");
        require(params.endTime > params.startTime, "LaunchpadFactory: invalid times");
        require(params.vestingCliff <= params.vestingDuration, "LaunchpadFactory: cliff exceeds duration");

        // Use default liquidity if not specified
        uint256 actualLiquidityBps = params.liquidityBps > 0 ? params.liquidityBps : defaultLiquidityBps;
        require(actualLiquidityBps <= 10000, "LaunchpadFactory: invalid liquidity bps");

        // Clone FairLaunch template
        launch = fairLaunchTemplate.clone();

        // Initialize the clone
        _initializeLaunch(launch, params, actualLiquidityBps);

        // Transfer tokens from creator to launch contract
        uint256 totalRequired = params.totalTokens + params.tokensForLiquidity;
        IERC20(params.saleToken).safeTransferFrom(msg.sender, launch, totalRequired);

        // Track launch
        allLaunches.push(launch);
        isLaunch[launch] = true;
        launchesByCreator[msg.sender].push(launch);

        emit LaunchCreated(
            launch,
            msg.sender,
            params.saleToken,
            params.paymentToken,
            params.totalTokens,
            params.startTime,
            params.endTime
        );
    }

    /**
     * @dev Internal function to initialize launch (reduces stack depth)
     */
    function _initializeLaunch(
        address launch,
        CreateLaunchParams calldata params,
        uint256 actualLiquidityBps
    ) internal {
        FairLaunch.SaleInfo memory saleInfo = FairLaunch.SaleInfo({
            saleToken: params.saleToken,
            paymentToken: params.paymentToken,
            totalTokens: params.totalTokens,
            startTime: params.startTime,
            endTime: params.endTime,
            softCap: params.softCap,
            hardCap: params.hardCap,
            vestingDuration: params.vestingDuration,
            vestingCliff: params.vestingCliff
        });

        FairLaunch(payable(launch)).initialize(
            saleInfo,
            msg.sender,
            uniswapRouter,
            weth,
            actualLiquidityBps,
            params.tokensForLiquidity,
            platformFeeRecipient,
            platformFeeBps
        );
    }

    // ============================================================================
    // View Functions
    // ============================================================================

    /**
     * @notice Get all launches
     */
    function getAllLaunches() external view returns (address[] memory) {
        return allLaunches;
    }

    /**
     * @notice Get launches by creator
     */
    function getLaunchesByCreator(address creator) external view returns (address[] memory) {
        return launchesByCreator[creator];
    }

    /**
     * @notice Get total number of launches
     */
    function launchCount() external view returns (uint256) {
        return allLaunches.length;
    }

    /**
     * @notice Get launch at index
     */
    function getLaunchAt(uint256 index) external view returns (address) {
        require(index < allLaunches.length, "LaunchpadFactory: index out of bounds");
        return allLaunches[index];
    }

    // ============================================================================
    // Admin Functions
    // ============================================================================

    /**
     * @notice Update FairLaunch template
     */
    function setFairLaunchTemplate(address _template) external onlyOwner {
        require(_template != address(0), "LaunchpadFactory: invalid template");
        emit TemplateUpdated(fairLaunchTemplate, _template);
        fairLaunchTemplate = _template;
    }

    /**
     * @notice Update platform fee
     */
    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "LaunchpadFactory: fee too high"); // Max 10%
        emit PlatformFeeUpdated(platformFeeBps, _feeBps);
        platformFeeBps = _feeBps;
    }

    /**
     * @notice Update platform fee recipient
     */
    function setPlatformFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "LaunchpadFactory: invalid recipient");
        emit PlatformFeeRecipientUpdated(platformFeeRecipient, _recipient);
        platformFeeRecipient = _recipient;
    }

    /**
     * @notice Update default liquidity percentage
     */
    function setDefaultLiquidityBps(uint256 _bps) external onlyOwner {
        require(_bps <= 10000, "LaunchpadFactory: invalid bps");
        emit DefaultLiquidityUpdated(defaultLiquidityBps, _bps);
        defaultLiquidityBps = _bps;
    }
}
