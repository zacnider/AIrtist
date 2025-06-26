// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMinter is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
    uint256 public constant MINT_PRICE = 0.001 ether;
    
    // Factory contract address
    address public factoryContract;
    
    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI, uint256 collectionId);
    event FactoryContractUpdated(address indexed oldFactory, address indexed newFactory);
    
    constructor(address _factoryContract) ERC721("AIrtist NFT", "AINFT") Ownable(msg.sender) {
        factoryContract = _factoryContract;
    }
    
    /**
     * @dev Mint NFT to a specific collection
     * @param to Address to mint the NFT to
     * @param collectionId Collection ID from factory contract
     * @param tokenURI IPFS URI for the NFT metadata
     */
    function mintToCollection(
        address to,
        uint256 collectionId,
        string memory tokenURI
    ) public payable {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(tokenURI).length > 0, "Token URI cannot be empty");
        
        // Verify collection exists and is active (optional check with factory)
        // This could be enhanced to actually check with the factory contract
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        emit NFTMinted(to, tokenId, tokenURI, collectionId);
    }
    
    /**
     * @dev Batch mint multiple NFTs to a collection
     * @param to Address to mint the NFTs to
     * @param collectionId Collection ID from factory contract
     * @param tokenURIs Array of IPFS URIs for the NFT metadata
     */
    function batchMintToCollection(
        address to,
        uint256 collectionId,
        string[] memory tokenURIs
    ) public payable {
        require(msg.value >= MINT_PRICE * tokenURIs.length, "Insufficient payment for batch mint");
        require(to != address(0), "Cannot mint to zero address");
        require(tokenURIs.length > 0, "Must provide at least one token URI");
        require(tokenURIs.length <= 100, "Cannot mint more than 100 NFTs at once");
        
        for (uint256 i = 0; i < tokenURIs.length; i++) {
            require(bytes(tokenURIs[i]).length > 0, "Token URI cannot be empty");
            
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, tokenURIs[i]);
            
            emit NFTMinted(to, tokenId, tokenURIs[i], collectionId);
        }
    }
    
    /**
     * @dev Get the current token ID counter
     */
    function getCurrentTokenId() public view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Update factory contract address (only owner)
     * @param _newFactory New factory contract address
     */
    function updateFactoryContract(address _newFactory) public onlyOwner {
        require(_newFactory != address(0), "Factory address cannot be zero");
        address oldFactory = factoryContract;
        factoryContract = _newFactory;
        emit FactoryContractUpdated(oldFactory, _newFactory);
    }
    
    /**
     * @dev Withdraw contract balance (only owner)
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Get contract balance
     */
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}