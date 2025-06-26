// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IndividualNFTCollection.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NFTCollectionFactory
 * @dev Factory contract to create individual NFT collection contracts
 */
contract NFTCollectionFactory is Ownable, ReentrancyGuard {
    // Collection registry
    struct CollectionInfo {
        address contractAddress;
        string name;
        string symbol;
        string description;
        address creator;
        uint256 maxSupply;
        uint256 mintPrice;
        uint256 createdAt;
        bool isActive;
    }
    
    // Storage
    mapping(uint256 => CollectionInfo) public collections;
    mapping(address => uint256[]) public creatorCollections; // creator => collectionIds[]
    mapping(address => uint256) public contractToId; // contract address => collection id
    
    uint256 private _collectionIdCounter;
    uint256 public factoryFeePercentage = 1; // 1% factory fee
    uint256 public creationFee = 0.01 ether; // Fee to create a collection
    
    // Events
    event CollectionCreated(
        uint256 indexed collectionId,
        address indexed contractAddress,
        string name,
        address indexed creator,
        uint256 maxSupply
    );
    
    event FactoryFeeUpdated(uint256 newFeePercentage);
    event CreationFeeUpdated(uint256 newCreationFee);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a new NFT collection contract
     * @param name Collection name
     * @param symbol Collection symbol (e.g., "MYART")
     * @param description Collection description
     * @param maxSupply Maximum number of NFTs in this collection
     * @param mintPrice Price per NFT in wei
     */
    function createCollection(
        string memory name,
        string memory symbol,
        string memory description,
        uint256 maxSupply,
        uint256 mintPrice
    ) external payable nonReentrant returns (uint256, address) {
        require(msg.value >= creationFee, "Insufficient creation fee");
        require(maxSupply > 0 && maxSupply <= 10000, "Invalid max supply");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        require(mintPrice > 0, "Mint price must be greater than 0");
        
        _collectionIdCounter++;
        uint256 collectionId = _collectionIdCounter;
        
        // Deploy new collection contract
        IndividualNFTCollection newCollection = new IndividualNFTCollection(
            name,
            symbol,
            description,
            maxSupply,
            mintPrice,
            msg.sender, // creator
            address(this) // factory
        );
        
        address contractAddress = address(newCollection);
        
        // Store collection info
        collections[collectionId] = CollectionInfo({
            contractAddress: contractAddress,
            name: name,
            symbol: symbol,
            description: description,
            creator: msg.sender,
            maxSupply: maxSupply,
            mintPrice: mintPrice,
            createdAt: block.timestamp,
            isActive: true
        });
        
        // Update mappings
        creatorCollections[msg.sender].push(collectionId);
        contractToId[contractAddress] = collectionId;
        
        emit CollectionCreated(collectionId, contractAddress, name, msg.sender, maxSupply);
        
        // Refund excess payment
        if (msg.value > creationFee) {
            payable(msg.sender).transfer(msg.value - creationFee);
        }
        
        return (collectionId, contractAddress);
    }
    
    /**
     * @dev Get collection information by ID
     */
    function getCollection(uint256 collectionId) external view returns (CollectionInfo memory) {
        return collections[collectionId];
    }
    
    /**
     * @dev Get collection information by contract address
     */
    function getCollectionByAddress(address contractAddress) external view returns (CollectionInfo memory) {
        uint256 collectionId = contractToId[contractAddress];
        return collections[collectionId];
    }
    
    /**
     * @dev Get all collections created by a specific creator
     */
    function getCreatorCollections(address creator) external view returns (uint256[] memory) {
        return creatorCollections[creator];
    }
    
    /**
     * @dev Get total number of collections
     */
    function getTotalCollections() external view returns (uint256) {
        return _collectionIdCounter;
    }
    
    /**
     * @dev Get collection contract address by ID
     */
    function getCollectionContract(uint256 collectionId) external view returns (address) {
        return collections[collectionId].contractAddress;
    }
    
    /**
     * @dev Get detailed collection info including current supply
     */
    function getDetailedCollectionInfo(uint256 collectionId) external view returns (
        CollectionInfo memory info,
        uint256 currentSupply,
        bool isComplete
    ) {
        info = collections[collectionId];
        
        if (info.contractAddress != address(0)) {
            IndividualNFTCollection collection = IndividualNFTCollection(info.contractAddress);
            currentSupply = collection.totalSupply();
            isComplete = currentSupply >= info.maxSupply;
        }
        
        return (info, currentSupply, isComplete);
    }
    
    /**
     * @dev Get all collections with pagination
     */
    function getAllCollections(
        uint256 offset,
        uint256 limit
    ) external view returns (CollectionInfo[] memory) {
        require(limit > 0 && limit <= 100, "Invalid limit");
        
        uint256 total = _collectionIdCounter;
        if (offset >= total) {
            return new CollectionInfo[](0);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        uint256 length = end - offset;
        CollectionInfo[] memory result = new CollectionInfo[](length);
        
        for (uint256 i = 0; i < length; i++) {
            result[i] = collections[offset + i + 1]; // collections start from ID 1
        }
        
        return result;
    }
    
    /**
     * @dev Pause a collection (only factory owner or collection creator)
     */
    function pauseCollection(uint256 collectionId) external {
        CollectionInfo storage info = collections[collectionId];
        require(
            msg.sender == owner() || msg.sender == info.creator,
            "Not authorized"
        );
        require(info.contractAddress != address(0), "Collection not found");
        
        IndividualNFTCollection collection = IndividualNFTCollection(info.contractAddress);
        collection.pause();
        info.isActive = false;
    }
    
    /**
     * @dev Resume a collection (only factory owner or collection creator)
     */
    function resumeCollection(uint256 collectionId) external {
        CollectionInfo storage info = collections[collectionId];
        require(
            msg.sender == owner() || msg.sender == info.creator,
            "Not authorized"
        );
        require(info.contractAddress != address(0), "Collection not found");
        
        IndividualNFTCollection collection = IndividualNFTCollection(info.contractAddress);
        collection.resume();
        info.isActive = true;
    }
    
    /**
     * @dev Update factory fee percentage (only owner)
     */
    function updateFactoryFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 10, "Fee too high"); // Max 10%
        factoryFeePercentage = newFeePercentage;
        emit FactoryFeeUpdated(newFeePercentage);
    }
    
    /**
     * @dev Update collection creation fee (only owner)
     */
    function updateCreationFee(uint256 newCreationFee) external onlyOwner {
        creationFee = newCreationFee;
        emit CreationFeeUpdated(newCreationFee);
    }
    
    /**
     * @dev Withdraw factory fees (only owner)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Emergency function to withdraw from a collection contract (only owner)
     */
    function emergencyWithdrawFromCollection(address collectionAddress) external onlyOwner {
        IndividualNFTCollection collection = IndividualNFTCollection(collectionAddress);
        // This would require the collection contract to have an emergency withdraw function
        // For now, we'll just pause it
        collection.pause();
    }
    
    // Receive function to accept ETH
    receive() external payable {}
}