// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/launchpad/FairLaunch.sol";
import "../contracts/launchpad/LaunchpadFactory.sol";
import "../contracts/launchpad/TokenVesting.sol";
import "../contracts/test/MockLP.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Simple mock ERC20 for testing with extra tokens for liquidity
contract MockSaleToken is ERC20 {
    constructor() ERC20("Mock Sale Token", "MST") {
        // Mint 2M tokens - enough for sale + liquidity
        _mint(msg.sender, 2_000_000 * 1e18);
    }
}

contract MockRouter {
    address public factory;
    address public WETH;
    address public lastPair;

    constructor(address _factory, address _weth) {
        factory = _factory;
        WETH = _weth;
    }

    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint,
        uint,
        address,
        uint
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity) {
        // Just accept tokens and ETH for testing
        IERC20(token).transferFrom(msg.sender, address(this), amountTokenDesired);
        return (amountTokenDesired, msg.value, amountTokenDesired);
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint,
        uint,
        address,
        uint
    ) external returns (uint amountA, uint amountB, uint liquidity) {
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountADesired);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountBDesired);
        return (amountADesired, amountBDesired, amountADesired);
    }
}

contract MockFactory {
    function getPair(address, address) external view returns (address) {
        return address(this); // Return self as mock pair
    }
}

