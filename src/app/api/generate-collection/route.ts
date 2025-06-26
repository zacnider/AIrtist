import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const {
      basePrompt,
      name,
      description,
      quantity,
      variations,
      negativePrompt,
      // Also support old parameter names for backward compatibility
      collectionName,
      collectionDescription
    } = await request.json()

    // Use new parameter names, fallback to old ones
    const finalName = name || collectionName
    const finalDescription = description || collectionDescription

    if (!basePrompt || !finalName || !quantity) {
      return NextResponse.json(
        { success: false, error: 'Base prompt, collection name and quantity are required' },
        { status: 400 }
      )
    }

    if (quantity < 1 || quantity > 1000) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be between 1 and 1000' },
        { status: 400 }
      )
    }

    console.log(`Creating NFT collection: ${finalName}`)
    console.log(`Base prompt: ${basePrompt}`)
    console.log(`Quantity: ${quantity}`)

    const generatedNFTs = []
    const usedVariations = variations && variations.length > 0 ? variations : generateDefaultVariations()

    // Skip MCP Server batch generation (not available)
    // MCP Server doesn't support batch collection generation
    // Fall back to individual generation which works properly

    // Individual generation (fallback)
    console.log('Starting individual NFT generation...')
    
    // Generate each NFT in the collection
    for (let i = 0; i < quantity; i++) {
      try {
        console.log(`Generating NFT ${i + 1}/${quantity}...`)
        
        // Create unique prompt for this NFT
        const uniquePrompt = createUniquePrompt(basePrompt, usedVariations, i, quantity)
        console.log(`Unique prompt ${i + 1}: ${uniquePrompt}`)

        // Generate the image
        const imageResult = await generateSingleImage(uniquePrompt)
        
        if (imageResult.success) {
          // Create metadata for this NFT
          const metadata = {
            name: `${finalName} #${i + 1}`,
            description: finalDescription || `Part of the ${finalName} collection`,
            image: imageResult.imageData,
            attributes: [
              {
                trait_type: "Collection",
                value: finalName
              },
              {
                trait_type: "Edition",
                value: `${i + 1} / ${quantity}`
              },
              {
                trait_type: "Generation Method",
                value: imageResult.service || "AI Generated"
              },
              {
                trait_type: "Rarity",
                value: calculateRarity(i, quantity)
              }
            ],
            prompt: uniquePrompt,
            generatedAt: new Date().toISOString()
          }

          generatedNFTs.push({
            id: i + 1,
            metadata,
            imageData: imageResult.imageData,
            prompt: uniquePrompt,
            service: imageResult.service
          })

          console.log(`NFT ${i + 1}/${quantity} successfully generated`)
        } else {
          console.error(`NFT ${i + 1} generation failed:`, imageResult.error)
          // Continue to next NFT instead of failing entire collection
        }

        // Small delay to prevent rate limiting
        if (i < quantity - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }

      } catch (error) {
        console.error(`Error generating NFT ${i + 1}:`, error)
        // Continue to next NFT
      }
    }

    if (generatedNFTs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No NFTs could be generated in the collection' },
        { status: 500 }
      )
    }

    console.log(`Collection generation completed: ${generatedNFTs.length}/${quantity} NFTs generated`)

    return NextResponse.json({
      success: true,
      collection: {
        name: finalName,
        description: finalDescription,
        totalGenerated: generatedNFTs.length,
        requestedQuantity: quantity,
        basePrompt,
        nfts: generatedNFTs
      },
      message: `Generated ${generatedNFTs.length} NFTs for "${finalName}" collection`
    })

  } catch (error) {
    console.error('Error generating NFT collection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate NFT collection' },
      { status: 500 }
    )
  }
}

