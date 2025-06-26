'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Coins, Loader2, Plus, ExternalLink, Image as ImageIcon, Users, Calendar, Upload } from 'lucide-react'
import { COLLECTION_ABI } from '@/lib/contracts'
import { useNFT, Collection } from '@/contexts/NFTContext'

interface CollectionManagerProps {
  generatedImages: string[]
}

export function CollectionManager({ generatedImages }: CollectionManagerProps) {
  const { address } = useAccount()
  const { collections, addNFT, syncWithBlockchain } = useNFT()
  
  // Demo mode için mock address
  const demoAddress = '0xc55e160D1f2133fc9A11f30cFB4Ee39c98Ff9e2e'
  const effectiveAddress = address || demoAddress
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [uploadedImage, setUploadedImage] = useState<string>('')
  const [nftName, setNftName] = useState('')
  const [nftDescription, setNftDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [status, setStatus] = useState('')
  const [ipfsHash, setIpfsHash] = useState('')

  const { writeContract: mintNFT, data: mintHash, error: mintError } = useWriteContract()
  const { isLoading: isMintConfirming, isSuccess: isMintConfirmed, data: mintReceipt } = useWaitForTransactionReceipt({
    hash: mintHash,
  })

  // Blockchain'den koleksiyonları yükle
  useEffect(() => {
    if (effectiveAddress) {
      syncWithBlockchain(effectiveAddress)
    }
  }, [effectiveAddress, syncWithBlockchain])

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setUploadedImage(result)
        setSelectedImage('') // Clear AI generated image selection
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadToIPFS = async (imageData: string, metadata: any) => {
    setIsUploading(true)
    try {
      const nftMetadata = {
        name: metadata.name,
        description: metadata.description,
        image: imageData,
        attributes: metadata.attributes,
        external_url: window.location.origin,
        background_color: "000000",
        animation_url: null,
        youtube_url: null
      }

      const response = await fetch('/api/upload-ipfs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: nftMetadata,
          image: imageData
        })
      })

      if (response.ok) {
        const result = await response.json()
        setIpfsHash(result.ipfsHash)
        return result.metadataUri
      } else {
        throw new Error('IPFS upload failed')
      }
    } catch (error) {
      console.error('Error uploading to IPFS:', error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const handleMintToCollection = async () => {
    const finalImage = uploadedImage || selectedImage
    if (!selectedCollection || !finalImage || !nftName || !nftDescription || !effectiveAddress) return

    try {
      setIsMinting(true)
      setStatus('Preparing NFT metadata...')

      // Create metadata
      const metadata = {
        name: nftName,
        description: nftDescription,
        image: finalImage,
        attributes: [
          {
            trait_type: "Collection",
            value: selectedCollection.name
          },
          {
            trait_type: "Created By",
            value: "AIrtist dApp"
          },
          {
            trait_type: "Blockchain",
            value: "Monad Testnet"
          },
          {
            trait_type: "Generation Date",
            value: new Date().toISOString().split('T')[0]
          },
          {
            trait_type: "Type",
            value: "AI Generated"
          },
          {
            trait_type: "Style",
            value: "AI Generated Art"
          }
        ]
      }

      setStatus('Uploading to IPFS...')
      const tokenURI = await uploadToIPFS(finalImage, metadata)

      setStatus('Minting NFT...')
      // Mint NFT to the selected collection
      mintNFT({
        address: selectedCollection.contractAddress as `0x${string}`,
        abi: COLLECTION_ABI,
        functionName: 'mint',
        args: [effectiveAddress, tokenURI],
        value: BigInt(selectedCollection.mintPrice),
      })

    } catch (error) {
      console.error('Error minting to collection:', error)
      setStatus('Minting failed')
      setIsMinting(false)
      
      setTimeout(() => {
        setStatus('')
      }, 5000)
    }
  }

  // Handle mint confirmation
  useEffect(() => {
    if (isMintConfirmed && mintReceipt && selectedCollection) {
      console.log('NFT minting confirmed!', mintReceipt)
      
      // Calculate next token ID (current supply + 1)
      const nextTokenId = ((selectedCollection.currentSupply || 0) + 1).toString()
      
      // Save NFT to context
      if (effectiveAddress) {
        const finalImage = uploadedImage || selectedImage
        const nftData = {
          id: `${selectedCollection.contractAddress}-${nextTokenId}`,
          name: nftName,
          description: nftDescription,
          image: finalImage,
          tokenId: nextTokenId,
          contractAddress: selectedCollection.contractAddress,
          collectionId: selectedCollection.id,
          owner: address,
          transactionHash: mintHash || '',
          ipfsHash: ipfsHash,
          metadata: {
            name: nftName,
            description: nftDescription,
            image: finalImage,
            attributes: []
          },
          createdAt: new Date().toISOString(),
          likes: 0,
          views: 0,
          explorerUrl: `https://testnet.monadexplorer.com/token/${selectedCollection.contractAddress}?a=${nextTokenId}`
        }
        addNFT(nftData)
      }
      
      setStatus('NFT successfully minted! 🎉')
      setIsMinting(false)
      
      // Reset form
      setSelectedImage('')
      setUploadedImage('')
      setNftName('')
      setNftDescription('')
      setIpfsHash('')
      
      // Sync with blockchain to update collection supply
      setTimeout(() => {
        if (effectiveAddress) {
          syncWithBlockchain(effectiveAddress)
        }
      }, 2000)
      
      setTimeout(() => {
        setStatus('')
      }, 5000)
    }
  }, [isMintConfirmed, mintReceipt, selectedCollection, address, nftName, nftDescription, selectedImage, mintHash, ipfsHash, addNFT, syncWithBlockchain])

  // Handle mint error
  useEffect(() => {
    if (mintError) {
      console.error('Mint NFT error:', mintError)
      setIsMinting(false)
      setStatus('NFT minting failed')
      
      setTimeout(() => {
        setStatus('')
      }, 5000)
    }
  }, [mintError])

  // Demo Mode desteği - wallet bağlı değilse demo address kullan
  if (!effectiveAddress) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-12"
        >
          <Users className="h-16 w-16 text-amber-400 mx-auto mb-6" />
          <h3 className="text-3xl font-bold mb-4 text-gradient">
            Loading Collections...
          </h3>
          <p className="text-amber-300">
            Please wait while we load your collections
          </p>
        </motion.div>
      </div>
    )
  }

  if (collections.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-12"
        >
          <ImageIcon className="h-16 w-16 text-amber-400 mx-auto mb-6" />
          <h3 className="text-3xl font-bold mb-4 text-gradient">
            No Collections Found
          </h3>
          <p className="text-amber-300 mb-6">
            Create your first collection to start minting NFTs
          </p>
          <button
            onClick={() => {
              const event = new CustomEvent('switchTab', { detail: 'collection' });
              window.dispatchEvent(event);
            }}
            className="btn-primary"
          >
            Create Collection
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="text-center">
          <h3 className="text-3xl font-bold mb-4 text-gradient">
            Collection Manager
          </h3>
          <p className="text-amber-300">
            Mint NFTs to your existing collections
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <motion.div
              key={collection.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedCollection(collection)}
              className={`card p-6 cursor-pointer transition-all ${
                selectedCollection?.id === collection.id
                  ? 'border-pink-500 ring-2 ring-pink-500/50 glow'
                  : 'border-cyan-400 hover:border-pink-400'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-lg text-amber-400">{collection.name}</h4>
                <span className="text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded">
                  {collection.symbol}
                </span>
              </div>
              
              <p className="text-amber-300 text-sm mb-4 line-clamp-2">
                {collection.description}
              </p>
              
              <div className="space-y-2 text-xs text-amber-300">
                <div className="flex justify-between">
                  <span>Supply:</span>
                  <span className="text-green-400">
                    {collection.currentSupply || 0}/{collection.maxSupply}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Mint Price:</span>
                  <span className="text-green-400">
                    {(Number(collection.mintPrice) / 1e18).toFixed(4)} MON
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="text-green-400">
                    {new Date(collection.createdAt * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-cyan-400/20">
                <a
                  href={`https://testnet.monadexplorer.com/address/${collection.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-400 hover:text-pink-400 flex items-center space-x-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>View Contract</span>
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mint to Collection Form */}
        {selectedCollection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8"
          >
            <h4 className="text-2xl font-bold mb-6 text-center text-gradient">
              Mint to {selectedCollection.name}
            </h4>

            {/* Image Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-4 text-amber-400">
                Select or Upload Artwork:
              </label>
              
              {/* File Upload */}
              <div className="mb-4">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                      uploadedImage
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-cyan-400 hover:border-pink-400 hover:bg-pink-400/5'
                    }`}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-amber-400" />
                    <p className="text-amber-300 text-sm">
                      {uploadedImage ? 'Image uploaded successfully!' : 'Click to upload your own image'}
                    </p>
                    <p className="text-amber-400 text-xs mt-1">
                      Supports JPG, PNG, GIF (Max 10MB)
                    </p>
                  </motion.div>
                </label>
              </div>

              {/* AI Generated Images */}
              {generatedImages.length > 0 && (
                <div>
                  <p className="text-sm text-amber-400 mb-3">Or select from AI generated images:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {generatedImages.map((image, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedImage(image)
                          setUploadedImage('') // Clear uploaded image
                        }}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === image && !uploadedImage
                            ? 'border-pink-500 ring-2 ring-pink-500/50 glow'
                            : 'border-cyan-400 hover:border-pink-400'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Artwork ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* NFT Details Form */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="collection-nft-name" className="block text-sm font-medium mb-2 text-amber-400">
                    NFT Name:
                  </label>
                  <input
                    id="collection-nft-name"
                    type="text"
                    value={nftName}
                    onChange={(e) => setNftName(e.target.value)}
                    placeholder={`${selectedCollection.name} #${(selectedCollection.currentSupply || 0) + 1}`}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label htmlFor="collection-nft-description" className="block text-sm font-medium mb-2 text-amber-400">
                    Description:
                  </label>
                  <textarea
                    id="collection-nft-description"
                    value={nftDescription}
                    onChange={(e) => setNftDescription(e.target.value)}
                    placeholder="Describe this unique piece in your collection..."
                    className="input w-full resize-none"
                    rows={4}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {(uploadedImage || selectedImage) && (
                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-cyan-400">
                    <img
                      src={uploadedImage || selectedImage}
                      alt="Selected artwork"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="card p-4">
                  <h5 className="font-bold mb-2 text-amber-400">Collection Info</h5>
                  <div className="space-y-2 text-sm text-amber-300">
                    <div className="flex justify-between">
                      <span>Collection:</span>
                      <span className="text-green-400">{selectedCollection.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Token ID:</span>
                      <span className="text-green-400">#{(selectedCollection.currentSupply || 0) + 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mint Price:</span>
                      <span className="text-green-400">
                        {(Number(selectedCollection.mintPrice) / 1e18).toFixed(4)} MON
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Message */}
            {status && (
              <div className={`text-center p-3 rounded-lg mt-6 ${
                status.includes('başarısız') || status.includes('failed')
                  ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                  : 'bg-green-500/20 text-green-300 border border-green-500/50'
              }`}>
                {status}
              </div>
            )}

            {/* Mint Button */}
            <div className="mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleMintToCollection}
                disabled={!(uploadedImage || selectedImage) || !nftName || !nftDescription || isUploading || isMinting}
                className={`w-full py-4 px-6 rounded-lg transition-all flex items-center justify-center space-x-2 ${
                  !(uploadedImage || selectedImage) || !nftName || !nftDescription || isUploading || isMinting
                    ? 'btn-secondary opacity-50 cursor-not-allowed'
                    : 'btn-primary'
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Uploading to IPFS...</span>
                  </>
                ) : isMinting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Minting NFT...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    <span>Mint to Collection</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}