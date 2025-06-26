# NFT Görsellerinin Explorer'da Görünmesi İçin IPFS Kurulumu

## Sorun
NFT'ler mint ediliyor ancak görseller blockchain explorer'da görünmüyor çünkü şu anda mock IPFS hash'leri kullanıyoruz.

## Çözüm: Pinata IPFS Entegrasyonu

### 1. Pinata Hesabı Oluşturun
1. https://pinata.cloud adresine gidin
2. Ücretsiz hesap oluşturun
3. Dashboard'a giriş yapın

### 2. API Key Oluşturun
1. Pinata Dashboard'da "API Keys" bölümüne gidin
2. "New Key" butonuna tıklayın
3. Permissions:
   - ✅ pinFileToIPFS
   - ✅ pinJSONToIPFS
   - ✅ unpin
4. Key Name: "NFT-Artist-dApp"
5. "Create Key" butonuna tıklayın
6. API Key ve Secret'i kopyalayın

### 3. Environment Variables Ekleyin
`.env` dosyasına şu satırları ekleyin:

```env
# Pinata IPFS Configuration
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_API_KEY=your_pinata_secret_key_here
PINATA_JWT=your_pinata_jwt_here
```

### 4. Pinata SDK Yükleyin
```bash
npm install @pinata/sdk
```

### 5. Gerçek IPFS Upload Fonksiyonu
Aşağıdaki kod ile `/api/upload-ipfs/route.ts` dosyasını güncelleyin:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { PinataSDK } from '@pinata/sdk'

const pinata = new PinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY!,
  pinataSecretApiKey: process.env.PINATA_SECRET_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { metadata, image } = await request.json()

    if (!metadata || !image) {
      return NextResponse.json(
        { success: false, error: 'Metadata and image are required' },
        { status: 400 }
      )
    }

    // 1. Upload image to IPFS
    const imageBuffer = Buffer.from(image.split(',')[1], 'base64')
    const imageUpload = await pinata.pinFileToIPFS(imageBuffer, {
      pinataMetadata: {
        name: `${metadata.name}_image`,
      },
    })

    const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageUpload.IpfsHash}`

    // 2. Create metadata with IPFS image URL
    const nftMetadata = {
      name: metadata.name,
      description: metadata.description,
      image: imageUrl,
      attributes: metadata.attributes,
      external_url: process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com',
    }

    // 3. Upload metadata to IPFS
    const metadataUpload = await pinata.pinJSONToIPFS(nftMetadata, {
      pinataMetadata: {
        name: `${metadata.name}_metadata`,
      },
    })

    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataUpload.IpfsHash}`

    return NextResponse.json({
      success: true,
      ipfsHash: metadataUpload.IpfsHash,
      metadataUri: metadataUrl,
      imageUri: imageUrl,
      imageHash: imageUpload.IpfsHash,
      message: 'Successfully uploaded to IPFS via Pinata'
    })

  } catch (error) {
    console.error('Pinata IPFS upload error:', error)
    return NextResponse.json(
      { success: false, error: 'IPFS upload failed' },
      { status: 500 }
    )
  }
}
```

### 6. Alternatif: Ücretsiz IPFS Çözümleri

#### A) NFT.Storage (Ücretsiz)
```bash
npm install nft.storage
```

#### B) Web3.Storage (Ücretsiz)
```bash
npm install web3.storage
```

#### C) Infura IPFS
```bash
npm install ipfs-http-client
```

### 7. Test Etme
1. Gerçek API key'leri ekleyin
2. Uygulamayı yeniden başlatın
3. NFT mint edin
4. Explorer'da görsel görünmeli

### 8. Doğrulama
NFT mint edildikten sonra:
1. Transaction hash'i kopyalayın
2. Monad Explorer'da açın
3. NFT detaylarında görsel görünmeli
4. Metadata URL'i çalışmalı

## Önemli Notlar
- Pinata ücretsiz planında 1GB depolama var
- Görseller kalıcı olarak IPFS'te saklanır
- Metadata URL'i smart contract'ta saklanır
- Explorer otomatik olarak IPFS'ten görseli çeker

## Sorun Giderme
- API key'lerin doğru olduğundan emin olun
- CORS ayarlarını kontrol edin
- Pinata dashboard'da upload'ları kontrol edin
- Browser console'da hata mesajlarını kontrol edin