// MCP Server collection generation (disabled - using individual generation instead)
async function generateCollectionWithMCP(basePrompt: string, variations: string[], quantity: number, collectionName: string, collectionDescription?: string) {
  // MCP Server doesn't have batch collection generation, so we skip this
  // and fall back to individual generation which works properly
  return { success: false, error: 'MCP batch generation not available, using individual generation' }
}

// Generate a single image using the same logic as the main generate-art endpoint
async function generateSingleImage(prompt: string) {
  try {
    const enhancedPrompt = enhancePrompt(prompt)
    
    let imageData = null
    let service = 'unknown'

    // Check for valid API keys
    const hasValidHuggingFace = process.env.HUGGINGFACE_API_KEY &&
                               process.env.HUGGINGFACE_API_KEY !== 'your_huggingface_token_here' &&
                               process.env.HUGGINGFACE_API_KEY.startsWith('hf_')

    const hasValidReplicate = process.env.REPLICATE_API_TOKEN &&
                             process.env.REPLICATE_API_TOKEN !== 'your_replicate_token_here' &&
                             process.env.REPLICATE_API_TOKEN.startsWith('r8_')

    const hasValidOpenAI = process.env.OPENAI_API_KEY &&
                          process.env.OPENAI_API_KEY !== 'your_openai_key_here' &&
                          process.env.OPENAI_API_KEY.startsWith('sk-')

    const hasValidStability = process.env.STABILITY_API_KEY &&
                             process.env.STABILITY_API_KEY !== 'your_stability_key_here' &&
                             process.env.STABILITY_API_KEY.startsWith('sk-')

    // 1. Hugging Face SDXL (Primary)
    if (hasValidHuggingFace) {
      try {
        imageData = await generateWithHuggingFace(enhancedPrompt)
        service = 'Hugging Face SDXL'
        console.log('Image successfully generated with Hugging Face SDXL')
      } catch (error) {
        console.error('Hugging Face API failed:', error)
      }
    }

    // 2. Replicate SDXL (Secondary)
    if (!imageData && hasValidReplicate) {
      try {
        imageData = await generateWithReplicate(enhancedPrompt)
        service = 'Replicate SDXL'
        console.log('Image successfully generated with Replicate SDXL')
      } catch (error) {
        console.error('Replicate API failed:', error)
      }
    }

    // 3. MCP Server (Tertiary)
    if (!imageData) {
      try {
        const mcpResult = await generateWithMCPServer(enhancedPrompt)
        if (mcpResult.success) {
          imageData = mcpResult.imageData
          service = 'MCP Stable Diffusion'
          console.log('Image successfully generated with MCP Server')
        }
      } catch (error) {
        console.error('MCP Server failed:', error)
      }
    }

    // 4. OpenAI DALL-E 3 (Fallback)
    if (!imageData && hasValidOpenAI) {
      try {
        imageData = await generateWithOpenAI(enhancedPrompt)
        service = 'OpenAI DALL-E 3'
      } catch (error) {
        console.error('OpenAI API failed:', error)
      }
    }

    // 5. Stability AI (Fallback)
    if (!imageData && hasValidStability) {
      try {
        imageData = await generateWithStabilityAI(enhancedPrompt)
        service = 'Stability AI'
      } catch (error) {
        console.error('Stability AI failed:', error)
      }
    }

    // 6. Enhanced Pollinations (Fallback)
    if (!imageData) {
      try {
        imageData = await generateWithEnhancedPollinations(enhancedPrompt)
        service = 'Enhanced Pollinations AI'
      } catch (error) {
        console.error('Enhanced Pollinations AI failed:', error)
      }
    }

    // 7. Backup Pollinations (Last resort)
    if (!imageData) {
      try {
        imageData = await generateWithBackupPollinations(enhancedPrompt)
        service = 'Backup Pollinations AI'
      } catch (error) {
        console.error('Backup Pollinations AI failed:', error)
      }
    }

    if (imageData) {
      return { success: true, imageData, service, prompt: enhancedPrompt }
    } else {
      return { success: false, error: 'All image generation services failed' }
    }

  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Create unique prompts for each NFT in the collection
function createUniquePrompt(basePrompt: string, variations: string[], index: number, total: number): string {
  const variation = variations[index % variations.length]
  const uniqueElements = generateUniqueElements(index, total)
  
  return `${basePrompt}, ${variation}, ${uniqueElements}`
}

// Generate default variations if none provided
function generateDefaultVariations(): string[] {
  return [
    "vibrant colors, dynamic composition",
    "soft pastels, dreamy atmosphere",
    "bold contrasts, dramatic lighting",
    "warm tones, cozy feeling",
    "cool blues and purples, mystical",
    "golden hour lighting, magical",
    "neon accents, futuristic",
    "earth tones, natural",
    "monochromatic, artistic",
    "rainbow colors, playful",
    "dark and moody, mysterious",
    "bright and cheerful, uplifting",
    "vintage style, nostalgic",
    "modern minimalist, clean",
    "ornate details, decorative"
  ]
}

// Generate unique elements for each NFT
function generateUniqueElements(index: number, total: number): string {
  const elements = [
    "unique pattern", "special glow", "rare texture", "distinctive style",
    "exclusive design", "one-of-a-kind details", "signature elements", "custom features",
    "individual character", "personal touch", "unique perspective", "special effects",
    "rare combination", "exclusive palette", "distinctive mood"
  ]
  
  const rarity = calculateRarity(index, total)
  const element = elements[index % elements.length]
  
  return `${element}, ${rarity} rarity, edition ${index + 1} of ${total}`
}

// Calculate rarity based on position in collection
function calculateRarity(index: number, total: number): string {
  const position = (index + 1) / total
  
  if (position <= 0.01) return "Legendary"
  if (position <= 0.05) return "Epic"
  if (position <= 0.15) return "Rare"
  if (position <= 0.35) return "Uncommon"
  return "Common"
}

// Enhanced prompt function (same as main API)
function enhancePrompt(originalPrompt: string): string {
  const qualityTerms = [
    'masterpiece',
    'best quality', 
    'ultra detailed',
    'high resolution',
    '8k',
    'professional',
    'award winning',
    'stunning',
    'beautiful',
    'intricate details'
  ]

  let styleEnhancement = ''
  const promptLower = originalPrompt.toLowerCase()

  if (promptLower.includes('dragon') || promptLower.includes('fantasy')) {
    styleEnhancement = ', fantasy art, magical, epic, cinematic lighting, detailed scales, glowing eyes'
  } else if (promptLower.includes('cyberpunk') || promptLower.includes('neon')) {
    styleEnhancement = ', cyberpunk art, neon lights, futuristic cityscape, dark atmosphere, glowing signs, rain reflections'
  } else if (promptLower.includes('portrait') || promptLower.includes('face')) {
    styleEnhancement = ', portrait photography, detailed facial features, professional lighting, sharp focus'
  } else if (promptLower.includes('landscape') || promptLower.includes('mountain')) {
    styleEnhancement = ', landscape photography, dramatic lighting, vast scenery, detailed environment'
  } else if (promptLower.includes('abstract')) {
    styleEnhancement = ', abstract art, geometric patterns, vibrant colors, modern composition'
  } else if (promptLower.includes('realistic') || promptLower.includes('photo')) {
    styleEnhancement = ', photorealistic, detailed textures, natural lighting, high definition'
  } else {
    styleEnhancement = ', digital art, concept art, detailed illustration'
  }

  const enhanced = `${originalPrompt}${styleEnhancement}, ${qualityTerms.slice(0, 5).join(', ')}`
  return enhanced
}

// API generation functions (simplified versions)
async function generateWithReplicate(prompt: string): Promise<string> {
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      input: {
        prompt: prompt,
        negative_prompt: "blurry, low quality, distorted, deformed",
        width: 1024,
        height: 1024,
        num_inference_steps: 50,
        guidance_scale: 7.5,
        scheduler: "K_EULER"
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Replicate API error: ${response.statusText}`)
  }

  const prediction = await response.json()
  
  let result = prediction
  while (result.status === 'starting' || result.status === 'processing') {
    await new Promise(resolve => setTimeout(resolve, 1000))
    const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      }
    })
    result = await pollResponse.json()
  }

  if (result.status === 'failed') {
    throw new Error('Replicate generation failed')
  }

  const imageResponse = await fetch(result.output[0])
  const imageBuffer = await imageResponse.arrayBuffer()
  const base64Image = Buffer.from(imageBuffer).toString('base64')
  
  return `data:image/png;base64,${base64Image}`
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "vivid"
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const result = await response.json()
  const imageResponse = await fetch(result.data[0].url)
  const imageBuffer = await imageResponse.arrayBuffer()
  const base64Image = Buffer.from(imageBuffer).toString('base64')
  
  return `data:image/png;base64,${base64Image}`
}

async function generateWithStabilityAI(prompt: string): Promise<string> {
  const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text_prompts: [{ text: prompt, weight: 1 }],
      cfg_scale: 7,
      height: 1024,
      width: 1024,
      samples: 1,
      steps: 50,
    })
  })

  if (!response.ok) {
    throw new Error(`Stability AI error: ${response.statusText}`)
  }

  const result = await response.json()
  return `data:image/png;base64,${result.artifacts[0].base64}`
}

async function generateWithEnhancedPollinations(prompt: string): Promise<string> {
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}&enhance=true&model=flux&nologo=true&private=false`

  const response = await fetch(pollinationsUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'NFT-Artist-dApp/2.0',
      'Accept': 'image/*'
    }
  })

  if (!response.ok) {
    throw new Error(`Enhanced Pollinations API error: ${response.statusText}`)
  }

  const imageBuffer = await response.arrayBuffer()
  const base64Image = Buffer.from(imageBuffer).toString('base64')
  return `data:image/jpeg;base64,${base64Image}`
}

async function generateWithBackupPollinations(prompt: string): Promise<string> {
  const cleanPrompt = prompt.replace(/[^\w\s,.-]/g, '').trim()
  const pollinationsUrl = `https://pollinations.ai/p/${encodeURIComponent(cleanPrompt)}?width=1024&height=1024&model=flux&enhance=true`

  const response = await fetch(pollinationsUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
    }
  })

  if (!response.ok) {
    throw new Error(`Backup Pollinations API error: ${response.statusText}`)
  }

  const imageBuffer = await response.arrayBuffer()
  const base64Image = Buffer.from(imageBuffer).toString('base64')
  return `data:image/jpeg;base64,${base64Image}`
}

// Hugging Face SDXL API
async function generateWithHuggingFace(prompt: string): Promise<string> {
  const response = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        negative_prompt: "blurry, low quality, distorted, deformed, ugly, bad anatomy",
        num_inference_steps: 50,
        guidance_scale: 7.5,
        width: 1024,
        height: 1024
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.statusText}`)
  }

  const imageBuffer = await response.arrayBuffer()
  const base64Image = Buffer.from(imageBuffer).toString('base64')
  return `data:image/jpeg;base64,${base64Image}`
}

// MCP Server API
async function generateWithMCPServer(prompt: string): Promise<{ success: boolean; imageData?: string; error?: string }> {
  try {
    const response = await fetch('/api/mcp-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        negative_prompt: "blurry, low quality, distorted, deformed",
        width: 1024,
        height: 1024,
        num_inference_steps: 50,
        guidance_scale: 7.5
      })
    })

    if (!response.ok) {
      throw new Error(`MCP Server API error: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (result.success && result.imageData) {
      return { success: true, imageData: result.imageData }
    } else {
      return { success: false, error: result.error || 'MCP Server generation failed' }
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'MCP Server error' }
  }
}