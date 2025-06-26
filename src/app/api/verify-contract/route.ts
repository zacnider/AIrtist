import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { contractAddress, chainId, contractName } = await request.json()
    
    if (!contractAddress) {
      return NextResponse.json(
        { success: false, error: 'Contract address is required' },
        { status: 400 }
      )
    }
    
    console.log(`Verifying contract ${contractName} at address: ${contractAddress}`)
    console.log(`Chain ID: ${chainId}`)
    
    // For now, we'll provide manual verification info since automatic verification
    // services are not working reliably with Monad Testnet
    
    const verificationInfo = {
      contractAddress,
      chainId,
      contractName: 'NFTCollection',
      compilerVersion: '0.8.28',
      optimization: true,
      runs: 200,
      explorerUrl: `https://testnet.monadexplorer.com/address/${contractAddress}`,
      sourceCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTCollection is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    uint256 public maxSupply;
    uint256 public mintPrice;
    string public description;
    
    constructor(
        string memory name,
        string memory symbol,
        string memory _description,
        uint256 _maxSupply,
        uint256 _mintPrice,
        address initialOwner
    ) ERC721(name, symbol) Ownable(initialOwner) {
        description = _description;
        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
        _nextTokenId = 1;
    }
    
    function mint(address to, string memory uri) public payable {
        require(_nextTokenId <= maxSupply, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }
    
    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}`,
      manualVerificationSteps: [
        '1. Go to https://testnet.monadexplorer.com',
        `2. Search for contract address: ${contractAddress}`,
        '3. Click on "Contract" tab',
        '4. Click "Verify and Publish" if available',
        '5. Use the source code provided above',
        '6. Set compiler version to 0.8.28',
        '7. Enable optimization with 200 runs'
      ]
    }
    
    console.log('Providing manual verification info for contract:', contractAddress)
    
    return NextResponse.json({
      success: true,
      method: 'manual_info',
      verified: false,
      contractAddress,
      chainId,
      contractName,
      explorerUrl: `https://testnet.monadexplorer.com/address/${contractAddress}`,
      message: 'Contract deployed successfully. Use manual verification steps provided.',
      verificationInfo
    })
    
  } catch (error) {
    console.error('Contract verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Contract verification failed' },
      { status: 500 }
    )
  }
}