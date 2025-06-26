import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt, negative_prompt, width, height, num_inference_steps, guidance_scale } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt gerekli' },
        { status: 400 }
      )
    }

    console.log('AIrtist ile görsel üretiliyor...')
    console.log('Prompt:', prompt)

    // Prompt'u Türkçe için optimize et
    const enhancedPrompt = enhancePromptForTurkish(prompt)
    console.log('Geliştirilmiş prompt:', enhancedPrompt)

    let imageData = null
    let service = 'bilinmiyor'

    // API key kontrolü
    const hasValidHuggingFace = process.env.HUGGINGFACE_API_KEY &&
                               process.env.HUGGINGFACE_API_KEY !== 'your_huggingface_key_here'

    const hasValidReplicate = process.env.REPLICATE_API_TOKEN &&
                             process.env.REPLICATE_API_TOKEN !== 'your_replicate_token_here' &&
                             process.env.REPLICATE_API_TOKEN.startsWith('r8_')

    const hasValidStability = process.env.STABILITY_API_KEY &&
                             process.env.STABILITY_API_KEY !== 'your_stability_key_here' &&
                             process.env.STABILITY_API_KEY.startsWith('sk-')

    // 1. Hugging Face Inference API (Birincil - Ücretsiz ve güvenilir)
    if (!imageData && hasValidHuggingFace) {
      try {
        console.log('Hugging Face API deneniyor...')
        imageData = await generateWithHuggingFace(enhancedPrompt, negative_prompt, width, height, num_inference_steps, guidance_scale)
        service = 'Hugging Face SDXL'
      } catch (error) {
        console.error('Hugging Face API başarısız:', error)
      }
    }

    // 2. Replicate API (İkincil - Ücretli ama kaliteli)
    if (!imageData && hasValidReplicate) {
      try {
        console.log('Replicate API deneniyor...')
        imageData = await generateWithReplicate(enhancedPrompt, width, height, negative_prompt)
        service = 'Replicate SDXL'
      } catch (error) {
        console.error('Replicate API başarısız:', error)
      }
    }

    // 3. MCP Server (Üçüncül - Yerel Stable Diffusion, sorunlu olabilir)
    if (!imageData) {
      try {
        console.log('MCP Server deneniyor...')
        imageData = await generateWithMCPServer(enhancedPrompt, negative_prompt, width, height, num_inference_steps, guidance_scale)
        service = 'MCP Stable Diffusion'
      } catch (error) {
        console.error('MCP Server başarısız:', error)
      }
    }

    // 4. Stability AI (Resmi Stable Diffusion)
    if (!imageData && hasValidStability) {
      try {
        console.log('Stability AI deneniyor...')
        imageData = await generateWithStabilityAI(enhancedPrompt, width, height)
        service = 'Stability AI'
      } catch (error) {
        console.error('Stability AI başarısız:', error)
      }
    }

    // Eğer hiçbir AI servisi çalışmazsa hata döndür
    if (!imageData) {
      console.error('Tüm AI servisleri başarısız oldu')
      return NextResponse.json(
        { success: false, error: 'AI image generation failed. Please check your API keys.' },
        { status: 500 }
      )
    }

    console.log(`${service} ile görsel başarıyla üretildi`)

    return NextResponse.json({
      success: true,
      imageData,
      prompt: enhancedPrompt,
      service,
      message: `${service} ile üretildi`,
      fallback: service.includes('Prosedürel')
    })

  } catch (error) {
    console.error('Sanat üretiminde hata:', error)
    return NextResponse.json(
      { success: false, error: 'Sanat üretimi başarısız' },
      { status: 500 }
    )
  }
}

