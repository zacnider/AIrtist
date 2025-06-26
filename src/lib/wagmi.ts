'use client'

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { monadTestnet } from './config'

export const config = getDefaultConfig({
  appName: 'NFT Artist dApp',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'default-project-id',
  chains: [monadTestnet],
  ssr: true,
})