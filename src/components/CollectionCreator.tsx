'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { motion } from 'framer-motion'
import { Plus, X, Download, Zap, Palette } from 'lucide-react'
import { CONTRACTS, FACTORY_ABI } from '@/lib/contracts'
import { useNFT } from '@/contexts/NFTContext'

interface NFT {
  id: number
  metadata: {
    name: string
    description: string
    image: string
    attributes: Array<{
      trait_type: string
      value: string
    }>
  }
  imageData: string
  prompt: string
  service: string
}

interface GeneratedCollection {
  name: string
  description: string
  totalGenerated: number
  requestedQuantity: number
  basePrompt: string
  nfts: NFT[]
}

export default function CollectionCreator() {
  const { address, isConnected } = useAccount()
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })
  const { addCollection } = useNFT()
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [generatedCollection, setGeneratedCollection] = useState<GeneratedCollection | null>(null)
  const [mintingProgress, setMintingProgress] = useState(0)
  
  // Form state
  const [formData, setFormData] = useState({
    collectionName: '',
    collectionSymbol: '',
    collectionDescription: '',
    basePrompt: '',
    quantity: 5,
    mintPrice: '0.001',
    variations: [] as string[]
  })

  const [newVariation, setNewVariation] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value
    }))
  }

  const addVariation = () => {
    if (newVariation.trim() && formData.variations.length < 20) {
      setFormData(prev => ({
        ...prev,
        variations: [...prev.variations, newVariation.trim()]
      }))
      setNewVariation('')
    }
  }

  const removeVariation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.filter((_, i) => i !== index)
    }))
  }

  const generateCollection = async () => {
    if (!formData.collectionName || !formData.basePrompt) {
      alert('Please fill in collection name and base prompt')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      
      if (result.success) {
        setGeneratedCollection(result.collection)
        console.log('Collection generated successfully:', result.collection)
      } else {
        alert(`Failed to generate collection: ${result.error}`)
      }
    } catch (error) {
      console.error('Error generating collection:', error)
      alert('Failed to generate collection')
    } finally {
      setIsGenerating(false)
    }
  }

  const createCollectionOnChain = async () => {
    if (!generatedCollection || !isConnected || !address) return

    try {
      setIsMinting(true)
      setMintingProgress(0)

      // Create collection using Factory contract
      const result = await writeContract({
        address: CONTRACTS.FACTORY_ADDRESS as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: 'createCollection',
        args: [
          generatedCollection.name,
          formData.collectionSymbol || 'ART',
          generatedCollection.description || '',
          BigInt(generatedCollection.totalGenerated),
          parseEther(formData.mintPrice)
        ],
        value: parseEther(CONTRACTS.CREATION_FEE)
      })

      console.log('Collection creation transaction:', result)
      
    } catch (error) {
      console.error('Error creating collection:', error)
      alert('Failed to create collection on blockchain')
      setIsMinting(false)
    }
  }

  // Handle transaction confirmation
  if (isConfirmed && isMinting && hash) {
    // Parse transaction receipt to get collection address
    const handleVerification = async () => {
      try {
        console.log('Transaction confirmed:', hash);
        
        // Call verification API with transaction hash
        const verifyResponse = await fetch('/api/verify-collection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactionHash: hash
          })
        });
        
        const verifyResult = await verifyResponse.json();
        
        if (verifyResult.success && verifyResult.contractAddress) {
          // Add collection to context with real data
          const newCollection = {
            id: Date.now(), // Use timestamp as ID for now
            contractAddress: verifyResult.contractAddress,
            name: verifyResult.name || generatedCollection?.name || '',
            symbol: formData.collectionSymbol || 'ART',
            description: generatedCollection?.description || '',
            creator: verifyResult.creator || address || '',
            maxSupply: generatedCollection?.totalGenerated || 0,
            mintPrice: formData.mintPrice,
            createdAt: Date.now(),
            isActive: true
          };
          
          addCollection(newCollection);
          
          alert(`Collection created and verified successfully!\nContract: ${verifyResult.contractAddress}\nExplorer: ${verifyResult.explorerUrl}`);
        } else {
          // Collection was created but verification failed
          alert(`Collection created but verification failed.\nTransaction: ${hash}\nYou can verify manually later.`);
        }
      } catch (error) {
        console.error('Verification error:', error);
        alert(`Collection created but verification failed.\nTransaction: ${hash}\nYou can verify manually later.`);
      } finally {
        setIsMinting(false);
      }
    };
    
    handleVerification();
  }

  const downloadNFTData = (nft: NFT) => {
    const data = {
      metadata: nft.metadata,
      imageData: nft.imageData,
      prompt: nft.prompt,
      service: nft.service
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${nft.metadata.name.replace(/\s+/g, '_')}_metadata.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadCollectionData = () => {
    if (!generatedCollection) return
    
    const data = {
      collection: generatedCollection,
      downloadedAt: new Date().toISOString(),
      totalNFTs: generatedCollection.nfts.length
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${generatedCollection.name.replace(/\s+/g, '_')}_collection.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent font-serif mb-4">
          Collection Studio
        </h1>
        <p className="text-amber-300/80">
          Create unique NFT collections with AI-powered generation
        </p>
      </motion.div>

      {/* Collection Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 backdrop-blur-sm border border-amber-500/20 rounded-xl p-8"
      >
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Collection Parameters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-amber-400">
              Collection Name
            </label>
            <input
              type="text"
              name="collectionName"
              value={formData.collectionName}
              onChange={handleInputChange}
              placeholder="My Art Collection"
              className="w-full px-4 py-3 bg-slate-900/50 border border-amber-500/30 rounded-lg text-white placeholder-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-amber-400">
              Symbol
            </label>
            <input
              type="text"
              name="collectionSymbol"
              value={formData.collectionSymbol}
              onChange={handleInputChange}
              placeholder="ART"
              className="w-full px-4 py-3 bg-slate-900/50 border border-amber-500/30 rounded-lg text-white placeholder-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-amber-400">
              Quantity (1-100)
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="1"
              max="100"
              className="w-full px-4 py-3 bg-slate-900/50 border border-amber-500/30 rounded-lg text-white placeholder-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-amber-400">
              Mint Price (MON)
            </label>
            <input
              type="text"
              name="mintPrice"
              value={formData.mintPrice}
              onChange={handleInputChange}
              placeholder="0.001"
              className="w-full px-4 py-3 bg-slate-900/50 border border-amber-500/30 rounded-lg text-white placeholder-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium mb-2 text-amber-400">
            Collection Description
          </label>
          <textarea
            name="collectionDescription"
            value={formData.collectionDescription}
            onChange={handleInputChange}
            placeholder="A unique collection of AI-generated digital art..."
            rows={3}
            className="w-full px-4 py-3 bg-slate-900/50 border border-amber-500/30 rounded-lg text-white placeholder-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all resize-none"
          />
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium mb-2 text-amber-400">
            Base AI Prompt
          </label>
          <textarea
            name="basePrompt"
            value={formData.basePrompt}
            onChange={handleInputChange}
            placeholder="digital art, abstract painting, vibrant colors..."
            rows={3}
            className="w-full px-4 py-3 bg-slate-900/50 border border-amber-500/30 rounded-lg text-white placeholder-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all resize-none"
          />
        </div>

        {/* Variations */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-2 text-amber-400">
            Style Variations (Optional)
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newVariation}
              onChange={(e) => setNewVariation(e.target.value)}
              placeholder="watercolor style, oil painting, digital art..."
              className="flex-1 px-4 py-3 bg-slate-900/50 border border-amber-500/30 rounded-lg text-white placeholder-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
              onKeyPress={(e) => e.key === 'Enter' && addVariation()}
            />
            <button
              onClick={addVariation}
              className="px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {formData.variations.map((variation, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/50 text-amber-300 rounded-lg text-sm"
              >
                {variation}
                <button
                  onClick={() => removeVariation(index)}
                  className="text-amber-400 hover:text-amber-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateCollection}
            disabled={isGenerating || !formData.collectionName || !formData.basePrompt}
            className={`w-full py-4 rounded-lg transition-all flex items-center justify-center space-x-2 ${
              isGenerating || !formData.collectionName || !formData.basePrompt
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-amber-500/25'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Generating Collection...</span>
              </>
            ) : (
              <>
                <Palette className="h-5 w-5" />
                <span>Generate Collection</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Generated Collection Display */}
      {generatedCollection && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-amber-500/20 rounded-xl p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              {generatedCollection.name}
            </h2>
            <div className="text-sm text-amber-400">
              {generatedCollection.totalGenerated}/{generatedCollection.requestedQuantity} Generated
            </div>
          </div>

          <p className="text-gray-300 mb-6">
            {generatedCollection.description}
          </p>

          {/* Collection Actions */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={createCollectionOnChain}
              disabled={!isConnected || isMinting || isPending || isConfirming}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-3 rounded-lg transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="h-4 w-4" />
              <span>
                {isPending || isConfirming ? 'Creating...' : 'Deploy to Monad'}
              </span>
            </button>
            
            <button
              onClick={downloadCollectionData}
              className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg transition-all flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download All Data</span>
            </button>
            
            <div className="text-sm text-amber-400 flex items-center">
              Creation Fee: {CONTRACTS.CREATION_FEE} MON
            </div>
          </div>

          {/* NFT Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {generatedCollection.nfts.map((nft, index) => (
              <motion.div 
                key={nft.id} 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-900/50 border border-amber-500/20 rounded-xl p-4 relative group"
              >
                <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-black border border-amber-500/30">
                  <img
                    src={nft.imageData}
                    alt={nft.metadata.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => downloadNFTData(nft)}
                    className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-full"
                    title="Download NFT Data"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
                
                <h3 className="font-bold text-sm mb-2 text-amber-400">
                  {nft.metadata.name}
                </h3>
                
                <div className="space-y-1 text-xs text-gray-400">
                  {nft.metadata.attributes.slice(0, 3).map((attr, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{attr.trait_type}:</span>
                      <span className="text-amber-400">{attr.value}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 text-xs text-gray-500">
                  Generated by {nft.service}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Info Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800/50 backdrop-blur-sm border border-amber-500/20 rounded-xl p-6"
      >
        <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">How It Works</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p>1. <span className="text-amber-400">Define Parameters:</span> Set collection name, description, and AI prompts</p>
          <p>2. <span className="text-amber-400">Add Variations:</span> Specify different styles for unique results</p>
          <p>3. <span className="text-amber-400">Generate Collection:</span> AI creates unique digital artworks</p>
          <p>4. <span className="text-amber-400">Deploy to Monad:</span> Create your own NFT contract on blockchain</p>
          <p>5. <span className="text-amber-400">Download Data:</span> Export metadata, IPFS data, and all assets</p>
          <p>6. <span className="text-amber-400">Mint & Trade:</span> Your collection is ready for the marketplace!</p>
        </div>
      </motion.div>
    </div>
  )
}