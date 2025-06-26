import { NextRequest, NextResponse } from 'next/server'
import { useMCPTool as mcpClientUseTool, checkMCPAvailability } from '@/lib/mcp-client'

export async function POST(request: NextRequest) {
  try {
    const { server_name, tool_name, arguments: args } = await request.json()
    
    console.log('MCP API çağrısı:', { server_name, tool_name, args })
    
    // MCP server'ı kullanarak görsel üret
    if (server_name === 'stable-diffusion' && tool_name === 'generate_image') {
      try {
        // MCP client'ı kullanarak tool çağrısı yap
        const result = await mcpClientUseTool(server_name, tool_name, args)
        
        if (result.success) {
          // MCP server'dan gelen image data'sını düzgün işle
          let imageData = result.image_data || result.imageData || result.image
          
          // Eğer result.content varsa, oradan image data'sını al
          if (!imageData && result.content && Array.isArray(result.content) && result.content[0]) {
            imageData = result.content[0].text || result.content[0].image || result.content[0]
          }
          
          console.log('MCP Server response processed:', { hasImageData: !!imageData })
          
          return NextResponse.json({
            success: true,
            image_data: imageData,
            message: 'MCP Server ile başarıyla üretildi'
          })
        } else {
          // MCP başarısız olursa fallback döndür
          return NextResponse.json({
            success: false,
            error: result.error || 'MCP Server currently unavailable',
            fallback_needed: true
          }, { status: 503 })
        }
        
      } catch (mcpError) {
        console.error('MCP tool error:', mcpError)
        
        // MCP başarısız olursa fallback döndür
        return NextResponse.json({
          success: false,
          error: 'MCP Server currently unavailable',
          fallback_needed: true
        }, { status: 503 })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Unsupported MCP tool'
    }, { status: 400 })
    
  } catch (error) {
    console.error('MCP API error:', error)
    return NextResponse.json({
      success: false,
      error: 'MCP API request failed'
    }, { status: 500 })
  }
}