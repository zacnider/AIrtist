# AIrtist - Smart Contract Deployment Guide

This guide contains the necessary steps to deploy AIrtist smart contracts to Monad testnet.

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Node.js and npm must be installed
node --version  # v18+ required
npm --version

# Hardhat installation
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

### 2. Hardhat Project Setup

```bash
# In project directory
npx hardhat init

# Required dependencies
npm install @openzeppelin/contracts
```

### 3. Hardhat Config File

Create `hardhat.config.js` file:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    monadTestnet: {
      url: "https://testnet-rpc.monad.xyz",
      chainId: 10143,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 20000000000, // 20 gwei
      gas: 8000000,
    }
  },
  etherscan: {
    apiKey: {
      monadTestnet: "dummy-api-key", // Monad Explorer doesn't require API key
    },
    customChains: [
      {
        network: "monadTestnet",
        chainId: 10143,
        urls: {
          apiURL: "https://explorer.monad.xyz/api",
          browserURL: "https://explorer.monad.xyz",
        },
      },
    ],
  },
};
```

### 4. Environment Variables

Create `.env` file:

```bash
# Wallet private key (starting with 0x)
PRIVATE_KEY=your_wallet_private_key_here

# Monad Explorer API Key (optional)
MONAD_API_KEY=your_api_key_here
```

### 5. Deploy Scripts

#### Factory Contract Deploy Script

`scripts/deploy-factory.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying NFTCollectionFactory to Monad Testnet...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy Factory Contract
  const NFTCollectionFactory = await hre.ethers.getContractFactory("NFTCollectionFactory");
  const factory = await NFTCollectionFactory.deploy();
  
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  
  console.log("✅ NFTCollectionFactory deployed to:", factoryAddress);
  console.log("🔗 View on explorer:", `https://testnet.monadexplorer.com/address/${factoryAddress}`);
  
  return factoryAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

#### NFT Minter Deploy Script

`scripts/deploy-nft-minter.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying NFTMinter contract to Monad Testnet...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Factory contract address (update this with your deployed factory address)
  const FACTORY_CONTRACT_ADDRESS = "0x7867B987ed2f04Afab67392d176b06a5b002d1F8";

  // Deploy NFT Minter Contract
  const NFTMinter = await hre.ethers.getContractFactory("NFTMinter");
  const nftMinter = await NFTMinter.deploy(FACTORY_CONTRACT_ADDRESS);
  
  await nftMinter.waitForDeployment();
  const minterAddress = await nftMinter.getAddress();
  
  console.log("✅ NFTMinter deployed to:", minterAddress);
  console.log("🔗 View on explorer:", `https://testnet.monadexplorer.com/address/${minterAddress}`);
  
  // Verify contract
  if (hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await nftMinter.deploymentTransaction().wait(5);
    
    try {
      await hre.run("verify:verify", {
        address: minterAddress,
        constructorArguments: [FACTORY_CONTRACT_ADDRESS],
      });
      console.log("✅ Contract verified on explorer");
    } catch (error) {
      console.log("❌ Verification failed:", error.message);
    }
  }
  
  // Test contract functions
  console.log("\n=== Testing Contract Functions ===");
  try {
    const mintPrice = await nftMinter.MINT_PRICE();
    console.log("Mint Price:", hre.ethers.formatEther(mintPrice), "MON");
    
    const currentTokenId = await nftMinter.getCurrentTokenId();
    console.log("Current Token ID:", currentTokenId.toString());
  } catch (error) {
    console.log("❌ Error testing contract functions:", error.message);
  }
  
  console.log("\n=== Deployment Summary ===");
  console.log("NFTMinter Contract Address:", minterAddress);
  console.log("Factory Contract Address:", FACTORY_CONTRACT_ADDRESS);
  console.log("Network: Monad Testnet");
  console.log("Explorer URL:", `https://testnet.monadexplorer.com/address/${minterAddress}`);
  
  console.log("\n=== Next Steps ===");
  console.log("1. Update your frontend config with the new NFTMinter address");
  console.log("2. Add the NFTMinter ABI to your frontend");
  console.log("3. Update your mint functions to use the new contract");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## 🔧 Deployment Steps

### 1. Deploy Factory Contract

```bash
# Deploy factory contract to Monad testnet
npx hardhat run scripts/deploy-factory.js --network monadTestnet
```

### 2. Deploy NFT Minter Contract

```bash
# Deploy NFT minter contract to Monad testnet
npx hardhat run scripts/deploy-nft-minter.js --network monadTestnet
```

### 3. Update Frontend Config

Update the deployed contract addresses in `src/lib/config.ts`:

