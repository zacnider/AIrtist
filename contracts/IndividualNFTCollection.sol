// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IndividualNFTCollection
 * @dev Individual NFT collection contract - each collection gets its own contract
 */
contract IndividualNFTCollection is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _tokenIdCounter;
    
    // Collection metadata
    string public collectionDescription;
    uint256 public maxSupply;
    uint256 public mintPrice;
    address public creator;
    uint256 public createdAt;
    bool public isActive;
    
    // Factory contract address
    address public factory;
    
    // Events
    event NFTMinted(
        uint256 indexed tokenId,
        address indexed to,
        string tokenURI
    );
    
    event CollectionCompleted();
    event CollectionPaused();
    event CollectionResumed();
    
    modifier onlyCreatorOrFactory() {
        require(
            msg.sender == creator || msg.sender == factory,
            "Not authorized"
        );
        _;
    }
    
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _description,
        uint256 _maxSupply,
        uint256 _mintPrice,
        address _creator,
        address _factory
    ) ERC721(_name, _symbol) Ownable(_creator) {
        collectionDescription = _description;
        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
        creator = _creator;
        factory = _factory;
        createdAt = block.timestamp;
        isActive = true;
    }
    
    /**
     * @dev Mint NFT to this collection
     * @param to Address to mint to
     * @param _tokenURI Metadata URI for the NFT
     */
    function mint(
        address to,
        string memory _tokenURI
    ) external payable nonReentrant {
        require(isActive, "Collection not active");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(_tokenIdCounter < maxSupply, "Collection is full");
        require(bytes(_tokenURI).length > 0, "Token URI cannot be empty");
        
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        // Mint the NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        emit NFTMinted(tokenId, to, _tokenURI);
        
        // Check if collection is complete
        if (_tokenIdCounter >= maxSupply) {
            isActive = false;
            emit CollectionCompleted();
        }
        
        // Refund excess payment
        if (msg.value > mintPrice) {
            payable(msg.sender).transfer(msg.value - mintPrice);
        }
        
        // Send payment to creator (minus small factory fee)
        uint256 factoryFee = mintPrice / 100; // 1% factory fee
        uint256 creatorPayment = mintPrice - factoryFee;
        
        if (creatorPayment > 0) {
            payable(creator).transfer(creatorPayment);
        }
        if (factoryFee > 0) {
            payable(factory).transfer(factoryFee);
        }
    }
    
    /**
     * @dev Batch mint multiple NFTs
     * @param to Address to mint to
     * @param tokenURIs Array of metadata URIs
     */
    function batchMint(
        address to,
        string[] memory tokenURIs
    ) external payable nonReentrant {
        uint256 quantity = tokenURIs.length;
        require(quantity > 0 && quantity <= 50, "Invalid quantity");
        require(isActive, "Collection not active");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");
        require(_tokenIdCounter + quantity <= maxSupply, "Exceeds max supply");
        
        for (uint256 i = 0; i < quantity; i++) {
            require(bytes(tokenURIs[i]).length > 0, "Token URI cannot be empty");
            
            _tokenIdCounter++;
            uint256 tokenId = _tokenIdCounter;
            
            // Mint the NFT
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, tokenURIs[i]);
            
            emit NFTMinted(tokenId, to, tokenURIs[i]);
        }
        
        // Check if collection is complete
        if (_tokenIdCounter >= maxSupply) {
            isActive = false;
            emit CollectionCompleted();
        }
        
        // Handle payments
        uint256 totalCost = mintPrice * quantity;
        uint256 factoryFee = totalCost / 100; // 1% factory fee
        uint256 creatorPayment = totalCost - factoryFee;
        
        if (creatorPayment > 0) {
            payable(creator).transfer(creatorPayment);
        }
        if (factoryFee > 0) {
            payable(factory).transfer(factoryFee);
        }
        
        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
    }
    
    /**
     * @dev Get collection information
     */
    function getCollectionInfo() external view returns (
        string memory collectionName,
        string memory collectionSymbol,
        string memory description,
        uint256 currentSupply,
        uint256 _maxSupply,
        uint256 _mintPrice,
        address _creator,
        uint256 _createdAt,
        bool _isActive
    ) {
        return (
            super.name(),
            super.symbol(),
            collectionDescription,
            _tokenIdCounter,
            maxSupply,
            mintPrice,
            creator,
            createdAt,
            isActive
        );
    }
    
    /**
     * @dev Get total supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Pause collection (only creator or factory)
     */
    function pause() external onlyCreatorOrFactory {
        isActive = false;
        emit CollectionPaused();
    }
    
    /**
     * @dev Resume collection (only creator or factory)
     */
    function resume() external onlyCreatorOrFactory {
        require(_tokenIdCounter < maxSupply, "Collection is already complete");
        isActive = true;
        emit CollectionResumed();
    }
    
    /**
     * @dev Update mint price (only creator)
     */
    function updateMintPrice(uint256 _newPrice) external {
        require(msg.sender == creator, "Only creator can update price");
        mintPrice = _newPrice;
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}