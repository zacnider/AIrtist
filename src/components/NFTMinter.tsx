'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther } from 'viem'
import { Upload, Coins, Loader2, CheckCircle, X } from 'lucide-react'
import { FACTORY_CONTRACT_ADDRESS, FACTORY_ABI, NFT_MINTER_CONTRACT_ADDRESS, NFT_MINTER_ABI } from '@/lib/config'

interface NFTMinterProps {
  generatedImages: string[]
}

export function NFTMinter({ generatedImages }: NFTMinterProps) {
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
  
  const [uploadedImage, setUploadedImage] = useState<string>('')
  const [nftName, setNftName] = useState('')
  const [nftDescription, setNftDescription] = useState('')
  const [isMinting, setIsMinting] = useState(false)
  const [mintSuccess, setMintSuccess] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleMint = async () => {
    if (!uploadedImage || !nftName || !nftDescription) return

    if (!isConnected || !address) {
      alert('Please connect your wallet first')
      return
    }

    setIsMinting(true)
    try {
      // Upload to IPFS first
      const ipfsResponse = await fetch('/api/upload-ipfs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: uploadedImage,
          name: nftName,
          description: nftDescription,
        }),
      })

      if (!ipfsResponse.ok) {
        throw new Error('Failed to upload to IPFS')
      }

      const ipfsData = await ipfsResponse.json()
      console.log('IPFS upload successful:', ipfsData.metadataUrl)

      // Create a collection for this NFT
      console.log('Creating collection for NFT...')
      writeContract({
        address: FACTORY_CONTRACT_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'createCollection',
        args: [
          nftName,
          nftDescription,
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

      console.log('NFT minted successfully!')
      setMintSuccess(true)
      
      // Reset form after success
      setTimeout(() => {
        setUploadedImage('')
        setNftName('')
        setNftDescription('')
        setMintSuccess(false)
      }, 5000)
    } catch (error) {
      console.error('Minting failed:', error)
      alert('Minting failed. Please try again.')
    } finally {
      setIsMinting(false)
    }
  }

  const clearUploadedImage = () => {
    setUploadedImage('')
  }

  if (mintSuccess) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-12"
        >
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-6" />
          <h3 className="text-3xl font-bold mb-4 text-gradient">
            NFT Minted Successfully!
          </h3>
          <p className="text-amber-300 mb-6">
            Your artwork has been minted to the blockchain
          </p>
          <div className="card p-6 mb-6">
            <img
              src={uploadedImage}
              alt="Minted NFT"
              className="w-48 h-48 object-cover rounded-lg mx-auto mb-4 border-2 border-green-400"
            />
            <h4 className="font-bold text-lg text-amber-400">{nftName}</h4>
            <p className="text-amber-300 text-sm">{nftDescription}</p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8"
      >
        <h3 className="text-3xl font-bold mb-6 text-center text-gradient">
          Quick Mint
        </h3>
        <p className="text-center text-amber-300 mb-8">
          Upload your image and mint it as an NFT
        </p>

        {/* File Upload */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-4 text-amber-400">
            Upload Your Image:
          </label>
          
          {!uploadedImage ? (
            <div className="border-2 border-dashed border-amber-600/50 rounded-lg p-8 text-center hover:border-amber-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                <p className="text-amber-300 mb-2">Click to upload an image</p>
                <p className="text-amber-400 text-sm">JPG, PNG, GIF up to 10MB</p>
              </label>
            </div>
          ) : (
            <div className="relative">
              <img
                src={uploadedImage}
                alt="Uploaded"
                className="w-full max-w-md mx-auto rounded-lg border-2 border-amber-400"
              />
              <button
                onClick={clearUploadedImage}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {uploadedImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* NFT Details */}
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-amber-400 mb-4">
                  <img
                    src={uploadedImage}
                    alt="NFT Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="nft-name" className="block text-sm font-medium mb-2 text-amber-400">
                    NFT Name:
                  </label>
                  <input
                    id="nft-name"
                    type="text"
                    value={nftName}
                    onChange={(e) => setNftName(e.target.value)}
                    placeholder="My Amazing NFT"
                    className="input w-full"
                  />
                </div>

                <div>
                  <label htmlFor="nft-description" className="block text-sm font-medium mb-2 text-amber-400">
                    Description:
                  </label>
                  <textarea
                    id="nft-description"
                    value={nftDescription}
                    onChange={(e) => setNftDescription(e.target.value)}
                    placeholder="A unique digital artwork..."
                    className="input w-full resize-none"
                    rows={4}
                  />
                </div>

                <div className="card p-4">
                  <h4 className="font-bold mb-2 text-amber-400">Minting Details</h4>
                  <div className="space-y-2 text-sm text-amber-300">
                    <div className="flex justify-between">
                      <span>Blockchain:</span>
                      <span className="text-green-400">Monad Testnet</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Standard:</span>
                      <span className="text-green-400">ERC721</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Storage:</span>
                      <span className="text-green-400">IPFS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mint Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleMint}
              disabled={!nftName || !nftDescription || isMinting || isWritePending || isConfirming}
              className={`w-full py-4 px-6 rounded-lg transition-all flex items-center justify-center space-x-2 ${
                !nftName || !nftDescription || isMinting || isWritePending || isConfirming
                  ? 'btn-secondary opacity-50 cursor-not-allowed'
                  : 'btn-primary'
              }`}
            >
              {(isMinting || isWritePending || isConfirming) ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>
                    {isMinting ? 'Uploading to IPFS...' :
                     isWritePending ? 'Confirm in Wallet...' :
                     isConfirming ? 'Minting NFT...' : 'Processing...'}
                  </span>
                </>
              ) : (
                <>
                  <Coins className="h-5 w-5" />
                  <span>Mint NFT</span>
                </>
              )}
            </motion.button>

            {/* Info */}
            <div className="text-center text-sm text-amber-400">
              <p>Upload → IPFS → Mint to Blockchain</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}