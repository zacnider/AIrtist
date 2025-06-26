# AI Görsel Üretim Servisleri Rehberi

Bu NFT Artist dApp'i birden fazla premium AI görsel üretim servisini destekler. İşte en iyi seçenekler:

## 🏆 Önerilen Premium Servisler

### 1. **Replicate API** - En Ekonomik Premium Seçenek
- **Maliyet**: ~$0.0023 per görsel (yaklaşık 0.07₺)
- **Kalite**: Çok yüksek (Stable Diffusion XL)
- **Hız**: 5-15 saniye
- **Kayıt**: https://replicate.com/
- **API Token**: https://replicate.com/account/api-tokens

**Kurulum:**
```bash
# .env.local dosyasına ekleyin:
REPLICATE_API_TOKEN=r8_your_token_here
```

### 2. **OpenAI DALL-E 3** - En Yüksek Kalite
- **Maliyet**: ~$0.04 per görsel (yaklaşık 1.20₺)
- **Kalite**: Mükemmel (En iyi prompt anlama)
- **Hız**: 10-30 saniye
- **Kayıt**: https://platform.openai.com/
- **API Key**: https://platform.openai.com/api-keys

**Kurulum:**
```bash
# .env.local dosyasına ekleyin:
OPENAI_API_KEY=sk-your_key_here
```

### 3. **Stability AI** - Resmi Stable Diffusion
- **Maliyet**: ~$0.02 per görsel (yaklaşık 0.60₺)
- **Kalite**: Yüksek (Resmi Stable Diffusion)
- **Hız**: 5-20 saniye
- **Kayıt**: https://platform.stability.ai/
- **API Key**: https://platform.stability.ai/account/keys

**Kurulum:**
```bash
# .env.local dosyasına ekleyin:
STABILITY_API_KEY=sk-your_key_here
```

## 🆓 Ücretsiz Alternatif

### **Pollinations.ai** - Ücretsiz Fallback
- **Maliyet**: Ücretsiz
- **Kalite**: İyi (Flux modeli)
- **Hız**: 5-20 saniye
- **Kurulum**: Gerekmiyor (otomatik fallback)

## 💰 Maliyet Karşılaştırması

| Servis | Görsel Başına | 100 Görsel | 1000 Görsel | Kalite |
|--------|---------------|------------|-------------|---------|
| **Replicate** | $0.0023 (0.07₺) | $0.23 (7₺) | $2.30 (70₺) | ⭐⭐⭐⭐⭐ |
| **Stability AI** | $0.02 (0.60₺) | $2 (60₺) | $20 (600₺) | ⭐⭐⭐⭐⭐ |
| **OpenAI DALL-E** | $0.04 (1.20₺) | $4 (120₺) | $40 (1200₺) | ⭐⭐⭐⭐⭐ |
| **Pollinations** | Ücretsiz | Ücretsiz | Ücretsiz | ⭐⭐⭐⭐ |

## 🚀 Hızlı Başlangıç

### Adım 1: API Anahtarı Alın
En ekonomik seçenek için **Replicate**'i öneririz:

1. https://replicate.com/ adresine gidin
2. Hesap oluşturun
3. https://replicate.com/account/api-tokens adresinden token alın
4. Kredi kartı ekleyin (minimum $5 yükleme)

### Adım 2: API Anahtarını Ekleyin
```bash
# .env.local dosyasını düzenleyin:
REPLICATE_API_TOKEN=r8_your_actual_token_here
```

### Adım 3: Uygulamayı Yeniden Başlatın
```bash
npm run dev
```

## 🔄 API Öncelik Sırası

Sistem API'leri şu sırayla dener:

1. **Replicate API** (varsa)
2. **OpenAI DALL-E 3** (varsa)
3. **Stability AI** (varsa)
4. **Pollinations.ai** (ücretsiz fallback)
5. **Gelişmiş Prosedürel** (son çare)

## 📊 Performans İpuçları

### En İyi Kalite İçin:
- **OpenAI DALL-E 3** kullanın
- Detaylı prompt'lar yazın
- İngilizce prompt'lar tercih edin

### En Ekonomik İçin:
- **Replicate API** kullanın
- Toplu üretim yapın
- Cache sistemi kurun

### Ücretsiz İçin:
- Sadece **Pollinations.ai** kullanın
- API anahtarı eklemeyin
- Sınırsız kullanım

## 🛠️ Gelişmiş Ayarlar

### Prompt Optimizasyonu
Sistem otomatik olarak prompt'ları geliştirir:
- Kalite terimleri ekler
- Stil analizi yapar
- Teknik parametreler ayarlar

### Özel Parametreler
```javascript
// API çağrısında özel parametreler
{
  prompt: "your prompt",
  negative_prompt: "blurry, low quality", // İstenmeyen özellikler
  width: 1024,
  height: 1024,
  guidance_scale: 7.5, // Prompt'a ne kadar uyulsun
  num_inference_steps: 50 // Kalite vs hız
}
```

## 🔧 Sorun Giderme

### API Hatası Alıyorsanız:
1. API anahtarının doğru olduğunu kontrol edin
2. Hesabınızda kredi olduğunu kontrol edin
3. Rate limit'e takılmadığınızı kontrol edin

### Yavaş Üretim:
1. Daha az inference step kullanın
2. Daha küçük görsel boyutu seçin
3. Basit prompt'lar kullanın

### Kalitesiz Görseller:
1. Daha detaylı prompt yazın
2. Negative prompt ekleyin
3. Daha yüksek guidance scale kullanın

## 📞 Destek

Sorunlarınız için:
- GitHub Issues açın
- Discord sunucumuza katılın
- Email: support@nftartist.com

---

**Not**: Bu rehber sürekli güncellenir. En son bilgiler için GitHub repo'yu takip edin.