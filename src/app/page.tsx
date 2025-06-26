'use client'

import { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import { Palette, Sparkles, Coins, Image as ImageIcon, Play } from 'lucide-react'
import { ArtGenerator } from '@/components/ArtGenerator'
import { NFTMinter } from '@/components/NFTMinter'
import { Gallery } from '@/components/Gallery'

export default function Home() {
  const { isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'generate' | 'mint' | 'gallery'>('generate')
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [demoMode, setDemoMode] = useState(false)

  // Listen for tab switch events from child components
  useEffect(() => {
    const handleTabSwitch = (event: CustomEvent) => {
      setActiveTab(event.detail)
    }

    window.addEventListener('switchTab', handleTabSwitch as EventListener)
    return () => {
      window.removeEventListener('switchTab', handleTabSwitch as EventListener)
    }
  }, [])

  const isWalletConnectedOrDemo = isConnected || demoMode

  return (
    <div className="min-h-screen text-white pt-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-700 backdrop-blur-sm bg-slate-900/90">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="relative">
              <svg className="h-12 w-12 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.54 0 3-.35 4.31-.99.19-.09.29-.29.29-.51 0-.22-.1-.42-.29-.51C15.65 19.65 15 18.9 15 18c0-.83.67-1.5 1.5-1.5S18 17.17 18 18c0 .9-.65 1.65-1.31 1.99C17.65 19.65 18 18.9 18 18c0-1.1-.9-2-2-2s-2 .9-2 2c0 .9.65 1.65 1.31 1.99-.66.34-1.31.59-1.31.99 0 .22.1.42.29.51C15.65 21.65 16 21.9 16 22c0 .55-.45 1-1 1s-1-.45-1-1c0-.1.02-.19.05-.28C13.02 21.91 12.51 22 12 22c-5.52 0-10-4.48-10-10S6.48 2 12 2zm0 2c-4.41 0-8 3.59-8 8 0 1.82.61 3.5 1.64 4.84.3-.71.98-1.21 1.78-1.21.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5c-.8 0-1.48-.5-1.78-1.21C4.61 15.5 4 13.82 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 .9-.15 1.77-.43 2.58.28-.35.43-.79.43-1.25 0-.83-.67-1.5-1.5-1.5S17 12.5 17 13.33c0 .46.15.9.43 1.25C17.85 13.77 18 12.9 18 12c0-3.31-2.69-6-6-6z"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <circle cx="15.5" cy="8.5" r="1.5"/>
                <circle cx="12" cy="12" r="1.5"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gradient glitch" data-text="AIrtist">
              AIrtist
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            {demoMode && (
              <div className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-lg text-sm border border-amber-400">
                Demo Mode
              </div>
            )}
            <ConnectButton />
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center relative vintage-texture">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4"
        >
          <h2 className="text-6xl md:text-8xl font-bold mb-6 text-gradient fade-in-up" data-text="AIrtist Art">
            AIrtist Art
          </h2>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-4xl mx-auto fade-in-up">
            AI-Powered Digital Art Creation Platform
          </p>
          <p className="text-lg text-slate-400 mb-12 max-w-3xl mx-auto fade-in-up">
            Transform your imagination into unique digital masterpieces with artificial intelligence
          </p>
          
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3 card px-6 py-4 glow-hover"
            >
              <Sparkles className="h-7 w-7 text-amber-400" />
              <span className="text-slate-300">AI Studio</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3 card px-6 py-4 glow-hover"
            >
              <Coins className="h-7 w-7 text-emerald-400" />
              <span className="text-slate-300">Blockchain</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3 card px-6 py-4 glow-hover"
            >
              <ImageIcon className="h-7 w-7 text-violet-400" />
              <span className="text-slate-300">NFT Minting</span>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Main Content */}
      {isWalletConnectedOrDemo ? (
        <section className="container mx-auto px-4 pb-20">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="card p-2 flex space-x-2">
              {[
                { id: 'generate', label: 'AI Studio', icon: Sparkles },
                { id: 'mint', label: 'Quick Mint', icon: Coins },
                { id: 'gallery', label: 'Gallery', icon: ImageIcon }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-md transition-all font-mono ${
                    activeTab === id
                      ? 'btn-primary glow'
                      : 'btn-secondary glow-hover'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'generate' && (
              <ArtGenerator
                onImagesGenerated={setGeneratedImages}
                generatedImages={generatedImages}
              />
            )}
            {activeTab === 'mint' && (
              <NFTMinter generatedImages={generatedImages} />
            )}
            {activeTab === 'gallery' && (
              <Gallery />
            )}
          </motion.div>
        </section>
      ) : (
        <section className="container mx-auto px-4 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-12 max-w-lg mx-auto relative"
          >
            <div className="relative mx-auto mb-6 w-20 h-20">
              <Palette className="h-20 w-20 text-amber-500" />
            </div>
            <h3 className="text-3xl font-bold mb-4 text-gradient">
              Connect Wallet
            </h3>
            <p className="text-slate-300 mb-6">
              Connect your wallet to start creating and minting NFTs
            </p>
            <p className="text-slate-400 mb-8 text-sm">
              Required for blockchain operations
            </p>
            
            <div className="space-y-6">
              <ConnectButton />
              
              <div className="flex items-center space-x-4">
                <div className="flex-1 h-px bg-cyan-400"></div>
                <span className="text-slate-400 text-sm">OR</span>
                <div className="flex-1 h-px bg-cyan-400"></div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDemoMode(true)}
                className="w-full btn-secondary flex items-center justify-center space-x-2"
              >
                <Play className="h-5 w-5" />
                <span>Demo Mode</span>
              </motion.button>
              
              <p className="text-xs text-slate-400">
                Demo mode: Test AI generation without wallet connection
              </p>
            </div>
          </motion.div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8 text-center text-slate-300 bg-slate-900/60">
        <div className="container mx-auto px-4">
          <p className="text-slate-400">© 2025 AIrtist | AI-Powered NFT Platform | Monad Blockchain</p>
          <div className="mt-4 flex justify-center space-x-8 text-sm">
            <span className="text-amber-400">AI Studio</span>
            <span className="text-emerald-400">Monad Testnet</span>
            <span className="text-violet-400">NFT Minting</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            System status: Operational | AI services: Active | Blockchain: Connected
          </div>
        </div>
      </footer>
    </div>
  )
}
