# Pinata IPFS Kurulum Rehberi

Bu rehber, NFT Artist DApp'inizde Pinata IPFS servisini nasıl kuracağınızı gösterir.

## 1. Pinata Hesabı Oluşturma

1. **Pinata'ya git**: https://pinata.cloud/
2. **Sign Up** butonuna tıklayın
3. Email ve şifre ile hesap oluşturun
4. Email doğrulamasını tamamlayın

## 2. API Anahtarları Alma

1. **Pinata Dashboard'a giriş yapın**: https://app.pinata.cloud/
2. **Sol menüden "API Keys"** seçin
3. **"New Key"** butonuna tıklayın
4. **Key ayarları**:
   - **Key Name**: `NFT-Artist-DApp` (istediğiniz ismi verebilirsiniz)
   - **Customize Permissions**:
     - **Files**: ✅ **Tüm izinleri aktif et** (pinFileToIPFS, unpinning, listing)
     - **Groups**: ❌ **Kapalı bırak** (ihtiyaç yok)
     - **Gateways**: ❌ **Kapalı bırak** (ihtiyaç yok)
     - **Analytics**: ❌ **Kapalı bırak** (ihtiyaç yok)
   - **Max Uses**: Boş bırakın (sınırsız)

5. **"Create Key"** butonuna tıklayın
6. **API Key** ve **API Secret** değerlerini kopyalayın

### Permissions Detayı:
- **Files**: NFT görsellerini ve metadata'yı yüklemek için gerekli
- **Groups**: Dosya grupları yönetimi (NFT projesi için gerekli değil)
- **Gateways**: Özel gateway yönetimi (ücretsiz plan için gerekli değil)
- **Analytics**: İstatistik görüntüleme (opsiyonel)

⚠️ **ÖNEMLİ**: API Secret sadece bir kez gösterilir, mutlaka kaydedin!

## 3. Environment Variables Ayarlama

`.env.local` dosyanızı açın ve Pinata anahtarlarınızı ekleyin:

```env
# Pinata IPFS Service (Primary)
PINATA_API_KEY=your_actual_pinata_api_key_here
PINATA_SECRET_API_KEY=your_actual_pinata_secret_key_here
```

**Örnek**:
```env
PINATA_API_KEY=a1b2c3d4e5f6g7h8i9j0
PINATA_SECRET_API_KEY=k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

## 4. Test Etme

1. Development server'ı yeniden başlatın:
   ```bash
   npm run dev
   ```

2. AI Studio'da bir görsel oluşturun
3. Terminal'de şu mesajı görmelisiniz:
   ```
   Using Pinata as primary IPFS service...
   Pinata upload successful: { imageCID: "...", metadataCID: "..." }
   ```

## 5. Pinata Dashboard'da Kontrol

1. **Pinata Dashboard**: https://app.pinata.cloud/pinmanager
2. **Files** sekmesinde yüklenen dosyalarınızı görebilirsiniz
3. Her dosya için:
   - **CID** (Content Identifier)
   - **Dosya boyutu**
   - **Yükleme tarihi**
   - **Gateway URL**

## 6. Fiyatlandırma

- **Ücretsiz Plan**: 1 GB depolama + 100 GB bandwidth/ay
- **Pro Plan**: $20/ay - 100 GB depolama + 1 TB bandwidth
- **Dedicated Gateway**: Daha hızlı erişim için özel gateway

## 7. Sorun Giderme

### API Key Hatası
```
Error: Request failed with status code 401
```
**Çözüm**: API anahtarlarınızı kontrol edin, doğru kopyalandığından emin olun.

### Network Hatası
```
Error: Network Error
```
**Çözüm**: İnternet bağlantınızı kontrol edin, Pinata servisi çalışıyor mu kontrol edin.

### Dosya Boyutu Hatası
```
Error: File too large
```
**Çözüm**: Görsel boyutunu küçültün veya Pro plan'a geçin.

## 8. Gateway URLs

Yüklenen dosyalarınıza şu URL'lerden erişebilirsiniz:

- **Pinata Gateway**: `https://gateway.pinata.cloud/ipfs/{CID}`
- **Public IPFS**: `https://ipfs.io/ipfs/{CID}`
- **Cloudflare**: `https://cloudflare-ipfs.com/ipfs/{CID}`

## 9. Güvenlik

- ✅ API anahtarlarınızı `.env.local` dosyasında saklayın
- ✅ `.env.local` dosyasını `.gitignore`'a ekleyin
- ❌ API anahtarlarını kod içinde hardcode etmeyin
- ❌ API anahtarlarını public repository'lerde paylaşmayın

## 10. Backup Stratejisi

Sistem şu sırayla IPFS servislerini dener:

1. **Pinata** (Primary)
2. **NFT.Storage** (Fallback)
3. **Mock Upload** (Development)

Bu sayede bir servis çalışmazsa diğeri devreye girer.