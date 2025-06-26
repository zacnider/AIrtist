# NFT Artist Collection - Deployment Guide

Bu rehber NFT Artist Collection akıllı kontratını Monad testnet'e deploy etmek için gerekli adımları içerir.

## 🚀 Hızlı Başlangıç

### 1. Gereksinimler

```bash
# Node.js ve npm kurulu olmalı
node --version  # v18+ gerekli
npm --version

# Hardhat kurulumu
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

### 2. Hardhat Projesi Kurulumu

```bash
# Proje dizininde
npx hardhat init

# Gerekli bağımlılıklar
npm install @openzeppelin/contracts
```

### 3. Hardhat Config Dosyası

`hardhat.config.js` dosyasını oluşturun:

```javascript
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
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
      accounts: [process.env.PRIVATE_KEY] // Cüzdan private key'i
    }
  },
  etherscan: {
    apiKey: {
      monadTestnet: "your-api-key" // Monad explorer API key
    },
    customChains: [
      {
        network: "monadTestnet",
        chainId: 10143,
        urls: {
          apiURL: "https://testnet-api.monadexplorer.com/api",
          browserURL: "https://testnet.monadexplorer.com"
        }
      }
    ]
  }
};
```

### 4. Environment Variables

`.env` dosyası oluşturun:

```bash
# Cüzdan private key (0x ile başlayan)
PRIVATE_KEY=your_wallet_private_key_here

# Monad Explorer API Key (opsiyonel)
MONAD_API_KEY=your_api_key_here
```

### 5. Deploy Script

`scripts/deploy.js` dosyasını oluşturun:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying NFTArtistCollection to Monad Testnet...");

  // Contract factory
  const NFTArtistCollection = await hre.ethers.getContractFactory("NFTArtistCollection");
  
  // Deploy contract
  const nftContract = await NFTArtistCollection.deploy();
  
  await nftContract.waitForDeployment();
  
  const contractAddress = await nftContract.getAddress();
  
  console.log("✅ NFTArtistCollection deployed to:", contractAddress);
  console.log("🔗 View on explorer:", `https://testnet.monadexplorer.com/address/${contractAddress}`);
  
  // Verify contract (opsiyonel)
  if (hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await nftContract.deploymentTransaction().wait(5);
    
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on explorer");
    } catch (error) {
      console.log("❌ Verification failed:", error.message);
    }
  }
  
  // Update frontend config
  console.log("\n📝 Update your frontend config:");
  console.log(`const NFT_CONTRACT_ADDRESS = "${contractAddress}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## 🔧 Deployment Adımları

### 1. Kontratı Deploy Edin

```bash
# Monad testnet'e deploy
npx hardhat run scripts/deploy.js --network monadTestnet
```

### 2. Frontend Config'i Güncelleyin

Deploy edilen kontrat adresini `src/lib/config.ts` dosyasında güncelleyin:

```typescript
export const NFT_CONTRACT_ADDRESS = "0xYourDeployedContractAddress" as const
```

### 3. ABI'yi Güncelleyin

Kontrat ABI'sini `src/lib/config.ts` dosyasına ekleyin:

```typescript
export const NFT_CONTRACT_ABI = [
  // Contract ABI buraya gelecek
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
  // ... diğer fonksiyonlar
] as const
```

## 💰 Maliyet Hesaplaması

### Gas Ücretleri (Monad Testnet)
- **Contract Deploy**: ~2,500,000 gas
- **Create Collection**: ~150,000 gas
- **Mint NFT**: ~100,000 gas per NFT
- **Batch Mint (10 NFT)**: ~800,000 gas

### Örnek Maliyetler (1 MON = $1 varsayımı)
- Collection oluşturma: Ücretsiz
- NFT mint: 1 MON per NFT
- 10 NFT koleksiyonu: 10 MON
- 100 NFT koleksiyonu: 100 MON

## 🧪 Test Etme

### 1. Local Test

```bash
# Hardhat network'te test
npx hardhat test

# Test script örneği
npx hardhat run scripts/test-collection.js --network localhost
```

### 2. Testnet Test

```bash
# Monad testnet'te test
npx hardhat run scripts/test-collection.js --network monadTestnet
```

### Test Script Örneği

`scripts/test-collection.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const contractAddress = "0xYourDeployedContractAddress";
  const NFTArtistCollection = await hre.ethers.getContractAt("NFTArtistCollection", contractAddress);
  
  // Test collection creation
  console.log("Creating test collection...");
  const tx = await NFTArtistCollection.createCollection(
    "Test Collection",
    "A test NFT collection",
    10
  );
  
  const receipt = await tx.wait();
  console.log("Collection created! Transaction:", receipt.hash);
  
  // Test minting
  console.log("Minting test NFT...");
  const mintTx = await NFTArtistCollection.mintToCollection(
    "0xYourWalletAddress",
    1, // Collection ID
    "https://ipfs.io/ipfs/QmTestHash",
    { value: hre.ethers.parseEther("1") } // 1 MON
  );
  
  const mintReceipt = await mintTx.wait();
  console.log("NFT minted! Transaction:", mintReceipt.hash);
}

main().catch(console.error);
```

## 🔍 Doğrulama

### 1. Contract Verification

```bash
# Kontratı doğrula
npx hardhat verify --network monadTestnet 0xYourContractAddress
```

### 2. Frontend Test

1. Uygulamayı başlatın: `npm run dev`
2. Collection Creator sekmesine gidin
3. Test koleksiyonu oluşturun
4. Monad testnet'e bağlanın
5. Koleksiyonu blockchain'e deploy edin

## 🚨 Güvenlik Notları

### 1. Private Key Güvenliği
- Private key'i asla commit etmeyin
- `.env` dosyasını `.gitignore`'a ekleyin
- Production'da hardware wallet kullanın

### 2. Contract Güvenliği
- Kontratı audit ettirin
- Test coverage %100 olsun
- Mainnet'e geçmeden önce kapsamlı test yapın

### 3. Frontend Güvenliği
- API key'leri güvenli saklayın
- Rate limiting uygulayın
- Input validation yapın

## 📞 Destek

### Sorun Giderme
1. **Gas yetersiz**: Gas limit'i artırın
2. **RPC hatası**: Farklı RPC endpoint deneyin
3. **Verification hatası**: Constructor arguments'ı kontrol edin

### Yararlı Linkler
- [Monad Testnet Explorer](https://testnet.monadexplorer.com)
- [Monad Testnet Faucet](https://testnet-faucet.monad.xyz)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)

---

**Not**: Bu rehber Monad testnet için hazırlanmıştır. Mainnet deployment için ek güvenlik önlemleri gereklidir.