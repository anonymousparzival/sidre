// Kur'an AI Entegrasyonu - Gemini API
// Model: gemini-2.5-flash (kullanıcı tercihi)

class QuranAI {
  constructor() {
    this.apiKey = null; // API key kullanıcıdan alınacak veya config'den
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    this.model = 'gemini-2.5-flash';
    this.systemInstruction = this.getSystemInstruction();
    
    // API key'i localStorage'dan al veya config'den
    this.loadApiKey();
  }

  // API key yükleme
  loadApiKey() {
    // Önce localStorage'dan kontrol et (kullanıcı tarafından ayarlanmışsa)
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    if (storedKey) {
      this.apiKey = storedKey;
      return;
    }

    // Config dosyasından al (config.js)
    if (window.CONFIG && window.CONFIG.GEMINI_API_KEY) {
      this.apiKey = window.CONFIG.GEMINI_API_KEY;
      return;
    }

    // API key bulunamadı
    console.warn('Gemini API key bulunamadı. Lütfen config.js dosyasını kontrol edin veya API key\'i ayarlayın.');
  }

  // API key ayarla
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    localStorage.setItem('GEMINI_API_KEY', apiKey);
  }

  // Sistem talimatları (güvenlik ve doğruluk için)
  getSystemInstruction() {
    return {
      parts: [{
        text: `Sen Kur'an ayetleri hakkında yardımcı açıklamalar yapan bir AI asistanısın.

ÖNEMLİ KURALLAR:
1. Sadece sağlanan meal ve güvenilir tefsir kaynaklarına dayanarak açıklama yap.
2. Asla kendi yorumunu veya spekülasyonunu ekleme.
3. Yanlış bilgi verme, bilmediğin bir şey için "bilmiyorum" de.
4. Ayetlerin Türkçe mealini kullanarak açıklama yap.
5. Açıklamaları kısa, öz ve anlaşılır tut.
6. Dini hükümler verme, sadece açıklayıcı bilgi ver.
7. Farklı mezhepler veya görüşler varsa, bunları objektif şekilde belirt.
8. Her zaman "Bu bir AI açıklamasıdır, güvenilir tefsir kaynaklarına başvurunuz" uyarısını içer.

TÜRKÇE yanıt ver.`
      }]
    };
  }

  // Güvenlik kontrolü için prompt hazırlama
  preparePrompt(ayah, question = null) {
    let prompt = '';

    if (ayah) {
      prompt += `Aşağıdaki Kur'an ayetini açıkla:\n\n`;
      prompt += `Arapça: ${ayah.text || ''}\n`;
      prompt += `Türkçe Meal: ${ayah.translation || ayah.text || ''}\n`;
      
      if (ayah.surah) {
        prompt += `Sure: ${ayah.surah.nameTr || ayah.surah.name || ''}\n`;
        prompt += `Ayet: ${ayah.numberInSurah || ''}\n`;
      }
      
      prompt += `\n`;
    }

    if (question) {
      prompt += `Soru: ${question}\n\n`;
    }

    if (!ayah && !question) {
      prompt = 'Kur\'an hakkında bir soru sorabilirsiniz.';
    }

    return prompt;
  }

  // API çağrısı
  async callGeminiAPI(prompt, additionalContext = {}) {
    if (!this.apiKey) {
      throw new Error('Gemini API key bulunamadı. Lütfen API key\'i ayarlayın.');
    }

    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      systemInstruction: this.systemInstruction,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      ...additionalContext
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API hatası: ${response.status}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const text = data.candidates[0].content.parts[0].text;
        return text;
      } else {
        throw new Error('Geçersiz API yanıtı');
      }
    } catch (error) {
      console.error('Gemini API hatası:', error);
      throw error;
    }
  }

  // Ayet açıklama
  async explainAyah(ayah, question = null) {
    try {
      const prompt = this.preparePrompt(ayah, question);
      const explanation = await this.callGeminiAPI(prompt);
      
      // Güvenlik uyarısı ekle
      const disclaimer = '\n\n⚠️ **Önemli:** Bu açıklama AI tarafından üretilmiştir ve yardımcı niteliktedir. Doğru ve kapsamlı bilgi için güvenilir tefsir kaynaklarına başvurunuz.';
      
      return explanation + disclaimer;
    } catch (error) {
      console.error('Ayet açıklama hatası:', error);
      
      if (error.message.includes('API key')) {
        throw new Error('API key bulunamadı. Lütfen ayarlardan API key\'inizi girin.');
      }
      
      throw new Error('Açıklama alınırken bir hata oluştu: ' + error.message);
    }
  }

  // Soru-cevap
  async askQuestion(question, contextAyah = null) {
    try {
      // Güvenlik için soru kontrolü
      const sanitizedQuestion = this.sanitizeQuestion(question);
      
      let prompt = '';
      
      if (contextAyah) {
        prompt = this.preparePrompt(contextAyah, sanitizedQuestion);
      } else {
        prompt = `Kur'an hakkında bir soru: ${sanitizedQuestion}\n\n`;
        prompt += `Lütfen sadece Kur'an ayetleri ve güvenilir tefsir kaynaklarına dayanarak yanıt ver.`;
      }

      const answer = await this.callGeminiAPI(prompt);
      
      // Güvenlik uyarısı ekle
      const disclaimer = '\n\n⚠️ **Önemli:** Bu yanıt AI tarafından üretilmiştir ve yardımcı niteliktedir. Doğru bilgi için güvenilir tefsir kaynaklarına başvurunuz.';
      
      return answer + disclaimer;
    } catch (error) {
      console.error('Soru-cevap hatası:', error);
      
      if (error.message.includes('API key')) {
        throw new Error('API key bulunamadı. Lütfen ayarlardan API key\'inizi girin.');
      }
      
      throw new Error('Soru yanıtlanırken bir hata oluştu: ' + error.message);
    }
  }

  // Soru güvenlik kontrolü (zararlı içerik filtresi)
  sanitizeQuestion(question) {
    if (!question || typeof question !== 'string') {
      return '';
    }

    // Temel temizlik
    let sanitized = question.trim();
    
    // Çok uzun soruları kısalt
    if (sanitized.length > 1000) {
      sanitized = sanitized.substring(0, 1000) + '...';
    }

    // Zararlı içerik kontrolü (basit örnek)
    const harmfulPatterns = [
      /hack/i,
      /exploit/i,
      /bypass/i,
      // İhtiyaca göre eklenebilir
    ];

    // Eğer zararlı içerik varsa, genel bir yanıt döndür
    for (const pattern of harmfulPatterns) {
      if (pattern.test(sanitized)) {
        throw new Error('Güvenlik nedeniyle bu soru işlenemiyor.');
      }
    }

    return sanitized;
  }

  // API key kontrolü
  async checkApiKey(apiKey = null) {
    const testKey = apiKey || this.apiKey;
    
    if (!testKey) {
      return { valid: false, message: 'API key girilmedi.' };
    }

    try {
      const testPrompt = 'Test';
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': testKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: testPrompt }] }]
        })
      });

      if (response.ok) {
        return { valid: true, message: 'API key geçerli.' };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { 
          valid: false, 
          message: errorData.error?.message || 'API key geçersiz.' 
        };
      }
    } catch (error) {
      return { 
        valid: false, 
        message: 'API key kontrolü sırasında bir hata oluştu.' 
      };
    }
  }

  // API key ayarlama arayüzü (isteğe bağlı)
  async requestApiKey() {
    const apiKey = prompt('Gemini API key\'inizi girin:\n\n(API key\'inizi https://makersuite.google.com/app/apikey adresinden alabilirsiniz)');
    
    if (apiKey && apiKey.trim()) {
      // API key'i test et
      const checkResult = await this.checkApiKey(apiKey.trim());
      
      if (checkResult.valid) {
        this.setApiKey(apiKey.trim());
        return true;
      } else {
        alert('API key geçersiz: ' + checkResult.message);
        return false;
      }
    }
    
    return false;
  }
}

// Global instance oluştur
// API key otomatik olarak config.js'den veya localStorage'dan yüklenecek
window.QuranAI = new QuranAI();

