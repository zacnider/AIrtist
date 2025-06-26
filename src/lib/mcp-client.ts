// MCP Client for server-side usage
// Bu dosya MCP server ile iletişim kurmak için kullanılır

export interface MCPResult {
  success: boolean
  image_data?: string
  imageData?: string
  image?: string
  error?: string
  content?: any
}

export async function useMCPTool(serverName: string, toolName: string, args: any): Promise<MCPResult> {
  try {
    console.log(`MCP Tool çağrısı: ${serverName}/${toolName}`)
    
    // MCP server'ı çağırmak için farklı yöntemler dene
    
    // 1. Environment'ta MCP server mevcut mu kontrol et
    if (process.env.MCP_ENABLED === 'true') {
      const result = await callMCPViaEnvironment(serverName, toolName, args)
      if (result) return result
    }
    
    // 2. Global MCP client var mı kontrol et
    if (typeof global !== 'undefined' && (global as any).mcpClient) {
      const result = await callMCPViaGlobal(serverName, toolName, args)
      if (result) return result
    }
    
    // 3. Process-based MCP çağrısı dene
    if (process.env.NODE_ENV === 'development') {
      const result = await callMCPViaProcess(serverName, toolName, args)
      if (result) return result
    }
    
    // MCP server mevcut değil
    return {
      success: false,
      error: 'MCP Server not available'
    }
    
  } catch (error) {
    console.error('MCP Tool error:', error)
    return {
      success: false,
      error: `MCP Tool failed: ${error}`
    }
  }
}

// Environment-based MCP call
async function callMCPViaEnvironment(serverName: string, toolName: string, args: any): Promise<MCPResult | null> {
  try {
    // Environment variable'lar üzerinden MCP server'ı çağır
    // Bu kısım gerçek MCP setup'ına göre değiştirilmeli
    
    console.log('Environment-based MCP çağrısı deneniyor...')
    
    // Şimdilik null döndür
    return null
    
  } catch (error) {
    console.error('Environment MCP call failed:', error)
    return null
  }
}

// Global-based MCP call
async function callMCPViaGlobal(serverName: string, toolName: string, args: any): Promise<MCPResult | null> {
  try {
    // Global MCP client üzerinden çağır
    const mcpClient = (global as any).mcpClient
    
    if (mcpClient && typeof mcpClient.useTool === 'function') {
      console.log('Global MCP client ile çağrı yapılıyor...')
      
      const result = await mcpClient.useTool(serverName, toolName, args)
      
      if (result && result.success) {
        return {
          success: true,
          image_data: result.image_data || result.imageData || result.image
        }
      }
    }
    
    return null
    
  } catch (error) {
    console.error('Global MCP call failed:', error)
    return null
  }
}

// Process-based MCP call
async function callMCPViaProcess(serverName: string, toolName: string, args: any): Promise<MCPResult | null> {
  try {
    console.log('Process-based MCP çağrısı deneniyor...')
    
    if (serverName === 'stable-diffusion' && toolName === 'generate_image') {
      // Stable Diffusion için özel çağrı
      const result = await callStableDiffusionProcess(args)
      return result
    }
    
    return null
    
  } catch (error) {
    console.error('Process MCP call failed:', error)
    return null
  }
}

// Stable Diffusion process call
async function callStableDiffusionProcess(args: any): Promise<MCPResult | null> {
  try {
    console.log('Stable Diffusion MCP server çağrısı yapılıyor...')
    
    // MCP server'ın çalışıp çalışmadığını test et
    const isMCPRunning = await testMCPServerConnection()
    
    if (!isMCPRunning) {
      console.log('MCP server çalışmıyor')
      return null
    }
    
    console.log('MCP server çalışıyor, görsel üretimi başlatılıyor...')
    
    // Gerçek MCP server çağrısı
    // Bu kısım MCP server'ın stdio interface'i üzerinden çalışır
    const result = await callMCPServerDirectly(args)
    
    return result
    
  } catch (error) {
    console.error('Stable Diffusion process call failed:', error)
    return null
  }
}

// MCP server bağlantı testi
async function testMCPServerConnection(): Promise<boolean> {
  try {
    // MCP server'ın çalışıp çalışmadığını test et
    // Process kontrolü yap
    const { exec } = require('child_process')
    
    return new Promise((resolve) => {
      exec('ps aux | grep "node build/index.js" | grep -v grep', (error: any, stdout: string) => {
        if (error) {
          resolve(false)
        } else {
          const isRunning = stdout.trim().length > 0
          console.log('MCP server durumu:', isRunning ? 'Çalışıyor' : 'Çalışmıyor')
          resolve(isRunning)
        }
      })
    })
    
  } catch (error) {
    console.error('MCP connection test failed:', error)
    return false
  }
}

// Direkt MCP server çağrısı
async function callMCPServerDirectly(args: any): Promise<MCPResult | null> {
  try {
    console.log('Direkt MCP server çağrısı yapılıyor...')
    
    // Gerçek MCP server çağrısını dene
    const result = await callRealMCPServer(args)
    
    if (result) {
      return result
    }
    
    console.log('MCP server çağrısı başarısız - fallback gerekli')
    return null
    
  } catch (error) {
    console.error('Direct MCP server call failed:', error)
    return null
  }
}

