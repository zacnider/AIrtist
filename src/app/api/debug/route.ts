import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Only allow in development or with special header
  const isDev = process.env.NODE_ENV === 'development'
  const debugHeader = request.headers.get('x-debug-key')
  
  if (!isDev && debugHeader !== process.env.DEBUG_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    contracts: {
      factory: process.env.NEXT_PUBLIC_FACTORY_ADDRESS || 'Not set',
      network: process.env.NEXT_PUBLIC_NETWORK || 'Not set'
    },
    ipfs: {
      pinata_api_key: process.env.PINATA_API_KEY ? 'Set' : 'Not set',
      pinata_secret: process.env.PINATA_SECRET_API_KEY ? 'Set' : 'Not set',
      nft_storage: process.env.NFT_STORAGE_API_KEY ? 'Set' : 'Not set'
    },
    ai_services: {
      huggingface: process.env.HUGGINGFACE_API_KEY ? 'Set' : 'Not set',
      replicate: process.env.REPLICATE_API_TOKEN ? 'Set' : 'Not set',
      stability: process.env.STABILITY_API_KEY ? 'Set' : 'Not set'
    },
    mcp_server: {
      available: typeof process !== 'undefined' && process.env.NODE_ENV === 'development' ? 'Yes' : 'Production - Check MCP'
    }
  })
}