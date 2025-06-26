'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { ExternalLink, Eye, Heart, Share2, Download, Database } from 'lucide-react'
import { useNFT } from '@/contexts/NFTContext'

interface NFT {
  id: string
  name: string
  description: string
  image: string
  tokenId: string
  owner: string
  createdAt?: string
  mintedAt?: string
  likes?: number
  views?: number
  metadata?: any
  ipfsHash?: string
  contractAddress?: string
  transactionHash?: string
  explorerUrl?: string
}

export function Gallery() {
  const { address, isConnected } = useAccount()
  const { getUserNFTs } = useNFT()
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load NFTs from context
    const loadNFTs = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for UX
      
      if (address) {
        const userNFTs = getUserNFTs(address)
        setNfts(userNFTs)
      } else {
        setNfts([])
      }
      
      setLoading(false)
    }
    
    loadNFTs()
  }, [address, getUserNFTs])

  const handleLike = (nftId: string) => {
    setNfts(prev => prev.map(nft =>
      nft.id === nftId
        ? { ...nft, likes: (nft.likes || 0) + 1 }
        : nft
    ))
  }

  const handleShare = (nft: NFT) => {
    if (navigator.share) {
      navigator.share({
        title: nft.name,
        text: nft.description,
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const downloadNFTData = (nft: NFT) => {
    const data = {
      metadata: nft.metadata,
      tokenId: nft.tokenId,
      owner: nft.owner,
      ipfsHash: nft.ipfsHash,
      image: nft.image,
      contractAddress: nft.contractAddress,
      transactionHash: nft.transactionHash,
      explorerUrl: nft.explorerUrl,
      mintedAt: nft.mintedAt,
      downloadedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${nft.name.replace(/\s+/g, '_')}_NFT_data.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-12"
        >
          <Database className="h-16 w-16 text-cyan-400 mx-auto mb-6 glow" />
          <h3 className="text-3xl font-bold mb-4 text-gradient glitch font-mono" data-text="[ACCESS_DENIED]">
            [ACCESS_DENIED]
          </h3>
          <p className="text-cyan-300 font-mono">
            &gt; Neural link required to access personal NFT vault
          </p>
          <p className="text-green-400 font-mono mt-2">
            &gt; Connect wallet to view your digital artifacts
          </p>
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto text-center py-20">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-cyan-300 font-mono">&gt; Loading neural vault...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-gradient glitch font-mono mb-4" data-text="[NEURAL_VAULT]">
          [NEURAL_VAULT]
        </h1>
        <p className="text-cyan-300 font-mono">
          &gt; Your personal collection of digital chaos artifacts
        </p>
        <div className="text-sm text-green-400 font-mono mt-2">
          &gt; Wallet: {address?.slice(0, 6)}...{address?.slice(-4)} | NFTs: [{nfts.length}]
        </div>
      </motion.div>

      {/* NFT Grid */}
      {nfts.length === 0 ? (
        <div className="text-center py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-12 max-w-md mx-auto"
          >
            <Eye className="h-16 w-16 text-cyan-400 mx-auto mb-6 glow" />
            <h3 className="text-2xl font-bold mb-4 text-gradient font-mono">
              [VAULT_EMPTY]
            </h3>
            <p className="text-cyan-300 font-mono mb-4">
              &gt; No digital artifacts detected in neural vault
            </p>
            <p className="text-green-400 font-mono text-sm">
              &gt; Generate chaos and mint your first NFT to populate vault
            </p>
          </motion.div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {nfts.map((nft, index) => (
            <motion.div
              key={nft.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card p-6 group relative"
            >
              {/* NFT Image */}
              <div className="aspect-square relative overflow-hidden rounded-lg mb-4 border-2 border-cyan-400">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Download button */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => downloadNFTData(nft)}
                    className="btn-secondary p-2 rounded-full glow-hover"
                    title="Download NFT Data"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* NFT Info */}
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-pink-400 font-mono mb-1">
                      [{nft.name}]
                    </h3>
                    <p className="text-xs text-cyan-400 font-mono">
                      TOKEN_ID: #{nft.tokenId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-cyan-400 font-mono">OWNER</p>
                    <p className="text-sm font-mono text-green-400">
                      [YOU]
                    </p>
                  </div>
                </div>

                <p className="text-green-400 text-sm mb-4 font-mono line-clamp-2">
                  &gt; {nft.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-cyan-400 mb-4 font-mono">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{nft.views || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4" />
                      <span>{nft.likes || 0}</span>
                    </div>
                  </div>
                  <span>{nft.mintedAt ? new Date(nft.mintedAt).toLocaleDateString() : nft.createdAt}</span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleLike(nft.id)}
                    className="flex-1 btn-secondary py-2 px-3 rounded-lg flex items-center justify-center space-x-1"
                  >
                    <Heart className="h-4 w-4" />
                    <span className="text-xs">LIKE</span>
                  </button>
                  <button
                    onClick={() => handleShare(nft)}
                    className="flex-1 btn-secondary py-2 px-3 rounded-lg flex items-center justify-center space-x-1"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="text-xs">SHARE</span>
                  </button>
                  <a
                    href={nft.explorerUrl || `https://testnet.monadexplorer.com/token/${nft.contractAddress}?a=${nft.tokenId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary py-2 px-3 rounded-lg flex items-center justify-center glow-hover"
                    title="View on Monad Explorer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-6 mt-8"
      >
        <h3 className="text-lg font-bold mb-3 text-gradient font-mono">[VAULT_FEATURES]</h3>
        <div className="space-y-2 text-sm text-cyan-400 font-mono">
          <p>&gt; [PERSONAL_COLLECTION]: Only your minted NFTs are displayed</p>
          <p>&gt; [DATA_EXPORT]: Download complete metadata and IPFS data</p>
          <p>&gt; [BLOCKCHAIN_VERIFIED]: All NFTs verified on Monad testnet</p>
          <p>&gt; [SOCIAL_FEATURES]: Like, share, and track engagement</p>
          <p>&gt; [EXPLORER_INTEGRATION]: Direct links to blockchain explorer</p>
        </div>
      </motion.div>
    </div>
  )
}