# IPFS Setup for NFT Images to Display in Explorer

## Problem
NFTs are being minted but images don't appear in blockchain explorer because we're currently using mock IPFS hashes.

## Solution: Pinata IPFS Integration

### 1. Create Pinata Account
1. Go to https://pinata.cloud
2. Create a free account
3. Login to dashboard

### 2. Create API Key
1. Go to "API Keys" section in Pinata Dashboard
2. Click "New Key" button
3. Permissions:
   - ✅ pinFileToIPFS
   - ✅ pinJSONToIPFS
   - ✅ unpin
4. Key Name: "NFT-Artist-dApp"
5. Click "Create Key" button
6. Copy API Key and Secret

### 3. Add Environment Variables
Add these lines to your `.env` file:

```env
# Pinata IPFS Configuration
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_API_KEY=your_pinata_secret_key_here
PINATA_JWT=your_pinata_jwt_here
```

### 4. Install Pinata SDK
```bash
npm install @pinata/sdk
```

### 5. Real IPFS Upload Function
Update `/api/upload-ipfs/route.ts` file with the following code:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { PinataSDK } from '@pinata/sdk'

const pinata = new PinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY!,
  pinataSecretApiKey: process.env.PINATA_SECRET_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { metadata, image } = await request.json()

    if (!metadata || !image) {
      return NextResponse.json(
        { success: false, error: 'Metadata and image are required' },
        { status: 400 }
      )
    }

    // 1. Upload image to IPFS
    const imageBuffer = Buffer.from(image.split(',')[1], 'base64')
    const imageUpload = await pinata.pinFileToIPFS(imageBuffer, {
      pinataMetadata: {
        name: `${metadata.name}_image`,
      },
    })

    const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageUpload.IpfsHash}`

    // 2. Create metadata with IPFS image URL
    const nftMetadata = {
      name: metadata.name,
      description: metadata.description,
      image: imageUrl,
      attributes: metadata.attributes,
      external_url: process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com',
    }

    // 3. Upload metadata to IPFS
    const metadataUpload = await pinata.pinJSONToIPFS(nftMetadata, {
      pinataMetadata: {
        name: `${metadata.name}_metadata`,
      },
    })

    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataUpload.IpfsHash}`

    return NextResponse.json({
      success: true,
      ipfsHash: metadataUpload.IpfsHash,
      metadataUri: metadataUrl,
      imageUri: imageUrl,
      imageHash: imageUpload.IpfsHash,
      message: 'Successfully uploaded to IPFS via Pinata'
    })

  } catch (error) {
    console.error('Pinata IPFS upload error:', error)
    return NextResponse.json(
      { success: false, error: 'IPFS upload failed' },
      { status: 500 }
    )
  }
}
```

### 6. Alternative: Free IPFS Solutions

#### A) NFT.Storage (Free)
```bash
npm install nft.storage
```

#### B) Web3.Storage (Free)
```bash
npm install web3.storage
```

#### C) Infura IPFS
```bash
npm install ipfs-http-client
```

### 7. Testing
1. Add real API keys
2. Restart the application
3. Mint an NFT
4. Image should appear in explorer

### 8. Verification
After minting an NFT:
1. Copy transaction hash
2. Open in Monad Explorer
3. Image should appear in NFT details
4. Metadata URL should work

## Important Notes
- Pinata free plan has 1GB storage
- Images are permanently stored on IPFS
- Metadata URL is stored in smart contract
- Explorer automatically fetches image from IPFS

## Troubleshooting
- Make sure API keys are correct
- Check CORS settings
- Check uploads in Pinata dashboard
- Check error messages in browser console