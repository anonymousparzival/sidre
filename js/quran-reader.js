// Kur'an Okuma Sayfası JavaScript

// Smooth scroll fonksiyonu (requestAnimationFrame ile - optimize edilmiş)
// Global olarak erişilebilir yap (quran-player.js için) - DOMContentLoaded dışında tanımla
window.smoothScrollToElement = function(element, delay = 0) {
  if (!element) return;
  
  setTimeout(() => {
    // Eğer element görünür değilse hesaplamaları tekrar yap
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const elementTop = rect.top + scrollTop;
    const elementHeight = rect.height;
    const viewportHeight = window.innerHeight;
    
    // Ayeti ekranın tam ortasına yerleştir
    const targetScroll = Math.max(0, elementTop - (viewportHeight / 2) + (elementHeight / 2));
    
    // Smooth scroll için requestAnimationFrame kullan
    const startScroll = scrollTop;
    const distance = targetScroll - startScroll;
    
    // Mesafeye göre dinamik süre (daha uzun mesafe = daha uzun animasyon, max 1.8s)
    const baseDuration = 1400; // 1.4 saniye base
    const distanceFactor = Math.min(Math.abs(distance) / 500, 1.5); // Mesafe faktörü
    const duration = baseDuration + (distanceFactor * 400); // Max 1.8s
    
    let startTime = null;
    let lastScroll = startScroll;
    
    // Daha yumuşak easing function (ease-out-expo benzeri)
    const easeOutExpo = (t) => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };
    
    // Alternatif: ease-out-cubic (daha smooth)
    const easeOutCubic = (t) => {
      return 1 - Math.pow(1 - t, 3);
    };
    
    // En yumuşak: ease-out-quart
    const easeOutQuart = (t) => {
      return 1 - Math.pow(1 - t, 4);
    };
    
    const smoothScroll = (currentTime) => {
      if (startTime === null) {
        startTime = currentTime || performance.now();
      }
      
      const elapsed = (currentTime || performance.now()) - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Daha yumuşak easing kullan
      const ease = easeOutQuart(progress);
      
      const currentScroll = startScroll + distance * ease;
      
      // Sadece scroll değiştiyse update et (performans için)
      if (Math.abs(currentScroll - lastScroll) > 0.5) {
        window.scrollTo(0, currentScroll);
        lastScroll = currentScroll;
      }
      
      if (progress < 1) {
        requestAnimationFrame(smoothScroll);
      } else {
        // Son pozisyona tam olarak git
        window.scrollTo(0, targetScroll);
      }
    };
    
    requestAnimationFrame(smoothScroll);
  }, delay);
};

