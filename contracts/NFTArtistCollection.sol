// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTArtistCollection is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _tokenIdCounter;
    
    // Mint price: 0.001 MON
    uint256 public constant MINT_PRICE = 0.001 ether;
    
    // Collection info
    struct Collection {
        string name;
        string description;
        address creator;
        uint256 totalSupply;
        uint256 maxSupply;
        uint256 createdAt;
        bool isActive;
    }
    
    // Mapping from collection ID to collection info
    mapping(uint256 => Collection) public collections;
    mapping(uint256 => uint256) public tokenToCollection; // tokenId => collectionId
    mapping(uint256 => uint256[]) public collectionTokens; // collectionId => tokenIds[]
    
    uint256 private _collectionIdCounter;
    
    // Events
    event CollectionCreated(
        uint256 indexed collectionId,
        string name,
        address indexed creator,
        uint256 maxSupply
    );
    
    event NFTMinted(
        uint256 indexed tokenId,
        uint256 indexed collectionId,
        address indexed to,
        string tokenURI
    );
    
    event CollectionCompleted(uint256 indexed collectionId);
    
    constructor() ERC721("NFT Artist Collection", "NFTART") Ownable(msg.sender) {}
    
    /**
     * @dev Create a new NFT collection
     * @param name Collection name
     * @param description Collection description
     * @param maxSupply Maximum number of NFTs in this collection
     */
    function createCollection(
        string memory name,
        string memory description,
        uint256 maxSupply
    ) external returns (uint256) {
        require(maxSupply > 0 && maxSupply <= 10000, "Invalid max supply");
        require(bytes(name).length > 0, "Name cannot be empty");
        
        _collectionIdCounter++;
        uint256 collectionId = _collectionIdCounter;
        
        collections[collectionId] = Collection({
            name: name,
            description: description,
            creator: msg.sender,
            totalSupply: 0,
            maxSupply: maxSupply,
            createdAt: block.timestamp,
            isActive: true
        });
        
        emit CollectionCreated(collectionId, name, msg.sender, maxSupply);
        
        return collectionId;
    }
    
    /**
     * @dev Mint NFT to a collection
     * @param to Address to mint to
     * @param collectionId Collection ID
     * @param _tokenURI Metadata URI for the NFT
     */
    function mintToCollection(
        address to,
        uint256 collectionId,
        string memory _tokenURI
    ) external payable nonReentrant {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        require(collections[collectionId].isActive, "Collection not active");
        require(
            collections[collectionId].totalSupply < collections[collectionId].maxSupply,
            "Collection is full"
        );
        require(bytes(_tokenURI).length > 0, "Token URI cannot be empty");
        
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        // Mint the NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        // Update collection data
        tokenToCollection[tokenId] = collectionId;
        collectionTokens[collectionId].push(tokenId);
        collections[collectionId].totalSupply++;
        
        emit NFTMinted(tokenId, collectionId, to, _tokenURI);
        
        // Check if collection is complete
        if (collections[collectionId].totalSupply >= collections[collectionId].maxSupply) {
            collections[collectionId].isActive = false;
            emit CollectionCompleted(collectionId);
        }
        
        // Refund excess payment
        if (msg.value > MINT_PRICE) {
            payable(msg.sender).transfer(msg.value - MINT_PRICE);
        }
    }
    
    /**
     * @dev Batch mint multiple NFTs to a collection
     * @param to Address to mint to
     * @param collectionId Collection ID
     * @param tokenURIs Array of metadata URIs
     */
    function batchMintToCollection(
        address to,
        uint256 collectionId,
        string[] memory tokenURIs
    ) external payable nonReentrant {
        uint256 quantity = tokenURIs.length;
        require(quantity > 0 && quantity <= 50, "Invalid quantity");
        require(msg.value >= MINT_PRICE * quantity, "Insufficient payment");
        require(collections[collectionId].isActive, "Collection not active");
        require(
            collections[collectionId].totalSupply + quantity <= collections[collectionId].maxSupply,
            "Exceeds collection max supply"
        );
        
        for (uint256 i = 0; i < quantity; i++) {
            require(bytes(tokenURIs[i]).length > 0, "Token URI cannot be empty");
            
            _tokenIdCounter++;
            uint256 tokenId = _tokenIdCounter;
            
            // Mint the NFT
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, tokenURIs[i]);
            
            // Update collection data
            tokenToCollection[tokenId] = collectionId;
            collectionTokens[collectionId].push(tokenId);
            
            emit NFTMinted(tokenId, collectionId, to, tokenURIs[i]);
        }
        
        collections[collectionId].totalSupply += quantity;
        
        // Check if collection is complete
        if (collections[collectionId].totalSupply >= collections[collectionId].maxSupply) {
            collections[collectionId].isActive = false;
            emit CollectionCompleted(collectionId);
        }
        
        // Refund excess payment
        uint256 totalCost = MINT_PRICE * quantity;
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
    }
    
    /**
     * @dev Get collection information
     */
    function getCollection(uint256 collectionId) external view returns (Collection memory) {
        return collections[collectionId];
    }
    
    /**
     * @dev Get all token IDs in a collection
     */
    function getCollectionTokens(uint256 collectionId) external view returns (uint256[] memory) {
        return collectionTokens[collectionId];
    }
    
    /**
     * @dev Get collection ID for a token
     */
    function getTokenCollection(uint256 tokenId) external view returns (uint256) {
        return tokenToCollection[tokenId];
    }
    
    /**
     * @dev Get total number of collections
     */
    function getTotalCollections() external view returns (uint256) {
        return _collectionIdCounter;
    }
    
    /**
     * @dev Get total number of tokens
     */
    function getTotalTokens() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Withdraw contract balance (only owner)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Emergency pause collection (only owner)
     */
    function pauseCollection(uint256 collectionId) external onlyOwner {
        collections[collectionId].isActive = false;
    }
    
    /**
     * @dev Resume collection (only owner)
     */
    function resumeCollection(uint256 collectionId) external onlyOwner {
        require(
            collections[collectionId].totalSupply < collections[collectionId].maxSupply,
            "Collection is already complete"
        );
        collections[collectionId].isActive = true;
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}