contract FairLaunchTest is Test {
    LaunchpadFactory public launchpadFactory;
    FairLaunch public fairLaunchTemplate;
    MockSaleToken public saleToken;
    MockRouter public router;
    MockFactory public uniswapFactory;

    address public owner = address(1);
    address public creator = address(2);
    address public user1 = address(3);
    address public user2 = address(4);
    address public weth = address(5);

    uint256 constant SALE_AMOUNT = 1_000_000 * 1e18;
    uint256 constant LIQUIDITY_TOKENS = 100_000 * 1e18;

    function setUp() public {
        vm.startPrank(owner);

        // Deploy mocks
        uniswapFactory = new MockFactory();
        router = new MockRouter(address(uniswapFactory), weth);

        // Deploy FairLaunch template
        fairLaunchTemplate = new FairLaunch();

        // Deploy LaunchpadFactory
        launchpadFactory = new LaunchpadFactory(
            address(uniswapFactory),
            address(router),
            weth,
            address(fairLaunchTemplate),
            owner,    // Platform fee recipient
            200       // 2% platform fee
        );

        vm.stopPrank();

        // Deploy sale token and transfer to creator
        vm.startPrank(creator);
        saleToken = new MockSaleToken();
        vm.stopPrank();

        // Fund users with ETH
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
    }

    function _createBasicLaunch() internal returns (address) {
        vm.startPrank(creator);

        // Approve tokens
        saleToken.approve(address(launchpadFactory), SALE_AMOUNT + LIQUIDITY_TOKENS);

        // Create launch params
        LaunchpadFactory.CreateLaunchParams memory params = LaunchpadFactory.CreateLaunchParams({
            saleToken: address(saleToken),
            paymentToken: address(0),          // ETH payment
            totalTokens: SALE_AMOUNT,
            tokensForLiquidity: LIQUIDITY_TOKENS,
            startTime: block.timestamp + 1,    // Start in 1 second
            endTime: block.timestamp + 1 days, // End in 1 day
            softCap: 0,                        // No soft cap
            hardCap: 0,                        // No hard cap
            vestingDuration: 0,                // No vesting
            vestingCliff: 0,                   // No cliff
            liquidityBps: 3000                 // 30% liquidity
        });

        address launch = launchpadFactory.createFairLaunch(params);

        vm.stopPrank();
        return launch;
    }

    // =========================================================================
    // Test 1: Basic Sale Flow
    // =========================================================================

    function testBasicSaleFlow() public {
        address launchAddr = _createBasicLaunch();
        FairLaunch launch = FairLaunch(payable(launchAddr));

        // Advance to sale start
        vm.warp(block.timestamp + 2);

        // User1 commits 10 ETH
        vm.prank(user1);
        launch.commit{value: 10 ether}(0);

        assertEq(launch.commitments(user1), 10 ether, "User1 commitment incorrect");

        // Advance past sale end
        vm.warp(block.timestamp + 2 days);

        // Finalize
        launch.finalize();

        (,, bool finalized,) = launch.saleStatus();
        assertTrue(finalized, "Sale should be finalized");

        // User1 claims
        vm.prank(user1);
        launch.claim();

        assertTrue(launch.claimed(user1), "User1 should be marked as claimed");
        assertEq(saleToken.balanceOf(user1), SALE_AMOUNT, "User1 should receive all tokens");
    }

    // =========================================================================
    // Test 2: Pro-rata Distribution
    // =========================================================================

    function testProRataDistribution() public {
        address launchAddr = _createBasicLaunch();
        FairLaunch launch = FairLaunch(payable(launchAddr));

        // Advance to sale start
        vm.warp(block.timestamp + 2);

        // User1 commits 10 ETH (2/3)
        vm.prank(user1);
        launch.commit{value: 10 ether}(0);

        // User2 commits 5 ETH (1/3)
        vm.prank(user2);
        launch.commit{value: 5 ether}(0);

        // Check allocations
        uint256 alloc1 = launch.getAllocation(user1);
        uint256 alloc2 = launch.getAllocation(user2);

        // User1 should get 2/3, User2 should get 1/3
        assertEq(alloc1, SALE_AMOUNT * 2 / 3, "User1 allocation incorrect");
        assertEq(alloc2, SALE_AMOUNT / 3, "User2 allocation incorrect");

        // Finalize and claim
        vm.warp(block.timestamp + 2 days);
        launch.finalize();

        vm.prank(user1);
        launch.claim();
        vm.prank(user2);
        launch.claim();

        assertEq(saleToken.balanceOf(user1), SALE_AMOUNT * 2 / 3, "User1 tokens incorrect");
        assertEq(saleToken.balanceOf(user2), SALE_AMOUNT / 3, "User2 tokens incorrect");
    }

    // =========================================================================
    // Test 3: Soft Cap Not Met - Refunds
    // =========================================================================

    function testSoftCapNotMet() public {
        vm.startPrank(creator);
        saleToken.approve(address(launchpadFactory), SALE_AMOUNT + LIQUIDITY_TOKENS);

        LaunchpadFactory.CreateLaunchParams memory params = LaunchpadFactory.CreateLaunchParams({
            saleToken: address(saleToken),
            paymentToken: address(0),
            totalTokens: SALE_AMOUNT,
            tokensForLiquidity: LIQUIDITY_TOKENS,
            startTime: block.timestamp + 1,
            endTime: block.timestamp + 1 days,
            softCap: 100 ether,  // 100 ETH soft cap
            hardCap: 0,
            vestingDuration: 0,
            vestingCliff: 0,
            liquidityBps: 3000
        });
        address launchAddr = launchpadFactory.createFairLaunch(params);
        vm.stopPrank();

        FairLaunch launch = FairLaunch(payable(launchAddr));

        // Advance and commit only 10 ETH (below soft cap)
        vm.warp(block.timestamp + 2);

        vm.prank(user1);
        launch.commit{value: 10 ether}(0);

        // Advance past sale end
        vm.warp(block.timestamp + 2 days);

        // Cannot finalize - soft cap not met
        vm.expectRevert("FairLaunch: soft cap not reached");
        launch.finalize();

        // But user can withdraw
        uint256 balanceBefore = user1.balance;
        vm.prank(user1);
        launch.withdraw();

        assertEq(user1.balance, balanceBefore + 10 ether, "User should get full refund");
        assertEq(launch.commitments(user1), 0, "Commitment should be cleared");
    }

    // =========================================================================
    // Test 4: Hard Cap Reached
    // =========================================================================

    function testHardCapReached() public {
        vm.startPrank(creator);
        saleToken.approve(address(launchpadFactory), SALE_AMOUNT + LIQUIDITY_TOKENS);

        LaunchpadFactory.CreateLaunchParams memory params = LaunchpadFactory.CreateLaunchParams({
            saleToken: address(saleToken),
            paymentToken: address(0),
            totalTokens: SALE_AMOUNT,
            tokensForLiquidity: LIQUIDITY_TOKENS,
            startTime: block.timestamp + 1,
            endTime: block.timestamp + 1 days,
            softCap: 0,
            hardCap: 50 ether,   // 50 ETH hard cap
            vestingDuration: 0,
            vestingCliff: 0,
            liquidityBps: 3000
        });
        address launchAddr = launchpadFactory.createFairLaunch(params);
        vm.stopPrank();

        FairLaunch launch = FairLaunch(payable(launchAddr));

        // Advance to sale start
        vm.warp(block.timestamp + 2);

        // User1 tries to commit 100 ETH, but hard cap is 50
        uint256 balanceBefore = user1.balance;
        vm.prank(user1);
        launch.commit{value: 100 ether}(0);

        // Should only accept 50 ETH, refund 50 ETH
        assertEq(launch.commitments(user1), 50 ether, "Should commit only hard cap");
        assertEq(user1.balance, balanceBefore - 50 ether, "Should refund excess");

        (uint256 totalRaised,,,) = launch.saleStatus();
        assertEq(totalRaised, 50 ether, "Total raised should be hard cap");

        // Hard cap reached, further commits should fail
        vm.prank(user2);
        vm.expectRevert("FairLaunch: hard cap reached");
        launch.commit{value: 10 ether}(0);
    }

    // =========================================================================
    // Test 5: Vesting Claim
    // =========================================================================

    function testVestingClaim() public {
        vm.startPrank(creator);
        saleToken.approve(address(launchpadFactory), SALE_AMOUNT + LIQUIDITY_TOKENS);

        LaunchpadFactory.CreateLaunchParams memory params = LaunchpadFactory.CreateLaunchParams({
            saleToken: address(saleToken),
            paymentToken: address(0),
            totalTokens: SALE_AMOUNT,
            tokensForLiquidity: LIQUIDITY_TOKENS,
            startTime: block.timestamp + 1,
            endTime: block.timestamp + 1 days,
            softCap: 0,
            hardCap: 0,
            vestingDuration: 365 days,  // 1 year vesting
            vestingCliff: 90 days,      // 3 month cliff
            liquidityBps: 3000
        });
        address launchAddr = launchpadFactory.createFairLaunch(params);
        vm.stopPrank();

        FairLaunch launch = FairLaunch(payable(launchAddr));

        // Commit and finalize
        vm.warp(block.timestamp + 2);

        vm.prank(user1);
        launch.commit{value: 10 ether}(0);

        vm.warp(block.timestamp + 2 days);
        launch.finalize();

        // Claim - should create vesting wallet
        vm.prank(user1);
        launch.claim();

        address vestingAddr = launch.vestingWallets(user1);
        assertTrue(vestingAddr != address(0), "Vesting wallet should be created");

        TokenVesting vesting = TokenVesting(vestingAddr);

        // Check vesting parameters
        assertEq(vesting.beneficiary(), user1, "Beneficiary incorrect");
        assertEq(vesting.totalAmount(), SALE_AMOUNT, "Total amount incorrect");

        // During cliff, nothing releasable
        assertEq(vesting.releasable(), 0, "Nothing should be releasable during cliff");

        // Advance past cliff (3 months)
        vm.warp(block.timestamp + 91 days);

        // Now some should be releasable
        uint256 releasable = vesting.releasable();
        assertGt(releasable, 0, "Should have releasable tokens after cliff");

        // Release tokens
        vesting.release();
        assertGt(saleToken.balanceOf(user1), 0, "User should have received vested tokens");

        // Advance to end of vesting
        vm.warp(block.timestamp + 365 days);

        // Release remaining
        vesting.release();
        assertEq(saleToken.balanceOf(user1), SALE_AMOUNT, "User should have all tokens");
    }

    // =========================================================================
    // Test 6: Cancel Sale
    // =========================================================================

    function testCancelSale() public {
        address launchAddr = _createBasicLaunch();
        FairLaunch launch = FairLaunch(payable(launchAddr));

        // Advance and commit
        vm.warp(block.timestamp + 2);

        vm.prank(user1);
        launch.commit{value: 10 ether}(0);

        // Creator cancels
        vm.prank(creator);
        launch.cancel();

        (,,, bool cancelled) = launch.saleStatus();
        assertTrue(cancelled, "Sale should be cancelled");

        // Sale tokens should be returned to creator
        assertGt(saleToken.balanceOf(creator), 0, "Creator should receive tokens back");

        // User can withdraw
        uint256 balanceBefore = user1.balance;
        vm.prank(user1);
        launch.withdraw();

        assertEq(user1.balance, balanceBefore + 10 ether, "User should get full refund");
    }

    // =========================================================================
    // Test 7: Factory Tracking
    // =========================================================================

    function testFactoryTracking() public {
        address launch1 = _createBasicLaunch();

        // Create another launch
        vm.startPrank(creator);
        saleToken.approve(address(launchpadFactory), SALE_AMOUNT + LIQUIDITY_TOKENS);
        vm.stopPrank();

        // Need more tokens for second launch
        vm.prank(creator);
        saleToken = new MockSaleToken();

        vm.startPrank(creator);
        saleToken.approve(address(launchpadFactory), SALE_AMOUNT + LIQUIDITY_TOKENS);

        LaunchpadFactory.CreateLaunchParams memory params = LaunchpadFactory.CreateLaunchParams({
            saleToken: address(saleToken),
            paymentToken: address(0),
            totalTokens: SALE_AMOUNT,
            tokensForLiquidity: LIQUIDITY_TOKENS,
            startTime: block.timestamp + 1,
            endTime: block.timestamp + 1 days,
            softCap: 0,
            hardCap: 0,
            vestingDuration: 0,
            vestingCliff: 0,
            liquidityBps: 3000
        });
        address launch2 = launchpadFactory.createFairLaunch(params);
        vm.stopPrank();

        // Check tracking
        assertEq(launchpadFactory.launchCount(), 2, "Should have 2 launches");
        assertTrue(launchpadFactory.isLaunch(launch1), "Launch1 should be tracked");
        assertTrue(launchpadFactory.isLaunch(launch2), "Launch2 should be tracked");

        address[] memory creatorLaunches = launchpadFactory.getLaunchesByCreator(creator);
        assertEq(creatorLaunches.length, 2, "Creator should have 2 launches");
    }
}