```typescript
export const FACTORY_CONTRACT_ADDRESS = "0xYourFactoryContractAddress" as const
export const NFT_MINTER_CONTRACT_ADDRESS = "0xYourNFTMinterContractAddress" as const
```

### 4. Update Contract ABIs

Add contract ABIs to `src/lib/config.ts`:

```typescript
export const FACTORY_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "symbol", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "uint256", "name": "maxSupply", "type": "uint256"}
    ],
    "name": "createCollection",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // ... other functions
] as const

export const NFT_MINTER_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "collectionId", "type": "uint256"},
      {"internalType": "string", "name": "tokenURI", "type": "string"}
    ],
    "name": "mintToCollection",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  // ... other functions
] as const
```

## 💰 Cost Calculation

### Gas Fees (Monad Testnet)
- **Factory Contract Deploy**: ~2,500,000 gas
- **NFT Minter Deploy**: ~3,000,000 gas
- **Create Collection**: ~150,000 gas
- **Mint NFT**: ~100,000 gas per NFT
- **Batch Mint (10 NFTs)**: ~800,000 gas

### Example Costs (assuming 1 MON = $1)
- Collection creation: Free
- NFT mint: 0.001 MON per NFT
- 10 NFT collection: 0.01 MON
- 100 NFT collection: 0.1 MON

## 🧪 Testing

### 1. Local Testing

```bash
# Test on Hardhat network
npx hardhat test

# Run test script
npx hardhat run scripts/test-contracts.js --network localhost
```

### 2. Testnet Testing

```bash
# Test on Monad testnet
npx hardhat run scripts/test-contracts.js --network monadTestnet
```

### Test Script Example

`scripts/test-contracts.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const factoryAddress = "0xYourFactoryContractAddress";
  const minterAddress = "0xYourNFTMinterContractAddress";
  
  const factory = await hre.ethers.getContractAt("NFTCollectionFactory", factoryAddress);
  const minter = await hre.ethers.getContractAt("NFTMinter", minterAddress);
  
  // Test collection creation
  console.log("Creating test collection...");
  const tx = await factory.createCollection(
    "Test Collection",
    "TEST",
    "A test NFT collection",
    10
  );
  
  const receipt = await tx.wait();
  console.log("Collection created! Transaction:", receipt.hash);
  
  // Test minting
  console.log("Minting test NFT...");
  const [signer] = await hre.ethers.getSigners();
  const mintTx = await minter.mintToCollection(
    signer.address,
    1, // Collection ID
    "https://ipfs.io/ipfs/QmTestHash",
    { value: hre.ethers.parseEther("0.001") } // 0.001 MON
  );
  
  const mintReceipt = await mintTx.wait();
  console.log("NFT minted! Transaction:", mintReceipt.hash);
}

main().catch(console.error);
```

## 🔍 Verification

### 1. Contract Verification

```bash
# Verify factory contract
npx hardhat verify --network monadTestnet 0xYourFactoryContractAddress

# Verify NFT minter contract
npx hardhat verify --network monadTestnet 0xYourNFTMinterContractAddress "0xYourFactoryContractAddress"
```

### 2. Frontend Testing

1. Start the application: `npm run dev`
2. Go to AI Studio tab
3. Create test collection
4. Connect to Monad testnet
5. Deploy collection to blockchain
6. Test minting functionality

## 🚨 Security Notes

### 1. Private Key Security
- Never commit private keys
- Add `.env` file to `.gitignore`
- Use hardware wallets in production

### 2. Contract Security
- Audit contracts before mainnet
- Achieve 100% test coverage
- Perform comprehensive testing before mainnet deployment

### 3. Frontend Security
- Store API keys securely
- Implement rate limiting
- Validate all inputs

## 📞 Support

### Troubleshooting
1. **Insufficient gas**: Increase gas limit
2. **RPC error**: Try different RPC endpoint
3. **Verification error**: Check constructor arguments

### Useful Links
- [Monad Testnet Explorer](https://testnet.monadexplorer.com)
- [Monad Testnet Faucet](https://testnet-faucet.monad.xyz)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)

## 🎯 Deployed Contracts (Example)

### Monad Testnet
- **Factory Contract**: `0x7867B987ed2f04Afab67392d176b06a5b002d1F8`
- **NFT Minter Contract**: `0x176f56fdBc95887a812fE41756F46B5D69eC41F3`

### Contract Features
- **Factory Pattern**: Separate collection management and minting
- **Batch Minting**: Efficient bulk NFT creation
- **Payment Validation**: 0.001 MON per NFT
- **Owner Functions**: Withdraw funds and update settings

---

**Note**: This guide is prepared for Monad testnet. Additional security measures are required for mainnet deployment.
