'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  tokenId?: string | number;
  contractAddress?: string;
  collectionId?: number;
  owner?: string;
  transactionHash?: string;
  metadata?: any;
  ipfsHash?: string;
  createdAt: string;
  likes?: number;
  views?: number;
  explorerUrl?: string;
}

export interface Collection {
  id: number;
  contractAddress: string;
  name: string;
  symbol: string;
  description: string;
  creator: string;
  maxSupply: number;
  mintPrice: string;
  createdAt: number;
  isActive: boolean;
  currentSupply?: number;
  isComplete?: boolean;
}

interface NFTContextType {
  nfts: NFT[];
  collections: Collection[];
  addNFT: (nft: NFT) => void;
  removeNFT: (id: string) => void;
  clearNFTs: () => void;
  addCollection: (collection: Collection) => void;
  updateCollection: (id: number, updates: Partial<Collection>) => void;
  getCollectionById: (id: number) => Collection | undefined;
  getCollectionByAddress: (address: string) => Collection | undefined;
  getUserCollections: (userAddress: string) => Collection[];
  getUserNFTs: (userAddress: string) => NFT[];
  updateNFT: (id: string, updates: Partial<NFT>) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  loadUserDataFromBlockchain: (userAddress: string) => Promise<void>;
  syncWithBlockchain: (userAddress: string) => Promise<void>;
}

const NFTContext = createContext<NFTContextType | undefined>(undefined);

export function NFTProvider({ children }: { children: ReactNode }) {
  const [nfts, setNFTs] = useState<NFT[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedNFTs = localStorage.getItem('user-nfts');
    const savedCollections = localStorage.getItem('user-collections');
    
    if (savedNFTs) {
      try {
        setNFTs(JSON.parse(savedNFTs));
      } catch (error) {
        console.error('Error loading NFTs from localStorage:', error);
      }
    }
    
    if (savedCollections) {
      try {
        setCollections(JSON.parse(savedCollections));
      } catch (error) {
        console.error('Error loading collections from localStorage:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('user-nfts', JSON.stringify(nfts));
  }, [nfts]);

  useEffect(() => {
    localStorage.setItem('user-collections', JSON.stringify(collections));
  }, [collections]);

  const addNFT = (nft: NFT) => {
    setNFTs(prev => [nft, ...prev]);
  };

  const removeNFT = (id: string) => {
    setNFTs(prev => prev.filter(nft => nft.id !== id));
  };

  const clearNFTs = () => {
    setNFTs([]);
    localStorage.removeItem('user-nfts');
  };

  const addCollection = (collection: Collection) => {
    setCollections(prev => [collection, ...prev]);
  };

  const updateCollection = (id: number, updates: Partial<Collection>) => {
    setCollections(prev => 
      prev.map(collection => 
        collection.id === id 
          ? { ...collection, ...updates }
          : collection
      )
    );
  };

  const getCollectionById = (id: number): Collection | undefined => {
    return collections.find(collection => collection.id === id);
  };

  const getCollectionByAddress = (address: string): Collection | undefined => {
    return collections.find(collection => 
      collection.contractAddress.toLowerCase() === address.toLowerCase()
    );
  };

  const getUserCollections = (userAddress: string): Collection[] => {
    return collections.filter(collection =>
      collection.creator.toLowerCase() === userAddress.toLowerCase()
    );
  };

  const getUserNFTs = (userAddress: string): NFT[] => {
    return nfts.filter(nft =>
      nft.owner?.toLowerCase() === userAddress.toLowerCase()
    );
  };

  const updateNFT = (id: string, updates: Partial<NFT>) => {
    setNFTs(prev =>
      prev.map(nft =>
        nft.id === id
          ? { ...nft, ...updates }
          : nft
      )
    );
  };

  // Blockchain'den kullanıcı verilerini yükle
  const loadUserDataFromBlockchain = async (userAddress: string) => {
    try {
      setLoading(true);
      console.log('Blockchain\'den kullanıcı verileri yükleniyor...', userAddress);
      
      // API endpoint'i çağır
      const response = await fetch('/api/load-user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userAddress })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Blockchain'den gelen verileri context'e ekle
        if (data.collections && data.collections.length > 0) {
          setCollections(prev => {
            const newCollections = data.collections.filter((newCol: Collection) =>
              !prev.some(existingCol => existingCol.contractAddress === newCol.contractAddress)
            );
            return [...prev, ...newCollections];
          });
        }
        
        if (data.nfts && data.nfts.length > 0) {
          setNFTs(prev => {
            const newNFTs = data.nfts.filter((newNFT: NFT) =>
              !prev.some(existingNFT => existingNFT.id === newNFT.id)
            );
            return [...prev, ...newNFTs];
          });
        }
        
        console.log('Blockchain veriler başarıyla yüklendi');
      }
    } catch (error) {
      console.error('Blockchain veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Blockchain ile senkronize et
  const syncWithBlockchain = async (userAddress: string) => {
    try {
      console.log('Blockchain ile senkronizasyon başlatılıyor...', userAddress);
      await loadUserDataFromBlockchain(userAddress);
    } catch (error) {
      console.error('Blockchain senkronizasyon hatası:', error);
    }
  };

  return (
    <NFTContext.Provider value={{
      nfts,
      collections,
      addNFT,
      removeNFT,
      clearNFTs,
      addCollection,
      updateCollection,
      getCollectionById,
      getCollectionByAddress,
      getUserCollections,
      getUserNFTs,
      updateNFT,
      loading,
      setLoading,
      loadUserDataFromBlockchain,
      syncWithBlockchain
    }}>
      {children}
    </NFTContext.Provider>
  );
}

export function useNFT() {
  const context = useContext(NFTContext);
  if (context === undefined) {
    throw new Error('useNFT must be used within an NFTProvider');
  }
  return context;
}