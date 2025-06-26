# NFT.Storage API Key Kurulumu (Ücretsiz)

## Hızlı Kurulum (5 dakika)

### 1. NFT.Storage Hesabı Oluşturun
1. https://nft.storage adresine gidin
2. "Get Started" butonuna tıklayın
3. GitHub, Google veya email ile ücretsiz hesap oluşturun

### 2. API Key Alın
1. Dashboard'a giriş yapın
2. "API Keys" sekmesine gidin
3. "New Key" butonuna tıklayın
4. Key Name: "NFT-Artist-dApp"
5. "Create" butonuna tıklayın
6. API Key'i kopyalayın

### 3. .env Dosyasını Güncelleyin
`.env` dosyasında şu satırı bulun:
```
NFT_STORAGE_API_KEY=your_nft_storage_api_key_here
```

Ve kopyaladığınız API key ile değiştirin:
```
NFT_STORAGE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Uygulamayı Yeniden Başlatın
```bash
npm run dev
```

### 5. Test Edin
1. Demo modunda NFT mint edin
2. Console'da "NFT.Storage upload successful" mesajını görmelisiniz
3. Dönen IPFS URL'leri gerçek olacak

## Önemli Bilgiler

### ✅ Avantajlar
- **Tamamen ücretsiz** (Protocol Labs tarafından destekleniyor)
- **Kalıcı depolama** (Filecoin ağında saklanır)
- **Hızlı erişim** (IPFS gateway'leri)
- **Kolay entegrasyon**

### 📊 Limitler
- Dosya başına maksimum 32GB
- Aylık upload limiti yok
- Rate limiting: saniyede 30 istek

### 🔗 IPFS URL Formatları
- **NFT.Storage Gateway**: `https://nftstorage.link/ipfs/{CID}`
- **Public IPFS Gateway**: `https://ipfs.io/ipfs/{CID}`
- **Cloudflare Gateway**: `https://cloudflare-ipfs.com/ipfs/{CID}`

## Sorun Giderme

### API Key Çalışmıyor
1. API key'in doğru kopyalandığından emin olun
2. .env dosyasında tırnak işareti kullanmayın
3. Uygulamayı yeniden başlatın

### Upload Başarısız
1. İnternet bağlantınızı kontrol edin
2. NFT.Storage servis durumunu kontrol edin: https://status.nft.storage
3. Console'da hata mesajlarını kontrol edin

### Explorer'da Görsel Görünmüyor
1. IPFS URL'inin çalıştığından emin olun
2. Metadata formatının doğru olduğunu kontrol edin
3. Blockchain explorer'ın IPFS desteği olduğunu kontrol edin

## Test URL'leri
API key kurulumu sonrası bu URL'ler çalışmalı:
- Image: `https://nftstorage.link/ipfs/{imageCID}`
- Metadata: `https://nftstorage.link/ipfs/{metadataCID}`

## Alternatif Çözümler
Eğer NFT.Storage çalışmazsa:
1. **Pinata**: Aylık 1GB ücretsiz
2. **Web3.Storage**: Protocol Labs'ın diğer servisi
3. **Infura IPFS**: Ethereum ekosistemi entegrasyonu