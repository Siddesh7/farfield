// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title FarfieldMarketplace
 * @dev Smart contract for handling digital product purchases on Farfield platform using USDC
 * @author Farfield Team
 */
contract FarfieldMarketplace is ReentrancyGuard, Ownable, Pausable {
    
    IERC20 public immutable usdcToken;
    uint256 public platformFeePercentage = 100; // 1.0%
    uint256 public constant MAX_PLATFORM_FEE = 1000; // 10%
    address public platformWallet;
    uint256 public totalVolumeProcessed;
    uint256 public totalPurchases;
    
    struct Purchase {
        string purchaseId;
        address buyer;
        address[] sellers;
        uint256[] sellerAmounts;
        uint256 totalAmount;
        uint256 platformFee;
        uint256 timestamp;
        bool exists;
        bool refunded;
    }
    
    struct SellerInfo {
        uint256 totalEarnings;
        uint256 availableBalance;
        uint256 totalWithdrawn;
        uint256 totalSales;
    }
    
    mapping(string => Purchase) public purchases;
    mapping(address => SellerInfo) public sellerInfos;
    mapping(string => bool) public purchaseIdUsed;
    
    event PurchaseProcessed(
        string indexed purchaseId,
        address indexed buyer,
        uint256 totalAmount,
        uint256 platformFee,
        address[] sellers,
        uint256[] sellerAmounts
    );
    
    event EarningsWithdrawn(
        address indexed seller,
        uint256 amount,
        uint256 remainingBalance
    );
    
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event PlatformWalletUpdated(address oldWallet, address newWallet);
    event RefundProcessed(string indexed purchaseId, address indexed buyer, uint256 amount);
    
    modifier validPurchaseId(string memory purchaseId) {
        require(bytes(purchaseId).length > 0, "Farfield: Empty purchase ID");
        require(!purchaseIdUsed[purchaseId], "Farfield: Purchase ID already used");
        _;
    }
    
    modifier purchaseExists(string memory purchaseId) {
        require(purchases[purchaseId].exists, "Farfield: Purchase not found");
        _;
    }
    
    constructor(address _usdcToken, address _platformWallet) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Farfield: Invalid USDC token address");
        require(_platformWallet != address(0), "Farfield: Invalid platform wallet");
        
        usdcToken = IERC20(_usdcToken);
        platformWallet = _platformWallet;
    }
    
    /**
     * @notice Process a purchase using raw prices - contract handles fees automatically
     * @param purchaseId Unique identifier for this purchase
     * @param productPrices Array of raw product prices (before any fees, in USDC 6 decimals)
     * @param sellerAddresses Array of seller wallet addresses (must match productPrices length)
     */
    function processPurchase(
    string memory purchaseId,
    uint256[] memory productPrices,
    address[] memory sellerAddresses
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        validPurchaseId(purchaseId) 
    {
        require(productPrices.length > 0, "Farfield: No products provided");
        require(productPrices.length == sellerAddresses.length, "Farfield: Arrays length mismatch");
        
        uint256 totalBaseAmount = 0;
        uint256 totalFeeApplicableAmount = 0;

        for (uint256 i = 0; i < productPrices.length; i++) {
            require(sellerAddresses[i] != address(0), "Farfield: Invalid seller address");
            totalBaseAmount += productPrices[i];

            // Only add to fee calculation if product has a price
            if (productPrices[i] > 0) {
                totalFeeApplicableAmount += productPrices[i];
            }
        }
        
        // Platform fee only applies to non-zero priced products
        uint256 platformFee = (totalFeeApplicableAmount * platformFeePercentage) / 10000;
        
        // Payment transfer only if something is being paid
        if (totalBaseAmount > 0) {
            require(usdcToken.balanceOf(msg.sender) >= totalBaseAmount, "Farfield: Insufficient USDC balance");
            require(usdcToken.allowance(msg.sender, address(this)) >= totalBaseAmount, "Farfield: Insufficient USDC allowance");
            require(usdcToken.transferFrom(msg.sender, address(this), totalBaseAmount), "Farfield: USDC transfer failed");
        }

        uint256[] memory sellerAmounts = new uint256[](productPrices.length);
        for (uint256 i = 0; i < productPrices.length; i++) {
            if (productPrices[i] > 0) {
                uint256 sellerFeeDeduction = (productPrices[i] * platformFeePercentage) / 10000;
                sellerAmounts[i] = productPrices[i] - sellerFeeDeduction;
            } else {
                sellerAmounts[i] = 0; // No earnings for free products
            }
        }

        purchases[purchaseId] = Purchase({
            purchaseId: purchaseId,
            buyer: msg.sender,
            sellers: sellerAddresses,
            sellerAmounts: sellerAmounts,
            totalAmount: totalBaseAmount,
            platformFee: platformFee,
            timestamp: block.timestamp,
            exists: true,
            refunded: false
        });
        
        purchaseIdUsed[purchaseId] = true;
        
        for (uint256 i = 0; i < sellerAddresses.length; i++) {
            if (sellerAmounts[i] > 0) {
                sellerInfos[sellerAddresses[i]].totalEarnings += sellerAmounts[i];
                sellerInfos[sellerAddresses[i]].availableBalance += sellerAmounts[i];
                sellerInfos[sellerAddresses[i]].totalSales += 1;
            }
        }
        
        if (totalBaseAmount > 0) {
            totalVolumeProcessed += totalBaseAmount;
            totalPurchases += 1;
        }

        // Transfer platform fee only if > 0
        if (platformFee > 0) {
            require(usdcToken.transfer(platformWallet, platformFee), "Farfield: Platform fee transfer failed");
        }
        
        emit PurchaseProcessed(purchaseId, msg.sender, totalBaseAmount, platformFee, sellerAddresses, sellerAmounts);
    }
    
    /**
     * @notice Allow sellers to withdraw their available USDC earnings
     */
    function withdrawEarnings() external nonReentrant whenNotPaused {
        SellerInfo storage seller = sellerInfos[msg.sender];
        uint256 amount = seller.availableBalance;
        
        require(amount > 0, "Farfield: No earnings available");
        require(usdcToken.balanceOf(address(this)) >= amount, "Farfield: Insufficient contract USDC balance");
        
        seller.availableBalance = 0;
        seller.totalWithdrawn += amount;
        
        require(usdcToken.transfer(msg.sender, amount), "Farfield: USDC withdrawal failed");
        
        emit EarningsWithdrawn(msg.sender, amount, seller.availableBalance);
    }
    
    /**
     * @notice Withdraw specific amount (partial withdrawal)
     * @param amount Amount to withdraw (in USDC, 6 decimals)
     */
    function withdrawPartialEarnings(uint256 amount) external nonReentrant whenNotPaused {
        SellerInfo storage seller = sellerInfos[msg.sender];
        
        require(amount > 0, "Farfield: Amount must be greater than 0");
        require(seller.availableBalance >= amount, "Farfield: Insufficient balance");
        require(usdcToken.balanceOf(address(this)) >= amount, "Farfield: Insufficient contract USDC balance");
        
        seller.availableBalance -= amount;
        seller.totalWithdrawn += amount;
        
        require(usdcToken.transfer(msg.sender, amount), "Farfield: USDC withdrawal failed");
        
        emit EarningsWithdrawn(msg.sender, amount, seller.availableBalance);
    }
    
    /**
     * @notice Calculate purchase breakdown - fee is deducted from product prices
     * @param productPrices Array of product prices (what user pays)
     * @return totalUserPays Total amount user pays (sum of product prices)
     * @return platformFee Platform fee amount (deducted from user payment)
     * @return totalToSellers Total amount sellers receive (user payment minus platform fee)
     */
    function calculatePurchaseCost(uint256[] memory productPrices)
        external
        view
        returns (
            uint256 totalUserPays,
            uint256 platformFee,
            uint256 totalToSellers
        )
    {
        totalUserPays = 0;
        for (uint256 i = 0; i < productPrices.length; i++) {
            totalUserPays += productPrices[i];
        }
        
        platformFee = (totalUserPays * platformFeePercentage) / 10000;
        totalToSellers = totalUserPays - platformFee;
        
        return (totalUserPays, platformFee, totalToSellers);
    }
    
    /**
     * @notice Verify if a purchase exists and get its details
     */
    function verifyPurchase(string memory purchaseId) 
        external 
        view 
        returns (
            bool exists,
            address buyer,
            uint256 totalAmount,
            uint256 timestamp,
            bool refunded
        ) 
    {
        Purchase memory purchase = purchases[purchaseId];
        return (
            purchase.exists,
            purchase.buyer,
            purchase.totalAmount,
            purchase.timestamp,
            purchase.refunded
        );
    }
    
    /**
     * @notice Get complete purchase details
     * @param purchaseId The purchase ID
     */
    function getPurchaseDetails(string memory purchaseId) 
        external 
        view 
        purchaseExists(purchaseId)
        returns (Purchase memory) 
    {
        return purchases[purchaseId];
    }
    
    /**
     * @notice Get seller information
     * @param sellerAddress The seller's wallet address
     */
    function getSellerInfo(address sellerAddress) 
        external 
        view 
        returns (SellerInfo memory) 
    {
        return sellerInfos[sellerAddress];
    }
    
    /**
     * @notice Get marketplace statistics
     */
    function getMarketplaceStats() 
        external 
        view 
        returns (
            uint256 volume,
            uint256 totalPurchaseCount,
            uint256 feePercentage,
            address platform,
            address token
        ) 
    {
        return (
            totalVolumeProcessed,
            totalPurchases,
            platformFeePercentage,
            platformWallet,
            address(usdcToken)
        );
    }
    
    /**
     * @notice Get contract USDC balance
     */
    function getContractUSDCBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }
    
    /**
     * @notice Update platform fee percentage (only owner)
     */
    function updatePlatformFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= MAX_PLATFORM_FEE, "Farfield: Fee too high");
        
        uint256 oldFee = platformFeePercentage;
        platformFeePercentage = newFeePercentage;
        
        emit PlatformFeeUpdated(oldFee, newFeePercentage);
    }
    
    /**
     * @notice Update platform wallet address (only owner)
     */
    function updatePlatformWallet(address newPlatformWallet) external onlyOwner {
        require(newPlatformWallet != address(0), "Farfield: Invalid address");
        
        address oldWallet = platformWallet;
        platformWallet = newPlatformWallet;
        
        emit PlatformWalletUpdated(oldWallet, newPlatformWallet);
    }
    
    /**
     * @notice Pause the contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause the contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Emergency refund function (only owner)
     * @param purchaseId Purchase to refund
     */
    function emergencyRefund(string memory purchaseId) 
        external 
        onlyOwner 
        nonReentrant 
        purchaseExists(purchaseId) 
    {
        Purchase storage purchase = purchases[purchaseId];
        require(!purchase.refunded, "Farfield: Already refunded");
        
        // Mark as refunded
        purchase.refunded = true;
        
        for (uint256 i = 0; i < purchase.sellers.length; i++) {
            address sellerAddr = purchase.sellers[i];
            uint256 amount = purchase.sellerAmounts[i];
            
            if (sellerInfos[sellerAddr].availableBalance >= amount) {
                sellerInfos[sellerAddr].availableBalance -= amount;
            }
        }
        uint256 refundAmount = purchase.totalAmount - purchase.platformFee;
        require(usdcToken.transfer(purchase.buyer, refundAmount), "Farfield: USDC refund failed");
        
        emit RefundProcessed(purchaseId, purchase.buyer, refundAmount);
    }
    
    /**
     * @notice Emergency withdrawal of contract USDC balance (only owner)
     */
    function emergencyWithdrawUSDC() external onlyOwner {
        uint256 balance = usdcToken.balanceOf(address(this));
        require(balance > 0, "Farfield: No USDC balance to withdraw");
        
        require(usdcToken.transfer(owner(), balance), "Farfield: Emergency USDC withdrawal failed");
    }
    
    receive() external payable {
        revert("Farfield: ETH transfers not supported, use USDC");
    }
    
    fallback() external payable {
        revert("Farfield: Function not found");
    }
}