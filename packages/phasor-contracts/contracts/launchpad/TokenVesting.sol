// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TokenVesting
 * @notice Linear token vesting with optional cliff period
 * @dev Based on OpenZeppelin VestingWallet pattern, simplified for launchpad use
 */
contract TokenVesting {
    using SafeERC20 for IERC20;

    /// @notice Beneficiary address that will receive vested tokens
    address public immutable beneficiary;
    /// @notice Token being vested
    address public immutable token;
    /// @notice Total amount of tokens to be vested
    uint256 public immutable totalAmount;
    /// @notice Timestamp when vesting starts
    uint256 public immutable startTime;
    /// @notice Timestamp when cliff ends (tokens can't be released before this)
    uint256 public immutable cliffTime;
    /// @notice Timestamp when vesting ends (all tokens fully vested)
    uint256 public immutable endTime;
    /// @notice Amount of tokens already released
    uint256 public released;

    event TokensReleased(address indexed beneficiary, uint256 amount);

    /**
     * @notice Constructor for vesting contract
     * @param _beneficiary Address that will receive vested tokens
     * @param _token Token contract address
     * @param _totalAmount Total tokens to vest
     * @param _startTime Timestamp when vesting starts
     * @param _cliffDuration Duration of cliff period in seconds
     * @param _vestingDuration Total vesting duration in seconds (includes cliff)
     */
    constructor(
        address _beneficiary,
        address _token,
        uint256 _totalAmount,
        uint256 _startTime,
        uint256 _cliffDuration,
        uint256 _vestingDuration
    ) {
        require(_beneficiary != address(0), "TokenVesting: beneficiary is zero");
        require(_token != address(0), "TokenVesting: token is zero");
        require(_totalAmount > 0, "TokenVesting: amount is zero");
        require(_vestingDuration > 0, "TokenVesting: duration is zero");
        require(_cliffDuration <= _vestingDuration, "TokenVesting: cliff exceeds duration");

        beneficiary = _beneficiary;
        token = _token;
        totalAmount = _totalAmount;
        startTime = _startTime;
        cliffTime = _startTime + _cliffDuration;
        endTime = _startTime + _vestingDuration;
    }

    /**
     * @notice Calculate total vested amount at current time
     * @return Amount of tokens that have vested
     */
    function vestedAmount() public view returns (uint256) {
        if (block.timestamp < cliffTime) {
            return 0;
        }
        if (block.timestamp >= endTime) {
            return totalAmount;
        }
        // Linear vesting: (elapsed time / total duration) * total amount
        return (totalAmount * (block.timestamp - startTime)) / (endTime - startTime);
    }

    /**
     * @notice Calculate amount available to release
     * @return Amount of tokens that can be released now
     */
    function releasable() public view returns (uint256) {
        return vestedAmount() - released;
    }

    /**
     * @notice Release vested tokens to beneficiary
     * @dev Anyone can call this, tokens always go to beneficiary
     */
    function release() external {
        uint256 amount = releasable();
        require(amount > 0, "TokenVesting: nothing to release");

        released += amount;
        IERC20(token).safeTransfer(beneficiary, amount);

        emit TokensReleased(beneficiary, amount);
    }

    /**
     * @notice Get vesting schedule info
     * @return _beneficiary Beneficiary address
     * @return _token Token address
     * @return _totalAmount Total vesting amount
     * @return _released Amount already released
     * @return _startTime Vesting start time
     * @return _cliffTime Cliff end time
     * @return _endTime Vesting end time
     */
    function getVestingInfo() external view returns (
        address _beneficiary,
        address _token,
        uint256 _totalAmount,
        uint256 _released,
        uint256 _startTime,
        uint256 _cliffTime,
        uint256 _endTime
    ) {
        return (beneficiary, token, totalAmount, released, startTime, cliffTime, endTime);
    }
}