// Gerçek MCP server çağrısı
async function callRealMCPServer(args: any): Promise<MCPResult | null> {
  try {
    console.log('Gerçek MCP server ile iletişim kuruluyor...')
    
    // HTTP endpoint üzerinden MCP server'ı çağır
    // MCP server'ın HTTP interface'i varsa kullan
    try {
      const response = await fetch('http://localhost:3001/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: args.prompt,
          negative_prompt: args.negative_prompt || '',
          width: args.width || 1024,
          height: args.height || 1024,
          num_inference_steps: args.num_inference_steps || 50,
          guidance_scale: args.guidance_scale || 7.5
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('MCP HTTP response başarılı')
        
        return {
          success: true,
          image_data: result.image_data || result.imageData || result.image
        }
      } else {
        console.log('MCP HTTP response başarısız:', response.status)
      }
      
    } catch (httpError) {
      console.log('MCP HTTP çağrısı başarısız, stdio deneniyor...')
    }
    
    // HTTP başarısız olursa stdio interface dene
    const { spawn } = require('child_process')
    
    return new Promise((resolve) => {
      try {
        // MCP server'ı stdio mode'da çağır
        const mcpProcess = spawn('node', ['/Users/nihataltuntas/Documents/Cline/MCP/stable-diffusion-server/build/index.js'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, MCP_MODE: 'stdio' }
        })
        
        let responseData = ''
        let errorData = ''
        let messageBuffer = ''
        
        // MCP initialization
        const initRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            clientInfo: {
              name: 'nft-artist-dapp',
              version: '1.0.0'
            }
          }
        }
        
        console.log('MCP initialization gönderiliyor...')
        mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n')
        
        // Tool call request
        setTimeout(() => {
          const toolRequest = {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
              name: 'generate_image',
              arguments: args
            }
          }
          
          console.log('MCP tool request gönderiliyor:', toolRequest)
          mcpProcess.stdin.write(JSON.stringify(toolRequest) + '\n')
        }, 1000)
        
        mcpProcess.stdout.on('data', (data: Buffer) => {
          messageBuffer += data.toString()
          
          // JSON-RPC mesajlarını parse et
          const lines = messageBuffer.split('\n')
          messageBuffer = lines.pop() || '' // Son incomplete line'ı sakla
          
          for (const line of lines) {
            if (line.trim()) {
              try {
                const response = JSON.parse(line.trim())
                console.log('MCP response:', response)
                
                if (response.id === 2 && response.result) {
                  // Tool call response
                  if (response.result.content && response.result.content[0]) {
                    const contentItem = response.result.content[0]
                    console.log('MCP content item:', JSON.stringify(contentItem, null, 2))
                    
                    // Farklı field'ları kontrol et
                    let imageData = null
                    
                    // 1. Direct image field
                    if (contentItem.image) {
                      imageData = contentItem.image
                    }
                    // 2. Text field içinde data URL arama
                    else if (contentItem.text) {
                      const dataUrlMatch = contentItem.text.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/)
                      if (dataUrlMatch) {
                        imageData = dataUrlMatch[0]
                      } else {
                        // Text içinde base64 string arama
                        const base64Match = contentItem.text.match(/[A-Za-z0-9+/=]{100,}/)
                        if (base64Match) {
                          imageData = `data:image/png;base64,${base64Match[0]}`
                        }
                      }
                    }
                    // 3. Data field
                    else if (contentItem.data) {
                      imageData = contentItem.data
                    }
                    // 4. Base64 field
                    else if (contentItem.base64) {
                      imageData = `data:image/png;base64,${contentItem.base64}`
                    }
                    
                    console.log('MCP image data received:', imageData ? 'Yes' : 'No')
                    console.log('Image data preview:', imageData ? imageData.substring(0, 100) + '...' : 'None')
                    
                    resolve({
                      success: true,
                      image_data: imageData,
                      content: response.result.content
                    })
                    return
                  }
                }
              } catch (parseError) {
                console.error('MCP message parse error:', parseError)
              }
            }
          }
        })
        
        mcpProcess.stderr.on('data', (data: Buffer) => {
          errorData += data.toString()
          console.error('MCP stderr:', data.toString())
        })
        
        mcpProcess.on('close', (code: number) => {
          console.log('MCP process closed with code:', code)
          console.log('Error data:', errorData)
          
          // MCP çağrısı başarısız
          resolve(null)
        })
        
        // Timeout
        setTimeout(() => {
          mcpProcess.kill()
          resolve(null)
        }, 60000) // 60 saniye timeout
        
      } catch (spawnError) {
        console.error('MCP spawn error:', spawnError)
        resolve(null)
      }
    })
    
  } catch (error) {
    console.error('Real MCP server call failed:', error)
    return null
  }
}

// MCP Server availability check
export async function checkMCPAvailability(): Promise<boolean> {
  try {
    // MCP server'ın mevcut olup olmadığını kontrol et
    
    // Environment check
    if (process.env.MCP_ENABLED === 'true') {
      return true
    }
    
    // Global client check
    if (typeof global !== 'undefined' && (global as any).mcpClient) {
      return true
    }
    
    // Development environment check
    if (process.env.NODE_ENV === 'development') {
      // Development'ta MCP server'ın çalışıp çalışmadığını test et
      return await testMCPServerConnection()
    }
    
    return false
    
  } catch (error) {
    console.error('MCP availability check failed:', error)
    return false
  }
}