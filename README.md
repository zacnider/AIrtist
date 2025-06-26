# AIrtist - AI-Powered NFT Creation Platform

🎨 **Transform your imagination into unique digital masterpieces with artificial intelligence**

AIrtist is a cutting-edge platform that combines AI-powered art generation with blockchain technology, allowing users to create and mint unique NFTs on the Monad blockchain.

## ✨ Features

### 🤖 AI Art Generation
- **10 Art Styles**: Fantasy, Anime, Landscape, Cyberpunk, Digital Art, Abstract, Portrait, Sci-Fi, Steampunk, Watercolor
- **Bulk Generation**: Create up to 1000 NFTs in a single collection
- **Custom Prompts**: Describe your vision and let AI bring it to life
- **Negative Prompts**: Exclude unwanted elements for better results

### 🔗 Blockchain Integration
- **Monad Testnet**: Fast and efficient blockchain for NFT minting
- **Factory Pattern**: Scalable smart contract architecture
- **Real Minting**: Connect your wallet and mint actual NFTs
- **IPFS Storage**: Decentralized metadata and image storage

### 💎 NFT Features
- **ERC721 Standard**: Industry-standard NFT implementation
- **Individual Minting**: Mint single NFTs with custom metadata
- **Batch Minting**: Mint entire collections efficiently
- **Collection Management**: Organize NFTs into themed collections

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MetaMask or compatible Web3 wallet
- Monad Testnet MON tokens

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/zacnider/AIrtist.git
cd AIrtist
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys:
```env
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key
REPLICATE_API_TOKEN=r8_your_token_here
HUGGING_FACE_API_KEY=your_hugging_face_api_key
PRIVATE_KEY=your_wallet_private_key
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to `http://localhost:3000`

## 🛠️ Smart Contracts

### Deployed Contracts (Monad Testnet)
- **Factory Contract**: `0x7867B987ed2f04Afab67392d176b06a5b002d1F8`
- **NFT Minter Contract**: `0x176f56fdBc95887a812fE41756F46B5D69eC41F3`

### Contract Features
- **Factory Pattern**: Separate collection management and minting
- **Batch Minting**: Efficient bulk NFT creation
- **Payment Validation**: 0.001 MON per NFT
- **Owner Functions**: Withdraw funds and update settings

## 🎯 How to Use

### 1. Connect Your Wallet
- Click "Connect Wallet" button
- Select MetaMask or your preferred wallet
- Ensure you're on Monad Testnet

### 2. Generate AI Art
- Choose an art style (Fantasy, Anime, etc.)
- Describe your vision in the prompt
- Select quantity (1 for single, 5-1000 for collection)
- Click "Generate Art"

### 3. Mint NFTs
- **Individual**: Click the coin icon on generated images
- **Bulk**: Use "Mint All" for collections
- Confirm transaction in your wallet
- Wait for blockchain confirmation

### 4. View Your NFTs
- Check Monad Explorer for transaction details
- View your NFTs in supported wallets

## 🏗️ Architecture

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Wagmi**: Ethereum React hooks

### Backend
- **Next.js API Routes**: Serverless functions
- **Hugging Face**: AI image generation
- **Pinata**: IPFS storage service
- **Ethers.js**: Blockchain interactions

### Smart Contracts
- **Solidity 0.8.20**: Latest stable version
- **OpenZeppelin**: Security-audited contracts
- **Hardhat**: Development environment
- **Factory Pattern**: Scalable architecture

## 📁 Project Structure

```
AIrtist/
├── contracts/                 # Smart contracts
│   ├── NFTCollectionFactory.sol
│   └── NFTMinter.sol
├── scripts/                   # Deployment scripts
├── src/
│   ├── app/                   # Next.js app directory
│   │   ├── api/              # API routes
│   │   └── page.tsx          # Main page
│   ├── components/           # React components
│   │   ├── ArtGenerator.tsx
│   │   ├── NFTMinter.tsx
│   │   └── CollectionManager.tsx
│   └── lib/                  # Utilities and config
├── public/                   # Static assets
└── README.md
```

## 🔧 Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Deploying Contracts
```bash
npx hardhat run scripts/deploy-nft-minter.js --network monadTestnet
```

### Contract Verification
```bash
npx hardhat verify --network monadTestnet DEPLOYED_CONTRACT_ADDRESS
```

## 🌐 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Pinata IPFS
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key

# AI Services
HUGGING_FACE_API_KEY=your_hugging_face_api_key

# Blockchain
PRIVATE_KEY=your_wallet_private_key_for_deployment
```

## 🚀 Deployment

### Vercel Deployment
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Manual Deployment
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [https://airtist.vercel.app](https://airtist.vercel.app)
- **Monad Explorer**: [https://testnet.monadexplorer.com](https://testnet.monadexplorer.com)
- **Documentation**: [https://docs.airtist.com](https://docs.airtist.com)

## 🙏 Acknowledgments

- [Monad](https://monad.xyz) - High-performance blockchain
- [Hugging Face](https://huggingface.co) - AI model hosting
- [Pinata](https://pinata.cloud) - IPFS storage service
- [OpenZeppelin](https://openzeppelin.com) - Smart contract library

## 📞 Support

For support, email support@airtist.com or join our Discord community.

---

**Built with ❤️ by the AIrtist Team**
