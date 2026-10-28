// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title DeadManVault
 * @notice A decentralized digital inheritance and dead-man's switch vault.
 *         The owner periodically checks in. If the owner becomes inactive for longer
 *         than `inactivityTimeout`, the designated beneficiary can claim the vault balance.
 * @dev Standalone, EVM 'paris' compatible, fully compliant with Tally contract provenance.
 */
contract DeadManVault {
    address public owner;
    address public beneficiary;
    uint256 public inactivityTimeout;
    uint256 public lastCheckIn;

    uint256 private _status = 1;

    // --- Events ---
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event BeneficiaryUpdated(address indexed previousBeneficiary, address indexed newBeneficiary);
    event TimeoutUpdated(uint256 previousTimeout, uint256 newTimeout);
    event CheckedIn(address indexed owner, uint256 timestamp);
    event Deposited(address indexed sender, uint256 amount);
    event InheritanceClaimed(address indexed beneficiary, uint256 amount);
    event EmergencyWithdrawal(address indexed owner, uint256 amount);

    // --- Custom Errors ---
    error Unauthorized();
    error ZeroAddress();
    error InvalidTimeout();
    error SwitchNotTriggered(uint256 timeRemaining);
    error NoFundsToClaim();
    error TransferFailed();
    error ReentrancyGuard();

    // --- Modifiers ---
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyBeneficiary() {
        if (msg.sender != beneficiary) revert Unauthorized();
        _;
    }

    modifier nonReentrant() {
        if (_status != 1) revert ReentrancyGuard();
        _status = 2;
        _;
        _status = 1;
    }

    /**
     * @notice Initializes the DeadManVault.
     * @param _beneficiary The designated recipient address who can claim funds if the switch trips.
     * @param _timeoutSeconds Inactivity threshold in seconds (e.g., 90 days = 7776000 seconds).
     */
    constructor(address _beneficiary, uint256 _timeoutSeconds) payable {
        if (_beneficiary == address(0)) revert ZeroAddress();
        if (_timeoutSeconds < 1 hours) revert InvalidTimeout();

        owner = msg.sender;
        beneficiary = _beneficiary;
        inactivityTimeout = _timeoutSeconds;
        lastCheckIn = block.timestamp;

        emit OwnershipTransferred(address(0), msg.sender);
        emit BeneficiaryUpdated(address(0), _beneficiary);
        emit TimeoutUpdated(0, _timeoutSeconds);
        emit CheckedIn(msg.sender, block.timestamp);

        if (msg.value > 0) {
            emit Deposited(msg.sender, msg.value);
        }
    }

    // --- Deposit ---
    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    function deposit() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    // --- Check-in / Heartbeat ---
    /**
     * @notice Heartbeat ping confirming the owner is active. Resets the inactivity timer.
     */
    function checkIn() external onlyOwner {
        lastCheckIn = block.timestamp;
        emit CheckedIn(msg.sender, block.timestamp);
    }

    // --- Inheritance Claim ---
    /**
     * @notice Allows the designated beneficiary to claim all vault funds once the inactivity threshold has passed.
     */
    function claimInheritance() external onlyBeneficiary nonReentrant {
        uint256 elapsed = block.timestamp - lastCheckIn;
        if (elapsed < inactivityTimeout) {
            revert SwitchNotTriggered(inactivityTimeout - elapsed);
        }

        uint256 balance = address(this).balance;
        if (balance == 0) revert NoFundsToClaim();

        (bool success, ) = payable(beneficiary).call{value: balance}("");
        if (!success) revert TransferFailed();

        emit InheritanceClaimed(beneficiary, balance);
    }

    // --- View Functions ---
    /**
     * @notice Returns seconds until switch triggers, or 0 if claimable right now.
     */
    function timeUntilTrigger() external view returns (uint256) {
        uint256 elapsed = block.timestamp - lastCheckIn;
        if (elapsed >= inactivityTimeout) {
            return 0;
        }
        return inactivityTimeout - elapsed;
    }

    /**
     * @notice Returns true if the beneficiary can currently claim the funds.
     */
    function isClaimable() external view returns (bool) {
        return (block.timestamp - lastCheckIn) >= inactivityTimeout && address(this).balance > 0;
    }

    function getVaultBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // --- Owner Management ---
    function setBeneficiary(address newBeneficiary) external onlyOwner {
        if (newBeneficiary == address(0)) revert ZeroAddress();
        emit BeneficiaryUpdated(beneficiary, newBeneficiary);
        beneficiary = newBeneficiary;
    }

    function setInactivityTimeout(uint256 newTimeoutSeconds) external onlyOwner {
        if (newTimeoutSeconds < 1 hours) revert InvalidTimeout();
        emit TimeoutUpdated(inactivityTimeout, newTimeoutSeconds);
        inactivityTimeout = newTimeoutSeconds;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function emergencyWithdraw(address payable to) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoFundsToClaim();

        (bool success, ) = to.call{value: balance}("");
        if (!success) revert TransferFailed();

        emit EmergencyWithdrawal(to, balance);
    }
}