// MCP Server ile görsel üretimi
async function generateWithMCPServer(prompt: string, negative_prompt?: string, width?: number, height?: number, num_inference_steps?: number, guidance_scale?: number): Promise<string> {
  try {
    console.log('MCP Server ile görsel üretiliyor...')
    
    // MCP server'a direkt API çağrısı yap
    // Bu, MCP server'ın HTTP endpoint'i üzerinden çalışır
    const response = await fetch('http://localhost:3000/api/mcp-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        server_name: 'stable-diffusion',
        tool_name: 'generate_image',
        arguments: {
          prompt: prompt,
          negative_prompt: negative_prompt || 'blurry, low quality, distorted, deformed, ugly',
          width: width || 1024,
          height: height || 1024,
          num_inference_steps: num_inference_steps || 50,
          guidance_scale: guidance_scale || 7.5
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`MCP API error: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(`MCP generation failed: ${result.error}`)
    }
    
    // MCP server'dan gelen image data'sını doğru şekilde al
    console.log('MCP result structure:', JSON.stringify(result, null, 2))
    
    // MCP server response'unda image_data field'ından gerçek base64 data'sını extract et
    let imageData = result.image_data || result.imageData || result.image || result.data
    
    if (typeof imageData === 'string') {
      // String içinde "data:image/" ile başlayan kısmı bul
      const dataUrlMatch = imageData.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/)
      if (dataUrlMatch) {
        return dataUrlMatch[0]
      }
      
      // Eğer sadece base64 string varsa, data URL formatına çevir
      if (imageData.match(/^[A-Za-z0-9+/=]+$/)) {
        return `data:image/png;base64,${imageData}`
      }
    }
    
    return imageData
    
  } catch (error) {
    console.error('MCP Server error:', error)
    throw error
  }
}

// Hugging Face Inference API
async function generateWithHuggingFace(prompt: string, negative_prompt?: string, width?: number, height?: number, num_inference_steps?: number, guidance_scale?: number): Promise<string> {
  const response = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        negative_prompt: negative_prompt || 'blurry, low quality, distorted, deformed, ugly',
        width: width || 1024,
        height: height || 1024,
        num_inference_steps: num_inference_steps || 50,
        guidance_scale: guidance_scale || 7.5
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Hugging Face API hatası: ${response.statusText}`)
  }

  const imageBuffer = await response.arrayBuffer()
  const base64Image = Buffer.from(imageBuffer).toString('base64')
  return `data:image/jpeg;base64,${base64Image}`
}

// Türkçe için prompt geliştirme
function enhancePromptForTurkish(originalPrompt: string): string {
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

  // Türkçe anahtar kelimeler için stil geliştirme
  if (promptLower.includes('ejder') || promptLower.includes('dragon') || promptLower.includes('fantastik')) {
    styleEnhancement = ', fantasy art, magical, epic, cinematic lighting, detailed scales, glowing eyes'
  } else if (promptLower.includes('cyberpunk') || promptLower.includes('neon') || promptLower.includes('gelecekçi')) {
    styleEnhancement = ', cyberpunk art, neon lights, futuristic cityscape, dark atmosphere, glowing signs, rain reflections'
  } else if (promptLower.includes('portre') || promptLower.includes('portrait') || promptLower.includes('yüz')) {
    styleEnhancement = ', portrait photography, detailed facial features, professional lighting, sharp focus'
  } else if (promptLower.includes('manzara') || promptLower.includes('landscape') || promptLower.includes('dağ')) {
    styleEnhancement = ', landscape photography, dramatic lighting, vast scenery, detailed environment'
  } else if (promptLower.includes('soyut') || promptLower.includes('abstract')) {
    styleEnhancement = ', abstract art, geometric patterns, vibrant colors, modern composition'
  } else if (promptLower.includes('gerçekçi') || promptLower.includes('realistic') || promptLower.includes('fotoğraf')) {
    styleEnhancement = ', photorealistic, detailed textures, natural lighting, high definition'
  } else {
    styleEnhancement = ', digital art, concept art, detailed illustration'
  }

  const enhanced = `${originalPrompt}${styleEnhancement}, ${qualityTerms.slice(0, 5).join(', ')}`
  return enhanced
}

// Enhanced Pollinations AI with better parameters
async function generateWithEnhancedPollinations(prompt: string, width?: number, height?: number): Promise<string> {
  const models = ['flux', 'flux-realism', 'flux-3d', 'turbo']
  const selectedModel = selectBestModel(prompt)
  
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width || 1024}&height=${height || 1024}&seed=${Math.floor(Math.random() * 1000000)}&enhance=true&model=${selectedModel}&nologo=true&private=false`

  console.log('Enhanced Pollinations URL:', pollinationsUrl)

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

// Backup Pollinations with different approach
async function generateWithBackupPollinations(prompt: string, width?: number, height?: number): Promise<string> {
  // Try with different endpoint and parameters
  const cleanPrompt = prompt.replace(/[^\w\s,.-]/g, '').trim()
  const pollinationsUrl = `https://pollinations.ai/p/${encodeURIComponent(cleanPrompt)}?width=${width || 1024}&height=${height || 1024}&model=flux&enhance=true`

  console.log('Backup Pollinations URL:', pollinationsUrl)

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

function selectBestModel(prompt: string): string {
  const promptLower = prompt.toLowerCase()
  
  if (promptLower.includes('realistic') || promptLower.includes('photo') || promptLower.includes('portrait')) {
    return 'flux-realism'
  } else if (promptLower.includes('3d') || promptLower.includes('render') || promptLower.includes('sculpture')) {
    return 'flux-3d'
  } else if (promptLower.includes('fast') || promptLower.includes('quick') || promptLower.includes('simple')) {
    return 'turbo'
  } else {
    return 'flux' // Default best quality
  }
}

// Replicate API - Most economical premium option (~$0.0023 per image)
async function generateWithReplicate(prompt: string, width?: number, height?: number, negative_prompt?: string): Promise<string> {
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", // SDXL
      input: {
        prompt: prompt,
        negative_prompt: negative_prompt || "blurry, low quality, distorted, deformed",
        width: width || 1024,
        height: height || 1024,
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
  
  // Poll for completion
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

  // Convert image URL to base64
  const imageResponse = await fetch(result.output[0])
  const imageBuffer = await imageResponse.arrayBuffer()
  const base64Image = Buffer.from(imageBuffer).toString('base64')
  
  return `data:image/png;base64,${base64Image}`
}

// OpenAI DALL-E 3 - Highest quality (~$0.04 per image)
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
  
  // Convert image URL to base64
  const imageResponse = await fetch(result.data[0].url)
  const imageBuffer = await imageResponse.arrayBuffer()
  const base64Image = Buffer.from(imageBuffer).toString('base64')
  
  return `data:image/png;base64,${base64Image}`
}

// Stability AI - Official Stable Diffusion (~$0.02 per image)
async function generateWithStabilityAI(prompt: string, width?: number, height?: number): Promise<string> {
  const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text_prompts: [
        {
          text: prompt,
          weight: 1
        }
      ],
      cfg_scale: 7,
      height: height || 1024,
      width: width || 1024,
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

function generateHighQualityProcedural(prompt: string, width: number, height: number): string {
  const hash = prompt.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const promptLower = prompt.toLowerCase()
  const style = analyzePromptForProcedural(promptLower)
  
  const svg = generateComplexProceduralSVG(prompt, width, height, hash, style)
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

function analyzePromptForProcedural(prompt: string) {
  if (prompt.includes('dragon')) return 'dragon'
  if (prompt.includes('cyberpunk') || prompt.includes('neon')) return 'cyberpunk'
  if (prompt.includes('forest') || prompt.includes('nature')) return 'nature'
  if (prompt.includes('space') || prompt.includes('cosmic')) return 'space'
  if (prompt.includes('abstract')) return 'abstract'
  if (prompt.includes('portrait')) return 'portrait'
  if (prompt.includes('city')) return 'city'
  return 'general'
}

function generateComplexProceduralSVG(prompt: string, width: number, height: number, hash: number, style: string): string {
  const gradients = generateAdvancedGradients(style, hash)
  const patterns = generateAdvancedPatterns(style, hash)
  const shapes = generateAdvancedShapes(prompt, width, height, hash, style)
  const effects = generateAdvancedEffects(style, hash)
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${gradients}
        ${patterns}
        ${effects}
      </defs>
      
      <!-- Background layers -->
      ${generateLayeredBackground(width, height, style, hash)}
      
      <!-- Main content -->
      ${shapes}
      
      <!-- Overlay effects -->
      ${generateOverlayEffects(width, height, style, hash)}
      
      <!-- Prompt-based elements -->
      ${generatePromptSpecificElements(prompt, width, height, hash)}
      
      <!-- Quality indicator -->
      <text x="${width-10}" y="${height-10}" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.5)" text-anchor="end">
        AI Generated
      </text>
    </svg>
  `
}

function generateAdvancedGradients(style: string, hash: number): string {
  const colors = getStyleColors(style)
  const id1 = `grad1_${Math.abs(hash)}`
  const id2 = `grad2_${Math.abs(hash)}`
  const id3 = `grad3_${Math.abs(hash)}`
  
  return `
    <radialGradient id="${id1}" cx="30%" cy="30%" r="70%">
      <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:0.9" />
      <stop offset="50%" style="stop-color:${colors[1]};stop-opacity:0.6" />
      <stop offset="100%" style="stop-color:${colors[2]};stop-opacity:0.3" />
    </radialGradient>
    <linearGradient id="${id2}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors[1]};stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:${colors[3]};stop-opacity:0.4" />
    </linearGradient>
    <radialGradient id="${id3}" cx="70%" cy="70%" r="50%">
      <stop offset="0%" style="stop-color:${colors[3]};stop-opacity:0.7" />
      <stop offset="100%" style="stop-color:${colors[0]};stop-opacity:0.2" />
    </radialGradient>
  `
}

function generateAdvancedPatterns(style: string, hash: number): string {
  const patternId = `pattern_${Math.abs(hash)}`
  
  if (style === 'cyberpunk') {
    return `
      <pattern id="${patternId}" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="none"/>
        <line x1="0" y1="10" x2="20" y2="10" stroke="rgba(0,255,255,0.3)" stroke-width="1"/>
        <line x1="10" y1="0" x2="10" y2="20" stroke="rgba(255,0,255,0.3)" stroke-width="1"/>
      </pattern>
    `
  }
  
  return `
    <pattern id="${patternId}" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
      <circle cx="15" cy="15" r="2" fill="rgba(255,255,255,0.1)"/>
    </pattern>
  `
}

function generateAdvancedEffects(style: string, hash: number): string {
  const filterId = `filter_${Math.abs(hash)}`
  
  return `
    <filter id="${filterId}">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3"/>
      <feColorMatrix type="saturate" values="1.5"/>
      <feBlend mode="multiply"/>
    </filter>
  `
}

function generateLayeredBackground(width: number, height: number, style: string, hash: number): string {
  const grad1 = `grad1_${Math.abs(hash)}`
  const grad2 = `grad2_${Math.abs(hash)}`
  const grad3 = `grad3_${Math.abs(hash)}`
  
  return `
    <rect width="${width}" height="${height}" fill="url(#${grad1})"/>
    <rect width="${width}" height="${height}" fill="url(#${grad2})" opacity="0.7"/>
    <rect width="${width}" height="${height}" fill="url(#${grad3})" opacity="0.5"/>
  `
}

function generateAdvancedShapes(prompt: string, width: number, height: number, hash: number, style: string): string {
  let shapes = ''
  
  for (let i = 0; i < 12; i++) {
    const x = (hash * (i + 1) * 17) % width
    const y = (hash * (i + 2) * 23) % height
    const size = 20 + (hash * i * 7) % 80
    const rotation = (hash * i * 13) % 360
    const opacity = 0.2 + (i % 4) * 0.15
    
    if (style === 'cyberpunk') {
      shapes += `
        <rect x="${x}" y="${y}" width="${size}" height="${size/4}" 
              fill="rgba(0,255,255,${opacity})" 
              transform="rotate(${rotation} ${x + size/2} ${y + size/8})"/>
        <circle cx="${x + size/2}" cy="${y + size/8}" r="3" fill="rgba(255,0,255,${opacity + 0.3})"/>
      `
    } else if (style === 'dragon') {
      shapes += `
        <ellipse cx="${x}" cy="${y}" rx="${size}" ry="${size/2}" 
                 fill="rgba(255,100,50,${opacity})" 
                 transform="rotate(${rotation} ${x} ${y})"/>
        <circle cx="${x}" cy="${y}" r="5" fill="rgba(255,200,100,${opacity + 0.4})"/>
      `
    } else {
      shapes += `
        <polygon points="${x},${y} ${x+size},${y+size/2} ${x+size/2},${y+size}" 
                 fill="rgba(255,255,255,${opacity})" 
                 transform="rotate(${rotation} ${x+size/2} ${y+size/2})"/>
      `
    }
  }
  
  return shapes
}

function generateOverlayEffects(width: number, height: number, style: string, hash: number): string {
  const filterId = `filter_${Math.abs(hash)}`
  
  return `
    <rect width="${width}" height="${height}" fill="url(#pattern_${Math.abs(hash)})" opacity="0.2"/>
    <rect width="${width}" height="${height}" fill="none" filter="url(#${filterId})" opacity="0.3"/>
  `
}

function generatePromptSpecificElements(prompt: string, width: number, height: number, hash: number): string {
  const promptLower = prompt.toLowerCase()
  let elements = ''
  
  if (promptLower.includes('dragon')) {
    elements += `
      <path d="M${width*0.2} ${height*0.4} Q${width*0.5} ${height*0.2} ${width*0.8} ${height*0.4} Q${width*0.7} ${height*0.7} ${width*0.3} ${height*0.6} Z" 
            fill="rgba(255,150,50,0.7)" opacity="0.8"/>
      <circle cx="${width*0.6}" cy="${height*0.35}" r="12" fill="rgba(255,50,50,0.9)"/>
      <circle cx="${width*0.6}" cy="${height*0.35}" r="6" fill="rgba(255,200,100,1)"/>
    `
  }
  
  if (promptLower.includes('city') || promptLower.includes('cyberpunk')) {
    elements += `
      <rect x="${width*0.1}" y="${height*0.6}" width="50" height="${height*0.4}" fill="rgba(100,100,255,0.8)"/>
      <rect x="${width*0.3}" y="${height*0.5}" width="70" height="${height*0.5}" fill="rgba(150,100,255,0.8)"/>
      <rect x="${width*0.6}" y="${height*0.7}" width="60" height="${height*0.3}" fill="rgba(200,100,255,0.8)"/>
      <circle cx="${width*0.15}" cy="${height*0.5}" r="3" fill="rgba(0,255,255,1)"/>
      <circle cx="${width*0.35}" cy="${height*0.4}" r="3" fill="rgba(255,0,255,1)"/>
    `
  }
  
  if (promptLower.includes('mountain')) {
    elements += `
      <polygon points="${width*0.1},${height*0.8} ${width*0.3},${height*0.3} ${width*0.5},${height*0.8}" 
               fill="rgba(200,200,255,0.7)"/>
      <polygon points="${width*0.4},${height*0.8} ${width*0.6},${height*0.2} ${width*0.8},${height*0.8}" 
               fill="rgba(180,180,255,0.8)"/>
    `
  }
  
  return elements
}

function getStyleColors(style: string): string[] {
  const colorPalettes = {
    dragon: ['#FF6B35', '#FF8E53', '#FF4500', '#DC143C'],
    cyberpunk: ['#00FFFF', '#FF1493', '#9400D3', '#00FF00'],
    nature: ['#228B22', '#32CD32', '#90EE90', '#006400'],
    space: ['#4B0082', '#8A2BE2', '#9370DB', '#191970'],
    abstract: ['#FF69B4', '#FFD700', '#00CED1', '#FF6347'],
    portrait: ['#DEB887', '#F5DEB3', '#D2B48C', '#BC8F8F'],
    city: ['#708090', '#778899', '#B0C4DE', '#4682B4'],
    general: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981']
  }
  
  return colorPalettes[style as keyof typeof colorPalettes] || colorPalettes.general
}