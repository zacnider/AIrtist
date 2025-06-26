# AI Image Generation Services Guide

This AIrtist dApp supports multiple premium AI image generation services. Here are the best options:

## 🏆 Recommended Premium Services

### 1. **Replicate API** - Most Economical Premium Option
- **Cost**: ~$0.0023 per image (approximately $0.07)
- **Quality**: Very high (Stable Diffusion XL)
- **Speed**: 5-15 seconds
- **Registration**: https://replicate.com/
- **API Token**: https://replicate.com/account/api-tokens

**Setup:**
```bash
# Add to .env.local file:
REPLICATE_API_TOKEN=r8_your_token_here
```

### 2. **OpenAI DALL-E 3** - Highest Quality
- **Cost**: ~$0.04 per image (approximately $1.20)
- **Quality**: Excellent (Best prompt understanding)
- **Speed**: 10-30 seconds
- **Registration**: https://platform.openai.com/
- **API Key**: https://platform.openai.com/api-keys

**Setup:**
```bash
# Add to .env.local file:
OPENAI_API_KEY=sk-your_key_here
```

### 3. **Stability AI** - Official Stable Diffusion
- **Cost**: ~$0.02 per image (approximately $0.60)
- **Quality**: High (Official Stable Diffusion)
- **Speed**: 5-20 seconds
- **Registration**: https://platform.stability.ai/
- **API Key**: https://platform.stability.ai/account/keys

**Setup:**
```bash
# Add to .env.local file:
STABILITY_API_KEY=sk-your_key_here
```

## 🆓 Free Alternative

### **Hugging Face** - Free Fallback
- **Cost**: Free
- **Quality**: Good (SDXL model)
- **Speed**: 5-20 seconds
- **Setup**: Requires API key

**Setup:**
```bash
# Add to .env.local file:
HUGGING_FACE_API_KEY=hf_your_key_here
```

## 💰 Cost Comparison

| Service | Per Image | 100 Images | 1000 Images | Quality |
|---------|-----------|------------|-------------|---------|
| **Replicate** | $0.0023 | $0.23 | $2.30 | ⭐⭐⭐⭐⭐ |
| **Stability AI** | $0.02 | $2 | $20 | ⭐⭐⭐⭐⭐ |
| **OpenAI DALL-E** | $0.04 | $4 | $40 | ⭐⭐⭐⭐⭐ |
| **Hugging Face** | Free | Free | Free | ⭐⭐⭐⭐ |

## 🚀 Quick Start

### Step 1: Get API Key
We recommend **Replicate** for the most economical option:

1. Go to https://replicate.com/
2. Create an account
3. Get token from https://replicate.com/account/api-tokens
4. Add credit card (minimum $5 deposit)

### Step 2: Add API Key
```bash
# Edit .env.local file:
REPLICATE_API_TOKEN=r8_your_actual_token_here
```

### Step 3: Restart Application
```bash
npm run dev
```

## 🔄 API Priority Order

The system tries APIs in this order:

1. **Replicate API** (if available)
2. **OpenAI DALL-E 3** (if available)
3. **Stability AI** (if available)
4. **Hugging Face** (free fallback)
5. **Advanced Procedural** (last resort)

## 📊 Performance Tips

### For Best Quality:
- Use **OpenAI DALL-E 3**
- Write detailed prompts
- Prefer English prompts

### For Most Economical:
- Use **Replicate API**
- Do batch generation
- Set up caching system

### For Free:
- Use only **Hugging Face**
- Don't add API keys for paid services
- Unlimited usage

## 🛠️ Advanced Settings

### Prompt Optimization
The system automatically enhances prompts:
- Adds quality terms
- Performs style analysis
- Adjusts technical parameters

### Custom Parameters
```javascript
// Custom parameters in API call
{
  prompt: "your prompt",
  negative_prompt: "blurry, low quality", // Unwanted features
  width: 1024,
  height: 1024,
  guidance_scale: 7.5, // How closely to follow prompt
  num_inference_steps: 50 // Quality vs speed
}
```

## 🔧 Troubleshooting

### If You Get API Errors:
1. Check that API key is correct
2. Check that you have credits in your account
3. Check that you haven't hit rate limits

### Slow Generation:
1. Use fewer inference steps
2. Choose smaller image size
3. Use simpler prompts

### Poor Quality Images:
1. Write more detailed prompts
2. Add negative prompts
3. Use higher guidance scale

## 📞 Support

For issues:
- Open GitHub Issues
- Join our Discord server
- Email: support@airtist.com

## 🎯 Current Implementation

### Supported Services
- ✅ **Hugging Face SDXL** (Free, currently active)
- ✅ **Replicate API** (Premium, ready to use)
- ✅ **OpenAI DALL-E 3** (Premium, ready to use)
- ✅ **Stability AI** (Premium, ready to use)

### Active Configuration
The dApp currently uses Hugging Face as the primary service with automatic fallback to other services if API keys are provided.

---

**Note**: This guide is continuously updated. Follow the GitHub repo for the latest information.