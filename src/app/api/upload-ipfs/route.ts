import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, imageData, name, description } = await request.json()

    // Accept either imageUrl or imageData
    const imageSource = imageUrl || imageData
    if (!imageSource) {
      return NextResponse.json(
        { error: 'Image URL or image data is required' },
        { status: 400 }
      )
    }

    const pinataApiKey = process.env.PINATA_API_KEY
    const pinataSecretKey = process.env.PINATA_SECRET_API_KEY

    if (!pinataApiKey || !pinataSecretKey) {
      return NextResponse.json(
        { error: 'Pinata API keys not configured' },
        { status: 500 }
      )
    }

    console.log('Uploading to IPFS via Pinata...')

    let imageBlob: Blob

    // Handle different image sources
    if (imageSource.startsWith('data:')) {
      // Handle base64 data URLs
      const response = await fetch(imageSource)
      imageBlob = await response.blob()
    } else {
      // Handle regular URLs
      const imageResponse = await fetch(imageSource)
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch image')
      }
      imageBlob = await imageResponse.blob()
    }
    const imageFormData = new FormData()
    imageFormData.append('file', imageBlob, 'nft-image.png')

    const imageUploadResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey,
      },
      body: imageFormData,
    })

    if (!imageUploadResponse.ok) {
      const errorText = await imageUploadResponse.text()
      throw new Error(`Failed to upload image to IPFS: ${errorText}`)
    }

    const imageResult = await imageUploadResponse.json()
    const imageIpfsUrl = `https://gateway.pinata.cloud/ipfs/${imageResult.IpfsHash}`

    console.log(`Image uploaded to IPFS: ${imageIpfsUrl}`)

    // Create metadata
    const metadata = {
      name: name || 'AI Generated NFT',
      description: description || 'AI-generated artwork created with Stable Diffusion',
      image: imageIpfsUrl,
      attributes: [
        {
          trait_type: 'Generation Method',
          value: 'AI Stable Diffusion'
        },
        {
          trait_type: 'Created At',
          value: new Date().toISOString()
        }
      ]
    }

    // Upload metadata to IPFS
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json'
    })

    const metadataFormData = new FormData()
    metadataFormData.append('file', metadataBlob, 'metadata.json')

    const metadataUploadResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey,
      },
      body: metadataFormData,
    })

    if (!metadataUploadResponse.ok) {
      const errorText = await metadataUploadResponse.text()
      throw new Error(`Failed to upload metadata to IPFS: ${errorText}`)
    }

    const metadataResult = await metadataUploadResponse.json()
    const metadataIpfsUrl = `https://gateway.pinata.cloud/ipfs/${metadataResult.IpfsHash}`

    console.log(`Metadata uploaded to IPFS: ${metadataIpfsUrl}`)

    return NextResponse.json({
      success: true,
      imageUrl: imageIpfsUrl,
      metadataUrl: metadataIpfsUrl,
      metadata
    })

  } catch (error: any) {
    console.error('IPFS upload error:', error)
    return NextResponse.json(
      { error: `Failed to upload to IPFS: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}