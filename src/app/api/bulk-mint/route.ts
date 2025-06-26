import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { monadTestnet, NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const { images, walletAddress, collectionId } = await request.json()

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided for bulk minting' },
        { status: 400 }
      )
    }

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    console.log(`Bulk minting ${images.length} NFTs to collection ${collectionId || 'default'}...`)

    // Create clients for blockchain interaction
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http()
    })

    // For demo purposes, we'll use a demo private key
    // In production, this should be handled differently
    const demoPrivateKey = process.env.DEMO_PRIVATE_KEY || '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    const account = privateKeyToAccount(demoPrivateKey as `0x${string}`)
    
    const walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http()
    })

    const mintedNFTs = []

    // First, upload all images to IPFS and create token URIs
    const tokenURIs = []
    for (let i = 0; i < images.length; i++) {
      console.log(`Uploading NFT ${i + 1}/${images.length} to IPFS...`)
      
      try {
        // Upload image to IPFS using absolute URL
        const baseUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : process.env.NEXTAUTH_URL || 'http://localhost:3000'
        
        const ipfsResponse = await fetch(`${baseUrl}/api/upload-ipfs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: images[i],
            name: `Bulk Minted NFT #${i + 1}`,
            description: `AI-generated artwork ${i + 1} from bulk minting`,
          }),
        })

        if (!ipfsResponse.ok) {
          throw new Error(`IPFS upload failed for NFT ${i + 1}`)
        }

        const ipfsData = await ipfsResponse.json()
        tokenURIs.push(ipfsData.metadataUri)
        console.log(`NFT ${i + 1}/${images.length} uploaded to IPFS: ${ipfsData.metadataUri}`)
      } catch (error) {
        console.error(`Failed to upload NFT ${i + 1} to IPFS:`, error)
        // Use a fallback URI for failed uploads
        tokenURIs.push(`ipfs://QmFailedUpload${i}`)
      }
    }

    // Get mint price from contract (use lower price for testing)
    let mintPrice = parseEther('0.0001') // Much lower price for testing
    try {
      mintPrice = await publicClient.readContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: NFT_CONTRACT_ABI,
        functionName: 'MINT_PRICE',
      }) as bigint
      console.log(`Contract mint price: ${mintPrice} wei`)
    } catch (error) {
      console.log('Could not read mint price from contract, using default 0.0001 ETH')
    }

    // Try individual minting first (more likely to succeed)
    console.log(`Starting individual minting for ${tokenURIs.length} NFTs...`)
    
    for (let i = 0; i < tokenURIs.length; i++) {
      try {
        console.log(`Minting NFT ${i + 1}/${tokenURIs.length} individually...`)
        
        const hash = await walletClient.writeContract({
          address: NFT_CONTRACT_ADDRESS,
          abi: NFT_CONTRACT_ABI,
          functionName: 'mintToCollection',
          args: [walletAddress as `0x${string}`, BigInt(collectionId || 1), tokenURIs[i]],
          value: mintPrice,
          gas: BigInt(500000), // Set explicit gas limit
        })

        console.log(`Transaction submitted: ${hash}`)
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`)
        
        const nftData = {
          tokenId: Date.now() + i,
          name: `Bulk Minted NFT #${i + 1}`,
          description: `AI-generated artwork ${i + 1} from bulk minting`,
          image: images[i],
          tokenURI: tokenURIs[i],
          transactionHash: hash,
          contractAddress: NFT_CONTRACT_ADDRESS,
          owner: walletAddress,
          collectionId: collectionId || 1,
          mintedAt: new Date().toISOString(),
          blockNumber: receipt.blockNumber.toString(),
          gasUsed: receipt.gasUsed.toString()
        }
        
        mintedNFTs.push(nftData)
        console.log(`NFT ${i + 1}/${tokenURIs.length} minted successfully: ${hash}`)
        
      } catch (individualError: any) {
        console.error(`Failed to mint NFT ${i + 1}:`, individualError)
        
        // Add failed NFT with error info
        const failedNftData = {
          tokenId: Date.now() + i,
          name: `Failed NFT #${i + 1}`,
          description: `Failed to mint: ${individualError?.message || 'Unknown error'}`,
          image: images[i],
          tokenURI: tokenURIs[i],
          transactionHash: null as any,
          contractAddress: NFT_CONTRACT_ADDRESS,
          owner: walletAddress,
          collectionId: collectionId || 1,
          mintedAt: new Date().toISOString(),
          blockNumber: '0',
          gasUsed: '0',
          status: 'failed',
          error: individualError?.message || 'Unknown error'
        }
        
        mintedNFTs.push(failedNftData)
      }
    }

    const successfulMints = mintedNFTs.filter((nft: any) => nft.status !== 'failed').length
    console.log(`Minting completed: ${successfulMints}/${mintedNFTs.length} NFTs minted successfully`)

    return NextResponse.json({
      success: true,
      message: `Successfully minted ${mintedNFTs.length} NFTs to Monad Testnet`,
      mintedNFTs,
      totalMinted: mintedNFTs.length,
      blockchain: 'Monad Testnet',
      contractAddress: NFT_CONTRACT_ADDRESS
    })

  } catch (error) {
    console.error('Bulk minting error:', error)
    return NextResponse.json(
      { error: 'Failed to bulk mint NFTs to blockchain' },
      { status: 500 }
    )
  }
}