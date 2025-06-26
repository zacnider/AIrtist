'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wand2, Loader2, Download, Plus, Coins } from 'lucide-react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther } from 'viem'
import { FACTORY_CONTRACT_ADDRESS, FACTORY_ABI, NFT_MINTER_CONTRACT_ADDRESS, NFT_MINTER_ABI } from '@/lib/config'

interface ArtGeneratorProps {
  onImagesGenerated: (images: string[]) => void
  generatedImages: string[]
}

export function ArtGenerator({ onImagesGenerated, generatedImages }: ArtGeneratorProps) {
  const { address, isConnected } = useAccount()
  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })
  
  // Get mint price from NFT Minter contract
  const { data: mintPrice } = useReadContract({
    address: NFT_MINTER_CONTRACT_ADDRESS,
    abi: NFT_MINTER_ABI,
    functionName: 'MINT_PRICE',
  })
  
  const [prompt, setPrompt] = useState('a majestic dragon soaring through mystical clouds, fantasy landscape, magical atmosphere')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState('fantasy')
  const [quantity, setQuantity] = useState(5)
  const [collectionName, setCollectionName] = useState('My Amazing NFT Collection')
  const [collectionDescription, setCollectionDescription] = useState('A unique collection of AI-generated artworks featuring mystical dragons and fantasy landscapes')
  const [successMessage, setSuccessMessage] = useState('')
  const [isBulkMinting, setIsBulkMinting] = useState(false)
  const [defaultCollectionId, setDefaultCollectionId] = useState<bigint | null>(null)

  const artStyles = [
    { id: 'fantasy', name: 'Fantasy', prompt: 'fantasy art, magical creatures, mystical landscapes, ethereal lighting, enchanted' },
    { id: 'anime', name: 'Anime', prompt: 'anime style, manga art, vibrant colors, detailed characters, Japanese animation' },
    { id: 'landscape', name: 'Landscape', prompt: 'beautiful landscape, scenic view, natural beauty, atmospheric perspective, detailed environment' },
    { id: 'cyberpunk', name: 'Cyberpunk', prompt: 'cyberpunk style, neon lights, futuristic city, high tech low life, dystopian atmosphere' },
    { id: 'digital-art', name: 'Digital Art', prompt: 'digital painting, concept art, professional illustration, digital masterpiece' },
    { id: 'abstract', name: 'Abstract', prompt: 'abstract art, geometric shapes, color harmony, modern composition, artistic expression' },
    { id: 'portrait', name: 'Portrait', prompt: 'detailed portrait, realistic face, expressive eyes, professional photography, studio lighting' },
    { id: 'sci-fi', name: 'Sci-Fi', prompt: 'science fiction, space age, futuristic technology, alien worlds, cosmic themes' },
    { id: 'steampunk', name: 'Steampunk', prompt: 'steampunk aesthetic, Victorian era, brass gears, steam machinery, retro-futuristic' },
    { id: 'watercolor', name: 'Watercolor', prompt: 'watercolor painting, soft brushstrokes, flowing colors, artistic medium, traditional art' }
  ]

  // Create default collection if not exists
  const createDefaultCollection = async () => {
    if (!isConnected || !address || defaultCollectionId) return

    try {
      writeContract({
        address: FACTORY_CONTRACT_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'createCollection',
        args: ['AIrtist Default Collection', 'Default collection for AIrtist NFTs', BigInt(10000)],
      })
      
      // Note: We'll need to listen for the transaction result to get the collection ID
      // For now, we'll use collection ID 1 as default
      setDefaultCollectionId(BigInt(1))
    } catch (error) {
      console.error('Failed to create default collection:', error)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    // Validate collection info if quantity > 1
    if (quantity > 1 && (!collectionName.trim() || !collectionDescription.trim())) {
      alert('Please provide collection name and description for multiple NFTs')
      return
    }

    setIsGenerating(true)
    try {
      const stylePrompt = artStyles.find(s => s.id === selectedStyle)?.prompt || ''
      const basePrompt = `${prompt}, ${stylePrompt}, masterpiece, best quality, ultra detailed`
      
      if (quantity === 1) {
        // Single NFT generation
        const response = await fetch('/api/generate-art', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: basePrompt,
            negative_prompt: negativePrompt || 'blurry, bad quality, distorted',
            width: 1024,
            height: 1024,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to generate image')
        }

        const data = await response.json()
        console.log('API Response:', data)
        
        if (data.success && data.imageData) {
          console.log('Image data received:', data.imageData.substring(0, 50) + '...')
          const newImages = [...generatedImages, data.imageData]
          console.log('New images array:', newImages.length)
          onImagesGenerated(newImages)
        } else {
          console.error('API Error:', data)
          throw new Error(data.error || 'Failed to generate image')
        }
      } else {
        // Collection generation (multiple NFTs)
        const response = await fetch('/api/generate-collection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: collectionName,
            description: collectionDescription,
            basePrompt: basePrompt,
            quantity: quantity,
            negativePrompt: negativePrompt || 'blurry, bad quality, distorted'
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to generate collection')
        }

        const data = await response.json()
        console.log('Collection API Response:', data)
        
        if (data.success) {
          // Show success message and add generated images to gallery
          setSuccessMessage(`Collection "${collectionName}" created successfully with ${quantity} NFTs!`)
          
          // Add generated NFT images to the generatedImages array
          if (data.collection && data.collection.nfts) {
            const newImages = data.collection.nfts.map((nft: any) => nft.imageData)
            const allImages = [...generatedImages, ...newImages]
            onImagesGenerated(allImages)
          }
          
          // Clear success message after showing
          setTimeout(() => {
            setSuccessMessage('')
          }, 5000)
          
          // Don't reset form or redirect - keep images visible for minting
        } else {
          console.error('Collection API Error:', data)
          throw new Error(data.error || 'Failed to generate collection')
        }
      }
    } catch (error) {
      console.error('Error generating:', error)
      alert('Error generating. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = (imageData: string, index: number) => {
    const link = document.createElement('a')
    link.href = imageData
    link.download = `nft-art-${index + 1}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleBulkMint = async () => {
    if (generatedImages.length === 0) {
      alert('No images to mint')
      return
    }

    if (!isConnected || !address) {
      alert('Please connect your wallet first')
      return
    }

    setIsBulkMinting(true)
    
    try {
      // Upload all images to IPFS first
      console.log('Uploading images to IPFS...')
      const tokenURIs = []
      for (let i = 0; i < generatedImages.length; i++) {
        const ipfsResponse = await fetch('/api/upload-ipfs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: generatedImages[i],
            name: `Bulk Minted NFT #${i + 1}`,
            description: `AI-generated artwork ${i + 1} from bulk minting`,
          }),
        })

        if (ipfsResponse.ok) {
          const ipfsData = await ipfsResponse.json()
          tokenURIs.push(ipfsData.metadataUrl)
        } else {
          console.error(`Failed to upload image ${i + 1} to IPFS`)
          throw new Error(`Failed to upload image ${i + 1} to IPFS`)
        }
      }

      console.log('All images uploaded to IPFS, creating collection...')
      
      // Create collection using factory contract
      writeContract({
        address: FACTORY_CONTRACT_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'createCollection',
        args: [
          `Bulk Mint Collection ${Date.now()}`,
          `Collection of ${generatedImages.length} AI-generated artworks`,
          BigInt(generatedImages.length)
        ],
      })
      
      // Wait for collection creation
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Now mint all NFTs using NFTMinter contract
      console.log('Minting NFTs to collection...')
      const totalCost = mintPrice ? BigInt(generatedImages.length) * mintPrice : parseEther((0.001 * generatedImages.length).toString())
      
      writeContract({
        address: NFT_MINTER_CONTRACT_ADDRESS,
        abi: NFT_MINTER_ABI,
        functionName: 'batchMintToCollection',
        args: [address, BigInt(1), tokenURIs], // Using collection ID 1 for now
        value: totalCost,
      })
      
      setSuccessMessage(`Successfully minted ${tokenURIs.length} NFTs! Total cost: ${(Number(totalCost) / 1e18).toFixed(3)} MON`)
      
      // Clear generated images after successful collection creation
      onImagesGenerated([])
      
      // Clear success message after 10 seconds
      setTimeout(() => {
        setSuccessMessage('')
      }, 10000)
      
    } catch (error) {
      console.error('Bulk collection creation error:', error)
      alert(`Failed to create collection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsBulkMinting(false)
    }
  }

  const handleIndividualMint = async (imageData: string, index: number) => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first')
      return
    }

    try {
      // Upload to IPFS first
      console.log('Uploading to IPFS...')
      const ipfsResponse = await fetch('/api/upload-ipfs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: imageData,
          name: `Generated NFT #${index + 1}`,
          description: `AI-generated artwork ${index + 1}`,
        }),
      })

      if (!ipfsResponse.ok) {
        throw new Error('Failed to upload to IPFS')
      }

      const ipfsData = await ipfsResponse.json()
      console.log('IPFS upload successful:', ipfsData.metadataUrl)

      // Create a collection for this individual NFT
      console.log('Creating collection for individual NFT...')
      writeContract({
        address: FACTORY_CONTRACT_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'createCollection',
        args: [
          `Individual NFT ${Date.now()}`,
          `Single AI-generated artwork`,
          BigInt(1)
        ],
      })
      
      // Wait for collection creation
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Now mint the NFT using NFTMinter contract
      console.log('Minting NFT...')
      const cost = mintPrice || parseEther('0.001')
      
      writeContract({
        address: NFT_MINTER_CONTRACT_ADDRESS,
        abi: NFT_MINTER_ABI,
        functionName: 'mintToCollection',
        args: [address, BigInt(1), ipfsData.metadataUrl], // Using collection ID 1 for now
        value: cost,
      })

      alert(`Successfully minted NFT! Cost: ${(Number(cost) / 1e18).toFixed(3)} MON`)
      
    } catch (error) {
      console.error('Individual collection creation error:', error)
      alert(`Failed to create collection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 mb-8 relative"
      >
        <h3 className="text-3xl font-bold mb-6 text-center text-gradient">
          AI Art Studio
        </h3>
        
        {/* Art Style Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3 text-amber-400">Choose Art Style:</label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {artStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`p-3 rounded-lg border-2 transition-all text-sm ${
                  selectedStyle === style.id
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-500/25'
                    : 'border-amber-600/50 bg-black/50 text-amber-200 hover:border-amber-400 hover:text-amber-300'
                }`}
              >
                {style.name}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="mb-6">
          <label htmlFor="prompt" className="block text-sm font-medium mb-2 text-amber-400">
            Describe Your Vision:
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="a majestic dragon soaring through mystical clouds, fantasy landscape, magical atmosphere..."
            className="input w-full resize-none"
            rows={3}
          />
        </div>

        {/* Negative Prompt */}
        <div className="mb-6">
          <label htmlFor="negative-prompt" className="block text-sm font-medium mb-2 text-amber-400">
            Exclude Elements (Optional):
          </label>
          <input
            id="negative-prompt"
            type="text"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="blurry, low quality, distorted, ugly, deformed..."
            className="input w-full"
          />
        </div>

        {/* Quantity Selection */}
        <div className="mb-6">
          <label htmlFor="quantity" className="block text-sm font-medium mb-2 text-amber-400">
            Number of NFTs to Generate:
          </label>
          <select
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full px-4 py-3 bg-slate-800/50 border border-amber-600/50 rounded-lg text-amber-200 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all"
          >
            <option value={1}>1 NFT (Single)</option>
            {[5, 10, 25, 50, 100, 250, 500, 1000].map(num => (
              <option key={num} value={num}>{num} NFTs (Collection)</option>
            ))}
          </select>
          <p className="text-xs text-amber-300 mt-1">
            {quantity === 1 ? 'Single NFT will be added to your gallery' : `Collection of ${quantity} NFTs will be created automatically`}
          </p>
        </div>

        {/* Collection Info (only show if quantity > 1) */}
        {quantity > 1 && (
          <div className="mb-6 p-4 border border-amber-500/30 rounded-lg bg-amber-500/5">
            <h4 className="text-lg font-semibold mb-3 text-amber-400">Collection Information</h4>
            
            <div className="mb-4">
              <label htmlFor="collection-name" className="block text-sm font-medium mb-2 text-amber-400">
                Collection Name:
              </label>
              <input
                id="collection-name"
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="My Amazing NFT Collection"
                className="input w-full"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="collection-description" className="block text-sm font-medium mb-2 text-amber-400">
                Collection Description:
              </label>
              <textarea
                id="collection-description"
                value={collectionDescription}
                onChange={(e) => setCollectionDescription(e.target.value)}
                placeholder="A unique collection of AI-generated artworks featuring..."
                className="input w-full resize-none"
                rows={3}
                required
              />
            </div>
            
            <div className="text-xs text-amber-300">
              <p>• Each NFT will have unique variations based on your prompt</p>
              <p>• Collection will be automatically deployed to blockchain</p>
              <p>• All NFTs will be minted to the collection contract</p>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating || (quantity > 1 && (!collectionName.trim() || !collectionDescription.trim()))}
          className={`w-full py-4 px-6 rounded-lg transition-all flex items-center justify-center space-x-2 ${
            !prompt.trim() || isGenerating || (quantity > 1 && (!collectionName.trim() || !collectionDescription.trim()))
              ? 'btn-secondary opacity-50 cursor-not-allowed'
              : 'btn-primary'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>{quantity === 1 ? 'Creating Masterpiece...' : `Creating ${quantity} NFTs...`}</span>
            </>
          ) : (
            <>
              <Wand2 className="h-6 w-6" />
              <span>{quantity === 1 ? 'Generate Art' : `Generate ${quantity} NFTs`}</span>
            </>
          )}
        </motion.button>

        {/* Success Message */}
        {successMessage && (
          <div className="mt-4 p-4 bg-green-500/20 border border-green-400 rounded-lg text-center">
            <p className="text-green-300 font-semibold">{successMessage}</p>
            <p className="text-green-200 text-sm mt-1">Redirecting to Gallery...</p>
          </div>
        )}

        {/* Info */}
        <div className="mt-4 text-center text-sm text-amber-400">
          <p>AI-Powered • Unique Creations • {quantity === 1 ? 'Single NFT' : 'Auto Collection'}</p>
          {quantity > 1 && (
            <p className="text-xs text-amber-300 mt-1">
              Generating {quantity} unique NFTs with automatic collection deployment
            </p>
          )}
        </div>
      </motion.div>

      {/* Generated Images */}
      {generatedImages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8"
        >
          <h4 className="text-2xl font-bold mb-6 text-gradient">
            Your Creations
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-black border-2 border-amber-600/50 hover:border-amber-400 transition-colors">
                  <img
                    src={image}
                    alt={`Generated artwork ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                  <button
                    onClick={() => downloadImage(image, index)}
                    className="btn-secondary p-3 rounded-full"
                    title="Download Artwork"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleIndividualMint(image, index)}
                    className="btn-primary p-3 rounded-full"
                    title="Mint NFT"
                  >
                    <Coins className="h-5 w-5" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-black/90 backdrop-blur-sm rounded-lg p-2 border border-amber-500/50">
                    <p className="text-xs text-amber-400 font-bold">Artwork #{String(index + 1).padStart(2, '0')}</p>
                    <p className="text-xs text-amber-300">Ready to Mint</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-amber-400 mb-4">
              {generatedImages.length} Artwork{generatedImages.length > 1 ? 's' : ''} Created
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  // Switch to mint tab for individual minting
                  const event = new CustomEvent('switchTab', { detail: 'mint' });
                  window.dispatchEvent(event);
                }}
                className="btn-secondary inline-flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Individual Mint</span>
              </button>
              
              {generatedImages.length > 1 && (
                <button
                  onClick={handleBulkMint}
                  disabled={isBulkMinting}
                  className={`btn-primary inline-flex items-center space-x-2 ${
                    isBulkMinting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isBulkMinting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Minting...</span>
                    </>
                  ) : (
                    <>
                      <Coins className="h-5 w-5" />
                      <span>Mint All ({generatedImages.length})</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}