# 🚀 Live Deployment - Monad Testnet

## 📋 Deployment Information

### 🏭 Factory Contract - ✅ VERIFIED
- **Address**: `0x7867B987ed2f04Afab67392d176b06a5b002d1F8`
- **Network**: Monad Testnet
- **Chain ID**: 10143
- **Deploy Date**: June 24, 2025, 21:33 (UTC+3)
- **Deployer**: `0xc55e160D1f2133fc9A11f30cFB4Ee39c98Ff9e2e`
- **Verification**: ✅ [View on Explorer](https://testnet.monadexplorer.com/contracts/partial_match/10143/0x7867B987ed2f04Afab67392d176b06a5b002d1F8/)

### 🎨 Test Collection - ✅ VERIFIED
- **Address**: `0x1718b71E3e6f81CF9EFb985D83A37f3C210f93B1`
- **Name**: "Test Collection"
- **Symbol**: "TEST"
- **Max Supply**: 100 NFTs
- **Mint Price**: 0.001 MON
- **Verification**: ✅ [View on Explorer](https://testnet.monadexplorer.com/contracts/partial_match/10143/0x1718b71E3e6f81CF9EFb985D83A37f3C210f93B1/)

## 💰 Pricing

### Factory Fees
- **Collection Creation**: 0.01 MON
- **Platform Commission**: 1% (from mint transactions)
- **Creator Share**: 99% (from mint transactions)

## 🔗 Blockchain Information

### Monad Testnet
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Chain ID**: 10143
- **Explorer**: https://testnet-explorer.monad.xyz
- **Faucet**: [Monad Discord](https://discord.gg/monad)

## 🛠️ Usage

### 1. Creating Collection
```javascript
// Connect to Factory contract
const factory = new Contract(
  "0x7867B987ed2f04Afab67392d176b06a5b002d1F8", 
  FACTORY_ABI, 
  signer
);

// Create new collection
const tx = await factory.createCollection(
  "My Art Collection",    // name
  "MYART",               // symbol
  "Beautiful AI art",    // description
  100,                   // maxSupply
  parseEther("0.001"),   // mintPrice (0.001 MON)
  { value: parseEther("0.01") } // creation fee
);

const receipt = await tx.wait();
console.log("New collection address:", receipt.logs[0].args.contractAddress);
```

### 2. Minting NFTs
```javascript
// Connect to Collection contract
const collection = new Contract(
  collectionAddress, 
  COLLECTION_ABI, 
  signer
);

// Mint NFT
const tx = await collection.mint(
  userAddress,           // to
  "ipfs://metadata-uri", // tokenURI
  { value: parseEther("0.001") } // mint price
);
```

## 🔍 Verification

### Factory Contract Functions
- ✅ `createCollection()` - Create new collection
- ✅ `getTotalCollections()` - Total collection count
- ✅ `getCollection(id)` - Collection information
- ✅ `getCreatorCollections(address)` - Creator's collections

### Collection Contract Functions
- ✅ `mint(to, tokenURI)` - Mint NFT
- ✅ `batchMint(to, tokenURIs[])` - Batch mint
- ✅ `totalSupply()` - Current supply
- ✅ `maxSupply()` - Maximum supply
- ✅ `mintPrice()` - Mint price

## 🎯 Test Scenarios

### 1. Collection Creation Test
```bash
# Create collection from Factory contract
npx hardhat run scripts/test-create-collection.js --network monadTestnet
```

### 2. NFT Mint Test
```bash
# Mint NFT in created collection
npx hardhat run scripts/test-mint-nft.js --network monadTestnet
```

## 📊 Gas Costs

| Transaction | Gas Usage | Estimated Cost (MON) |
|-------------|-----------|---------------------|
| Factory Deploy | ~4.3M gas | ~0.043 MON |
| Collection Creation | ~2.4M gas | ~0.024 MON |
| NFT Mint | ~200K gas | ~0.002 MON |
| Batch Mint (5 NFTs) | ~750K gas | ~0.0075 MON |

## 🔐 Security

### Factory Contract
- ✅ Reentrancy protection
- ✅ Owner control
- ✅ Fee validation
- ✅ Supply limits

### Collection Contract
- ✅ Creator authorization
- ✅ Mint price control
- ✅ Supply enforcement
- ✅ Automatic payment distribution

## 🌐 Frontend Integration

### Wagmi Configuration
```typescript
import { monadTestnet } from 'wagmi/chains';

const config = createConfig({
  chains: [monadTestnet],
  // ... other configuration
});
```

### Contract Addresses
```typescript
export const CONTRACTS = {
  FACTORY_ADDRESS: "0x7867B987ed2f04Afab67392d176b06a5b002d1F8",
  NETWORK: "monadTestnet",
  CREATION_FEE: "0.01",
  FACTORY_FEE_PERCENTAGE: 1
};
```

## 🎉 Success Criteria

- ✅ **Factory Contract**: Successfully deployed
- ✅ **Test Collection**: Automatically created
- ✅ **Gas Optimization**: Efficient deployment
- ✅ **Frontend Integration**: Ready
- ✅ **Real Blockchain**: Live on Monad Testnet

## 🚀 Next Steps

1. **Frontend Test**: Test collection creation interface
2. **NFT Mint Test**: Perform real NFT minting
3. **Marketplace Integration**: Visibility on OpenSea-like platforms
4. **Mainnet Deployment**: Preparation for production

---

**🎯 Result**: Each NFT collection is now created in its own independent contract and running on real blockchain on Monad Testnet!