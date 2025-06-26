import { defineChain } from 'viem'

// Monad Testnet configuration
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
  testnet: true,
})

// NFT Contract configuration
export const FACTORY_CONTRACT_ADDRESS = '0x7867B987ed2f04Afab67392d176b06a5b002d1F8' as const
export const NFT_MINTER_CONTRACT_ADDRESS = '0x176f56fdBc95887a812fE41756F46B5D69eC41F3' as const

export const FACTORY_ABI = [
  // Factory contract - only collection management
  {
    "inputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "uint256", "name": "maxSupply", "type": "uint256"}
    ],
    "name": "createCollection",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "collectionId", "type": "uint256"}],
    "name": "getCollection",
    "outputs": [
      {
        "components": [
          {"internalType": "string", "name": "name", "type": "string"},
          {"internalType": "string", "name": "description", "type": "string"},
          {"internalType": "address", "name": "creator", "type": "address"},
          {"internalType": "uint256", "name": "totalSupply", "type": "uint256"},
          {"internalType": "uint256", "name": "maxSupply", "type": "uint256"},
          {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
          {"internalType": "bool", "name": "isActive", "type": "bool"}
        ],
        "internalType": "struct NFTArtistCollection.Collection",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export const NFT_MINTER_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_factoryContract",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "collectionId",
        "type": "uint256"
      },
      {
        "internalType": "string[]",
        "name": "tokenURIs",
        "type": "string[]"
      }
    ],
    "name": "batchMintToCollection",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentTokenId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "collectionId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "tokenURI",
        "type": "string"
      }
    ],
    "name": "mintToCollection",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MINT_PRICE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "tokenURI",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "collectionId",
        "type": "uint256"
      }
    ],
    "name": "NFTMinted",
    "type": "event"
  }
] as const

// Backward compatibility
export const NFT_CONTRACT_ADDRESS = FACTORY_CONTRACT_ADDRESS
export const NFT_CONTRACT_ABI = FACTORY_ABI

// IPFS configuration
export const IPFS_GATEWAY = 'https://ipfs.io/ipfs/'
export const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY
export const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY