import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { monadTestnet, NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const { tokenURI, walletAddress, collectionId } = await request.json()

    if (!tokenURI) {
      return NextResponse.json(
        { error: 'Token URI is required' },
        { status: 400 }
      )
    }

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    console.log(`Minting single NFT to collection ${collectionId || 1}...`)

    // Create clients for blockchain interaction
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http()
    })

    // For demo purposes, we'll use a demo private key
    const demoPrivateKey = process.env.DEMO_PRIVATE_KEY || '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
    const account = privateKeyToAccount(demoPrivateKey as `0x${string}`)
    
    const walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http()
    })

    // Get mint price from contract
    let mintPrice = parseEther('0.0001') // Lower price for testing
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

    try {
      console.log(`Minting NFT to collection ${collectionId || 1}...`)
      
      const hash = await walletClient.writeContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: NFT_CONTRACT_ABI,
        functionName: 'mintToCollection',
        args: [walletAddress as `0x${string}`, BigInt(collectionId || 1), tokenURI],
        value: mintPrice,
        gas: BigInt(500000), // Set explicit gas limit
      })

      console.log(`Transaction submitted: ${hash}`)
      
      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`)

      const nftData = {
        tokenId: Date.now(),
        name: `Single Minted NFT`,
        description: `AI-generated artwork minted individually`,
        tokenURI: tokenURI,
        transactionHash: hash,
        contractAddress: NFT_CONTRACT_ADDRESS,
        owner: walletAddress,
        collectionId: collectionId || 1,
        mintedAt: new Date().toISOString(),
        blockNumber: receipt.blockNumber.toString(),
        gasUsed: receipt.gasUsed.toString(),
        status: 'minted'
      }

      console.log(`Single NFT minted successfully: ${hash}`)

      return NextResponse.json({
        success: true,
        message: `Successfully minted NFT to Monad Testnet`,
        nftData,
        blockchain: 'Monad Testnet',
        contractAddress: NFT_CONTRACT_ADDRESS
      })

    } catch (contractError: any) {
      console.error('Single minting failed:', contractError)
      
      return NextResponse.json({
        success: false,
        error: `Failed to mint NFT: ${contractError?.message || 'Unknown error'}`,
        details: contractError
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Single minting error:', error)
    return NextResponse.json(
      { error: `Failed to mint NFT: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}