document.addEventListener('DOMContentLoaded', async () => {
  const surahSelect = document.getElementById('surahSelect');
  const verseContainer = document.getElementById('verseContainer');
  const currentSurahTitle = document.getElementById('currentSurahTitle');
  const explainSurahBtn = document.getElementById('explainSurahBtn');

  let currentSurah = null;
  let currentAyahIndex = 0;
  let allVerses = [];

  // URL parametrelerini kontrol et
  const urlParams = new URLSearchParams(window.location.search);
  const surahParam = urlParams.get('surah');
  const ayahParam = urlParams.get('ayah');
  const categoryParam = urlParams.get('category');

  // Sureleri yükle
  try {
    const surahs = await window.QuranAPI.getSurahs();
    
    surahs.forEach(surah => {
      const option = document.createElement('option');
      option.value = surah.number;
      option.textContent = `${surah.number}. ${surah.nameTr} (${surah.name})`;
      surahSelect.appendChild(option);
    });

    // URL'den sure varsa yükle
    if (surahParam) {
      surahSelect.value = surahParam;
      await loadSurah(parseInt(surahParam), ayahParam ? parseInt(ayahParam) - 1 : 0);
    } else if (categoryParam) {
      await loadCategory(categoryParam);
    } else {
      // Varsayılan olarak Fatiha Suresi'ni yükle
      surahSelect.value = '1';
      await loadSurah(1, 0);
    }
  } catch (error) {
    showError('Sureler yüklenirken bir hata oluştu: ' + error.message);
  }

  // Sure seçimi değiştiğinde
  surahSelect.addEventListener('change', async (e) => {
    const surahNumber = parseInt(e.target.value);
    if (surahNumber) {
      await loadSurah(surahNumber, 0);
    }
  });

  // Sure yükleme (global olarak erişilebilir yap)
  async function loadSurah(surahNumber, ayahIndex = 0) {
    try {
      verseContainer.innerHTML = '<div class="quran-loading"><div class="quran-loading__spinner"></div><div class="quran-loading__text">Yükleniyor...</div></div>';
      
      currentSurah = await window.QuranAPI.getSurah(surahNumber);
      allVerses = currentSurah.ayahs;
      currentAyahIndex = Math.max(0, Math.min(ayahIndex, allVerses.length - 1));

      currentSurahTitle.textContent = `${currentSurah.number}. ${currentSurah.nameTr} Suresi`;
      
      renderVerses();
      scrollToAyah(currentAyahIndex);
      
      // Sure açıklama butonunu göster
      if (explainSurahBtn) {
        explainSurahBtn.style.display = 'inline-flex';
      }
    } catch (error) {
      showError('Sure yüklenirken bir hata oluştu: ' + error.message);
    }
  }

  // Kategori yükleme
  async function loadCategory(categoryName) {
    try {
      verseContainer.innerHTML = '<div class="quran-loading"><div class="quran-loading__spinner"></div><div class="quran-loading__text">Yükleniyor...</div></div>';
      
      const verses = await window.QuranAPI.getCategoryVerses(categoryName);
      
      if (verses.length === 0) {
        showError('Bu kategoride ayet bulunamadı.');
        return;
      }

      currentSurah = null;
      allVerses = verses;
      currentAyahIndex = 0;

      currentSurahTitle.textContent = `${categoryName} Kategorisi`;
      
      renderVerses();
      scrollToAyah(0);
      
      // Kategori yüklendiğinde butonu gizle
      if (explainSurahBtn) {
        explainSurahBtn.style.display = 'none';
      }
    } catch (error) {
      showError('Kategori yüklenirken bir hata oluştu: ' + error.message);
    }
  }

  // Ayetleri render et
  function renderVerses() {
    if (!allVerses || allVerses.length === 0) {
      verseContainer.innerHTML = '<div class="quran-error"><div class="quran-error__title">Ayet Bulunamadı</div></div>';
      return;
    }

    const html = allVerses.map((ayah, index) => {
      const surahInfo = ayah.surah || currentSurah;
      const surahNameTr = surahInfo ? (surahInfo.nameTr || window.QuranAPI.getSurahNameTr(surahInfo.number)) : 'Bilinmeyen';
      const surahNumber = surahInfo?.number || currentSurah?.number || 1;
      const ayahNumber = ayah.numberInSurah || (index + 1);
      
      return `
        <div class="quran-verse" id="ayah-${index}" data-index="${index}" data-surah="${surahNumber}" data-ayah="${ayahNumber}">
          <div class="quran-verse__header">
            <div class="quran-verse__number">
              ${surahNameTr} - Ayet ${ayahNumber}
            </div>
          </div>
          <div class="quran-verse__arabic">
            ${ayah.text || ayah.arabic || ''}
          </div>
          <div class="quran-verse__translation">
            ${ayah.translation || ayah.text || ''}
          </div>
          <div class="quran-verse__actions">
            <button class="quran-verse__btn" onclick="playAyah(${surahNumber}, ${ayahNumber})" title="Dinle">
              🎵 Dinle
            </button>
            <button class="quran-verse__btn" onclick="explainAyah(${index})" title="AI Açıklama">
              💬 AI Açıklama
            </button>
          </div>
        </div>
      `;
    }).join('');

    verseContainer.innerHTML = html;
  }

  // Ayete scroll et
  function scrollToAyah(index) {
    const ayahElement = document.getElementById(`ayah-${index}`);
    if (ayahElement) {
      // Aktif ayeti işaretle
      document.querySelectorAll('.quran-verse').forEach(v => v.classList.remove('active'));
      ayahElement.classList.add('active');

      // Smooth scroll ile ayeti merkeze al (daha yumuşak geçiş)
      smoothScrollToElement(ayahElement, 50);
    }
  }

  // Local kullanım için de tanımla (window.smoothScrollToElement zaten yukarıda tanımlı)
  function smoothScrollToElement(element, delay = 0) {
    window.smoothScrollToElement(element, delay);
  }

  // Sure numarası ve ayet numarasına göre scroll et (quran-player.js için)
  window.scrollToAyahByNumber = function(surahNumber, ayahNumber) {
    const verses = document.querySelectorAll('.quran-verse');
    verses.forEach((verse, index) => {
      const verseHeader = verse.querySelector('.quran-verse__number');
      if (verseHeader) {
        const text = verseHeader.textContent;
        const surahMatch = text.match(/(\d+)\s*-\s*Ayet\s*(\d+)/);
        const surahNameMatch = text.match(/(.+?)\s*-\s*Ayet\s*(\d+)/);
        
        let verseSurah = null;
        let verseAyah = null;
        
        if (surahMatch) {
          verseSurah = parseInt(surahMatch[1]);
          verseAyah = parseInt(surahMatch[2]);
        } else if (surahNameMatch) {
          verseAyah = parseInt(surahNameMatch[2]);
          // Mevcut sure numarasını kullan
          if (currentSurah && currentSurah.number) {
            verseSurah = currentSurah.number;
          }
        }
        
        if (verseSurah === surahNumber && verseAyah === ayahNumber) {
          scrollToAyah(index);
          return;
        }
      }
    });
  };

  // Smooth scroll versiyonu (preview mode ile)
  window.scrollToAyahByNumberSmooth = function(surahNumber, ayahNumber, previewMode = false) {
    const verses = document.querySelectorAll('.quran-verse');
    verses.forEach((verse, index) => {
      const verseHeader = verse.querySelector('.quran-verse__number');
      if (verseHeader) {
        const text = verseHeader.textContent;
        const surahMatch = text.match(/(\d+)\s*-\s*Ayet\s*(\d+)/);
        const surahNameMatch = text.match(/(.+?)\s*-\s*Ayet\s*(\d+)/);
        
        let verseSurah = null;
        let verseAyah = null;
        
        if (surahMatch) {
          verseSurah = parseInt(surahMatch[1]);
          verseAyah = parseInt(surahMatch[2]);
        } else if (surahNameMatch) {
          verseAyah = parseInt(surahNameMatch[2]);
          // Mevcut sure numarasını kullan
          if (currentSurah && currentSurah.number) {
            verseSurah = currentSurah.number;
          }
        }
        
        if (verseSurah === surahNumber && verseAyah === ayahNumber) {
          if (previewMode) {
            // Preview mode: sadece scroll yap, active class ekleme
            verse.classList.add('next-preview');
            // Global veya local fonksiyonu kullan
            if (window.smoothScrollToElement && typeof window.smoothScrollToElement === 'function') {
              window.smoothScrollToElement(verse, 50);
            } else if (typeof smoothScrollToElement === 'function') {
              smoothScrollToElement(verse, 50);
            } else {
              verse.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          } else {
            // Normal mode: active class ekle ve scroll yap
            document.querySelectorAll('.quran-verse').forEach(v => v.classList.remove('active', 'next-preview'));
            verse.classList.add('active');
            // Global veya local fonksiyonu kullan
            if (window.smoothScrollToElement && typeof window.smoothScrollToElement === 'function') {
              window.smoothScrollToElement(verse, 50);
            } else if (typeof smoothScrollToElement === 'function') {
              smoothScrollToElement(verse, 50);
            } else {
              verse.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
          return;
        }
      }
    });
  };

  // Hata göster
  function showError(message) {
    verseContainer.innerHTML = `
      <div class="quran-error">
        <div class="quran-error__title">Hata</div>
        <div class="quran-error__message">${message}</div>
      </div>
    `;
  }

  // Sure açıklama butonu event listener
  if (explainSurahBtn) {
    explainSurahBtn.addEventListener('click', async () => {
      if (!currentSurah || !allVerses || allVerses.length === 0) {
        alert('Lütfen önce bir sure yükleyin.');
        return;
      }

      if (window.QuranAI) {
        try {
          explainSurahBtn.disabled = true;
          explainSurahBtn.textContent = '⏳ Açıklama hazırlanıyor...';

          // Tüm ayetlerin birleşik metnini oluştur
          const allVersesText = allVerses.map((ayah, index) => {
            return `Ayet ${ayah.numberInSurah || (index + 1)}: ${ayah.translation || ayah.text || ''}`;
          }).join('\n\n');

          const surahPrompt = `${currentSurah.nameTr} Suresi (${currentSurah.number}. Sure)\n\n` +
            `Toplam Ayet Sayısı: ${currentSurah.numberOfAyahs}\n\n` +
            `Ayetler:\n${allVersesText}\n\n` +
            `Bu sureyi genel olarak açıkla ve ana temalarını belirt.`;

          const explanation = await window.QuranAI.askQuestion(surahPrompt);

          // Açıklamayı sayfanın üstüne ekle
          const explanationContainer = document.createElement('div');
          explanationContainer.className = 'quran-ai-explanation';
          explanationContainer.style.marginBottom = '30px';
          explanationContainer.innerHTML = `
            <div class="quran-ai-explanation__header">
              <span class="quran-ai-explanation__title">AI Sure Açıklaması</span>
              <span class="quran-ai-explanation__badge">AI</span>
              <button onclick="this.parentElement.parentElement.remove()" style="
                margin-left: auto;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                color: var(--quran-text);
                padding: 4px 12px;
                cursor: pointer;
                font-size: 12px;
              ">✕ Kapat</button>
            </div>
            <div class="quran-ai-explanation__content">
              ${explanation.replace(/\n/g, '<br>')}
            </div>
            <div class="quran-ai-explanation__disclaimer">
              ⚠️ Bu açıklama AI tarafından üretilmiştir. Doğru bilgi için güvenilir tefsir kaynaklarına başvurunuz.
            </div>
          `;

          verseContainer.insertBefore(explanationContainer, verseContainer.firstChild);

          // Scroll to explanation
          explanationContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

          explainSurahBtn.disabled = false;
          explainSurahBtn.textContent = '💬 Sure AI Açıklama';
        } catch (error) {
          console.error('Sure açıklama hatası:', error);
          alert('Açıklama alınırken bir hata oluştu: ' + error.message);
          explainSurahBtn.disabled = false;
          explainSurahBtn.textContent = '💬 Sure AI Açıklama';
        }
      } else {
        alert('AI servisi yüklenemedi.');
      }
    });
  }

  // Global fonksiyonlar
  window.loadSurah = loadSurah; // loadSurah'ı global yap
  
  window.playAyah = function(surahNumber, ayahNumber) {
    if (window.QuranPlayer) {
      window.QuranPlayer.playAyah(surahNumber, ayahNumber);
    }
  };

  window.explainAyah = async function(index) {
    const ayah = allVerses[index];
    if (!ayah) return;

    if (window.QuranAI) {
      try {
        const verseElement = document.getElementById(`ayah-${index}`);
        if (!verseElement) return;

        // Açıklama kutusunu bul veya oluştur
        let explanationBox = verseElement.querySelector('.quran-ai-explanation');
        if (!explanationBox) {
          explanationBox = document.createElement('div');
          explanationBox.className = 'quran-ai-explanation';
          verseElement.appendChild(explanationBox);
        }

        explanationBox.innerHTML = `
          <div class="quran-ai-explanation__header">
            <span class="quran-ai-explanation__title">AI Açıklama</span>
            <span class="quran-ai-explanation__badge">AI</span>
          </div>
          <div class="quran-ai-explanation__content">
            <div class="quran-loading__spinner" style="width: 30px; height: 30px; margin: 0 auto;"></div>
            <div style="text-align: center; margin-top: 10px; color: var(--quran-text-secondary);">Açıklama hazırlanıyor...</div>
          </div>
        `;

        const question = `Bu ayeti açıkla: ${ayah.translation || ayah.text}`;
        const explanation = await window.QuranAI.explainAyah(ayah, question);
        
        explanationBox.innerHTML = `
          <div class="quran-ai-explanation__header">
            <span class="quran-ai-explanation__title">AI Açıklama</span>
            <span class="quran-ai-explanation__badge">AI</span>
          </div>
          <div class="quran-ai-explanation__content">
            ${explanation}
          </div>
          <div class="quran-ai-explanation__disclaimer">
            ⚠️ Bu açıklama AI tarafından üretilmiştir. Doğru bilgi için güvenilir tefsir kaynaklarına başvurunuz.
          </div>
        `;

        // Scroll to explanation
        explanationBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (error) {
        console.error('AI açıklama hatası:', error);
        alert('Açıklama alınırken bir hata oluştu.');
      }
    } else {
      alert('AI servisi yüklenemedi.');
    }
  };

  // Klavye navigasyonu (sadece ok tuşları ile scroll)
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
      return;
    }
    
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (currentAyahIndex > 0) {
        currentAyahIndex--;
        scrollToAyah(currentAyahIndex);
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (currentAyahIndex < allVerses.length - 1) {
        currentAyahIndex++;
        scrollToAyah(currentAyahIndex);
      }
    }
  });
});

