# NFT.Storage API Key Setup (Free)

## Quick Setup (5 minutes)

### 1. Create NFT.Storage Account
1. Go to https://nft.storage
2. Click "Get Started" button
3. Create free account with GitHub, Google or email

### 2. Get API Key
1. Login to dashboard
2. Go to "API Keys" tab
3. Click "New Key" button
4. Key Name: "NFT-Artist-dApp"
5. Click "Create" button
6. Copy the API Key

### 3. Update .env File
Find this line in your `.env` file:
```
NFT_STORAGE_API_KEY=your_nft_storage_api_key_here
```

Replace with your copied API key:
```
NFT_STORAGE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Restart Application
```bash
npm run dev
```

### 5. Test It
1. Mint NFT in demo mode
2. You should see "NFT.Storage upload successful" message in console
3. Returned IPFS URLs will be real

## Important Information

### ✅ Advantages
- **Completely free** (supported by Protocol Labs)
- **Permanent storage** (stored on Filecoin network)
- **Fast access** (IPFS gateways)
- **Easy integration**

### 📊 Limits
- Maximum 32GB per file
- No monthly upload limit
- Rate limiting: 30 requests per second

### 🔗 IPFS URL Formats
- **NFT.Storage Gateway**: `https://nftstorage.link/ipfs/{CID}`
- **Public IPFS Gateway**: `https://ipfs.io/ipfs/{CID}`
- **Cloudflare Gateway**: `https://cloudflare-ipfs.com/ipfs/{CID}`

## Troubleshooting

### API Key Not Working
1. Make sure API key is copied correctly
2. Don't use quotes in .env file
3. Restart the application

### Upload Failed
1. Check your internet connection
2. Check NFT.Storage service status: https://status.nft.storage
3. Check error messages in console

### Image Not Showing in Explorer
1. Make sure IPFS URL is working
2. Check metadata format is correct
3. Check if blockchain explorer supports IPFS

## Test URLs
After API key setup, these URLs should work:
- Image: `https://nftstorage.link/ipfs/{imageCID}`
- Metadata: `https://nftstorage.link/ipfs/{metadataCID}`

## Alternative Solutions
If NFT.Storage doesn't work:
1. **Pinata**: 1GB free monthly
2. **Web3.Storage**: Another Protocol Labs service
3. **Infura IPFS**: Ethereum ecosystem integration