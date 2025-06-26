import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbi } from 'viem'
import { monadTestnet } from '@/lib/config'
import { CONTRACTS, FACTORY_ABI, COLLECTION_ABI } from '@/lib/contracts'

// Rate limiting helper
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Retry wrapper for contract calls
async function retryContractCall<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fn()
      return result
    } catch (error: any) {
      if (error?.details?.includes('request limit reached') || error?.status === 429) {
        console.log(`Rate limit hit, retrying in ${delayMs}ms... (attempt ${i + 1}/${maxRetries})`)
        if (i < maxRetries - 1) {
          await delay(delayMs * (i + 1)) // Exponential backoff
          continue
        }
      }
      if (i === maxRetries - 1) {
        console.error('Max retries reached:', error)
        return null
      }
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { userAddress } = await request.json()
    
    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'User address is required' },
        { status: 400 }
      )
    }
    
    console.log('Blockchain\'den kullanıcı verileri yükleniyor:', userAddress)
    
    // Viem client oluştur
    const client = createPublicClient({
      chain: monadTestnet,
      transport: http()
    })
    
    const collections = []
    const nfts = []
    
    try {
      // Factory contract'tan kullanıcının koleksiyonlarını al
      const userCollectionIds = await retryContractCall(async () => {
        return await client.readContract({
          address: CONTRACTS.FACTORY_ADDRESS,
          abi: FACTORY_ABI,
          functionName: 'getCreatorCollections',
          args: [userAddress]
        }) as bigint[]
      })
      
      if (!userCollectionIds) {
        console.log('Kullanıcı koleksiyonları alınamadı')
        return NextResponse.json({
          success: true,
          collections: [],
          nfts: [],
          message: 'Koleksiyonlar yüklenemedi (rate limit)'
        })
      }
      
      console.log('Kullanıcı koleksiyon ID\'leri:', userCollectionIds)
      
      // Her koleksiyon için detayları al (rate limiting ile)
      for (let i = 0; i < userCollectionIds.length; i++) {
        const collectionId = userCollectionIds[i]
        
        // Rate limiting için delay ekle
        if (i > 0) {
          await delay(500) // 500ms delay between calls
        }
        
        try {
          const collectionInfo = await retryContractCall(async () => {
            return await client.readContract({
              address: CONTRACTS.FACTORY_ADDRESS,
              abi: FACTORY_ABI,
              functionName: 'getCollection',
              args: [collectionId]
            }) as any
          })
          
          if (!collectionInfo) {
            console.log(`Koleksiyon ${collectionId} bilgisi alınamadı (rate limit)`)
            continue
          }
          
          if (collectionInfo && collectionInfo.contractAddress) {
            const collection = {
              id: Number(collectionId),
              contractAddress: collectionInfo.contractAddress,
              name: collectionInfo.name,
              symbol: collectionInfo.symbol,
              description: collectionInfo.description,
              creator: collectionInfo.creator,
              maxSupply: Number(collectionInfo.maxSupply),
              mintPrice: collectionInfo.mintPrice.toString(),
              createdAt: Number(collectionInfo.createdAt),
              isActive: collectionInfo.isActive,
              currentSupply: 0
            }
            
            collections.push(collection)
            
            // Bu koleksiyondaki NFT'leri al
            try {
              await delay(300) // Additional delay before totalSupply call
              
              const totalSupply = await retryContractCall(async () => {
                return await client.readContract({
                  address: collectionInfo.contractAddress,
                  abi: COLLECTION_ABI,
                  functionName: 'totalSupply',
                  args: []
                }) as bigint
              })
              
              if (!totalSupply) {
                console.log(`Total supply alınamadı: ${collectionInfo.contractAddress}`)
                collection.currentSupply = 0
              } else {
                collection.currentSupply = Number(totalSupply)
                
                // Her NFT için metadata al (maksimum 3 NFT ile sınırla rate limit için)
                const maxNFTs = Math.min(Number(totalSupply), 3)
                for (let tokenId = 1; tokenId <= maxNFTs; tokenId++) {
                  await delay(400) // Delay between token calls
                  
                  try {
                    const tokenURI = await retryContractCall(async () => {
                      return await client.readContract({
                        address: collectionInfo.contractAddress,
                        abi: COLLECTION_ABI,
                        functionName: 'tokenURI',
                        args: [BigInt(tokenId)]
                      }) as string
                    })
                    
                    if (!tokenURI) {
                      console.log(`Token ${tokenId} URI alınamadı`)
                      continue
                    }
                  
                  // IPFS metadata'sını al
                  let metadata = null
                  let imageUrl = ''
                  
                  if (tokenURI) {
                    try {
                      const metadataResponse = await fetch(tokenURI)
                      if (metadataResponse.ok) {
                        metadata = await metadataResponse.json()
                        imageUrl = metadata.image || ''
                      }
                    } catch (metadataError) {
                      console.error('Metadata yükleme hatası:', metadataError)
                    }
                  }
                  
                  const nft = {
                    id: `${collectionInfo.contractAddress}-${tokenId}`,
                    name: metadata?.name || `${collection.name} #${tokenId}`,
                    description: metadata?.description || collection.description,
                    image: imageUrl,
                    tokenId: tokenId.toString(),
                    contractAddress: collectionInfo.contractAddress,
                    collectionId: Number(collectionId),
                    owner: userAddress,
                    metadata: metadata,
                    createdAt: new Date(Number(collectionInfo.createdAt) * 1000).toISOString(),
                    likes: 0,
                    views: 0,
                    explorerUrl: `https://testnet.monadexplorer.com/token/${collectionInfo.contractAddress}?a=${tokenId}`
                  }
                  
                  nfts.push(nft)
                  
                 } catch (tokenError) {
                   console.error(`Token ${tokenId} bilgisi alınamadı:`, tokenError)
                 }
               }
             }
              
           } catch (supplyError) {
             console.error('Total supply alınamadı:', supplyError)
           }
          }
          
        } catch (collectionError) {
          console.error(`Koleksiyon ${collectionId} bilgisi alınamadı:`, collectionError)
        }
      }
      
    } catch (factoryError) {
      console.error('Factory contract\'tan veri alınamadı:', factoryError)
    }
    
    console.log(`Blockchain\'den yüklendi: ${collections.length} koleksiyon, ${nfts.length} NFT`)
    
    return NextResponse.json({
      success: true,
      collections,
      nfts,
      message: `${collections.length} koleksiyon ve ${nfts.length} NFT yüklendi`
    })
    
  } catch (error) {
    console.error('Blockchain veri yükleme hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Blockchain veri yükleme başarısız' },
      { status: 500 }
    )
  }
}