# Pinata IPFS Setup Guide

This guide shows how to set up Pinata IPFS service in your AIrtist DApp.

## 1. Creating Pinata Account

1. **Go to Pinata**: https://pinata.cloud/
2. Click **Sign Up** button
3. Create account with email and password
4. Complete email verification

## 2. Getting API Keys

1. **Login to Pinata Dashboard**: https://app.pinata.cloud/
2. **Select "API Keys"** from left menu
3. Click **"New Key"** button
4. **Key settings**:
   - **Key Name**: `AIrtist-DApp` (you can choose any name)
   - **Customize Permissions**:
     - **Files**: ✅ **Enable all permissions** (pinFileToIPFS, unpinning, listing)
     - **Groups**: ❌ **Keep disabled** (not needed)
     - **Gateways**: ❌ **Keep disabled** (not needed)
     - **Analytics**: ❌ **Keep disabled** (not needed)
   - **Max Uses**: Leave empty (unlimited)

5. Click **"Create Key"** button
6. Copy **API Key** and **API Secret** values

### Permissions Detail:
- **Files**: Required to upload NFT images and metadata
- **Groups**: File group management (not needed for NFT project)
- **Gateways**: Custom gateway management (not needed for free plan)
- **Analytics**: Statistics viewing (optional)

⚠️ **IMPORTANT**: API Secret is shown only once, make sure to save it!

## 3. Setting Environment Variables

Open your `.env.local` file and add your Pinata keys:

```env
# Pinata IPFS Service (Primary)
NEXT_PUBLIC_PINATA_API_KEY=your_actual_pinata_api_key_here
NEXT_PUBLIC_PINATA_SECRET_KEY=your_actual_pinata_secret_key_here
```

**Example**:
```env
NEXT_PUBLIC_PINATA_API_KEY=a1b2c3d4e5f6g7h8i9j0
NEXT_PUBLIC_PINATA_SECRET_KEY=k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

## 4. Testing

1. Restart development server:
   ```bash
   npm run dev
   ```

2. Generate an image in AI Studio
3. You should see this message in terminal:
   ```
   Using Pinata as primary IPFS service...
   Pinata upload successful: { imageCID: "...", metadataCID: "..." }
   ```

## 5. Check Pinata Dashboard

1. **Pinata Dashboard**: https://app.pinata.cloud/pinmanager
2. You can see your uploaded files in **Files** tab
3. For each file:
   - **CID** (Content Identifier)
   - **File size**
   - **Upload date**
   - **Gateway URL**

## 6. Pricing

- **Free Plan**: 1 GB storage + 100 GB bandwidth/month
- **Pro Plan**: $20/month - 100 GB storage + 1 TB bandwidth
- **Dedicated Gateway**: Custom gateway for faster access

## 7. Troubleshooting

### API Key Error
```
Error: Request failed with status code 401
```
**Solution**: Check your API keys, make sure they are copied correctly.

### Network Error
```
Error: Network Error
```
**Solution**: Check your internet connection, verify Pinata service is working.

### File Size Error
```
Error: File too large
```
**Solution**: Reduce image size or upgrade to Pro plan.

## 8. Gateway URLs

You can access your uploaded files through these URLs:

- **Pinata Gateway**: `https://gateway.pinata.cloud/ipfs/{CID}`
- **Public IPFS**: `https://ipfs.io/ipfs/{CID}`
- **Cloudflare**: `https://cloudflare-ipfs.com/ipfs/{CID}`

## 9. Security

- ✅ Store API keys in `.env.local` file
- ✅ Add `.env.local` file to `.gitignore`
- ❌ Don't hardcode API keys in code
- ❌ Don't share API keys in public repositories

## 10. Backup Strategy

The system tries IPFS services in this order:

1. **Pinata** (Primary)
2. **NFT.Storage** (Fallback)
3. **Mock Upload** (Development)

This way if one service fails, another takes over.

## 11. Current Implementation

### Active Configuration
The AIrtist DApp currently uses Pinata as the primary IPFS service with the following features:

- ✅ **Image Upload**: Direct image upload to IPFS
- ✅ **Metadata Upload**: JSON metadata with image references
- ✅ **Gateway URLs**: Accessible via multiple gateways
- ✅ **Error Handling**: Automatic fallback to alternative services

### API Integration
The upload process works as follows:
1. Image is uploaded to Pinata IPFS
2. Metadata JSON is created with image CID
3. Metadata is uploaded to Pinata IPFS
4. Final metadata URL is returned for NFT minting

---

**Note**: This guide is for the current Pinata integration in AIrtist. Make sure to keep your API keys secure and monitor your usage.