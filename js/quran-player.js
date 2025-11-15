// Kur'an Ses Çalma ve Ayet Takibi Sistemi

class QuranPlayer {
  constructor() {
    this.audio = new Audio();
    this.currentSurah = null;
    this.currentAyah = null;
    this.currentAyahIndex = 0;
    this.isPlaying = false;
    this.speed = 1;
    this.ayahHighlights = new Map(); // Ayet vurgulama için
    this.updateInterval = null;
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Audio event listeners
    this.audio.addEventListener('loadedmetadata', () => {
      this.updateAudioInfo();
    });

    this.audio.addEventListener('ended', () => {
      this.onAyahEnd();
    });

    this.audio.addEventListener('timeupdate', () => {
      this.onTimeUpdate();
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      this.handleAudioError();
    });

    // Speed control
    const speedSelect = document.getElementById('speedSelect');
    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        this.speed = parseFloat(e.target.value);
        this.audio.playbackRate = this.speed;
      });
    }

    // Player controls (quran.html)
    const audioPlayBtn = document.getElementById('audioPlayBtn');
    const audioPrevBtn = document.getElementById('audioPrevBtn');
    const audioNextBtn = document.getElementById('audioNextBtn');
    const nextAyahBtn = document.getElementById('nextAyahBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    
    // Sonraki ayete geç butonu
    if (nextAyahBtn) {
      nextAyahBtn.addEventListener('click', () => {
        nextAyahBtn.style.display = 'none';
        this.playNextAyah();
      });
    }

    if (audioPlayBtn) {
      audioPlayBtn.addEventListener('click', () => {
        this.togglePlayPause();
      });
    }

    if (audioPrevBtn) {
      audioPrevBtn.addEventListener('click', () => {
        this.playPreviousAyah();
      });
    }

    if (audioNextBtn) {
      audioNextBtn.addEventListener('click', () => {
        this.playNextAyah();
      });
    }

    // Mini player controls (FLORES.html)
    const miniPlayBtn = document.getElementById('playPauseBtn');
    const miniPrevBtn = document.getElementById('prevAyah');
    const miniNextBtn = document.getElementById('nextAyah');
    const miniPlayer = document.getElementById('miniPlayer');

    if (miniPlayBtn) {
      miniPlayBtn.addEventListener('click', () => {
        this.togglePlayPause();
      });
    }

    if (miniPrevBtn) {
      miniPrevBtn.addEventListener('click', () => {
        this.playPreviousAyah();
      });
    }

    if (miniNextBtn) {
      miniNextBtn.addEventListener('click', () => {
        this.playNextAyah();
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space' && (audioPlayer || miniPlayer)) {
        e.preventDefault();
        this.togglePlayPause();
      }
    });
  }

  // Belirli bir ayeti çal
  async playAyah(surahNumber, ayahNumber) {
    try {
      this.currentSurah = surahNumber;
      this.currentAyah = ayahNumber;
      this.transitionStarted = false; // Reset transition flag
      
      // Sonraki ayete geç butonunu gizle
      const nextAyahBtn = document.getElementById('nextAyahBtn');
      if (nextAyahBtn) {
        nextAyahBtn.style.display = 'none';
      }
      
      // Preview class'larını temizle
      document.querySelectorAll('.quran-verse.next-preview').forEach(v => {
        v.classList.remove('next-preview');
      });
      
      const audioUrl = window.QuranAPI.getAudioUrl(surahNumber, ayahNumber);
      
      // Audio URL'den gerçek ses dosyasını al
      const response = await fetch(audioUrl);
      const data = await response.json();
      
      if (data.code === 200 && data.data && data.data.audio) {
        this.audio.src = data.data.audio;
        this.audio.playbackRate = this.speed;
        
        await this.audio.play();
        this.isPlaying = true;
        this.updatePlayButton();
        this.showPlayer();
        this.updatePlayerInfo();
        
        // Ayeti vurgula ve smooth scroll ile merkeze al (ses başladığında)
        setTimeout(() => {
          this.highlightCurrentAyah();
        }, 250);
        
        return true;
      } else {
        throw new Error('Ses dosyası bulunamadı');
      }
    } catch (error) {
      console.error('Ayet çalınırken hata:', error);
      this.handleAudioError();
      return false;
    }
  }

  // Oynat/Duraklat
  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      if (this.audio.src) {
        this.resume();
      } else {
        // Varsayılan olarak Fatiha Suresi 1. ayeti çal
        this.playAyah(1, 1);
      }
    }
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.updatePlayButton();
    
    // Kuran durduğunda müzik devam butonunu göster
    if (window.musicManager) {
      window.musicManager.resumeAfterQuran();
      // Şeffaf oynatma butonunu göster
      const musicResumeBtn = document.getElementById('musicResumeBtn');
      if (musicResumeBtn && window.musicManager.wasPausedByQuran) {
        musicResumeBtn.style.display = 'block';
      }
    }
  }

  resume() {
    this.audio.play();
    this.isPlaying = true;
    this.updatePlayButton();
    
    // Kuran devam ederken müziği durdur
    if (window.musicManager) {
      window.musicManager.pauseForQuran();
      // Şeffaf oynatma butonunu gizle
      const musicResumeBtn = document.getElementById('musicResumeBtn');
      if (musicResumeBtn) {
        musicResumeBtn.style.display = 'none';
      }
    }
  }

  // Önceki ayet
  async playPreviousAyah() {
    if (this.currentSurah && this.currentAyah) {
      let newSurah = this.currentSurah;
      let newAyah = this.currentAyah - 1;

      // Eğer ayet 1'den küçükse, önceki sureye geç
      if (newAyah < 1) {
        newSurah = newSurah - 1;
        if (newSurah < 1) {
          newSurah = 114; // Son sure
        }
        
        // Önceki surenin son ayetini bul
        try {
          const surah = await window.QuranAPI.getSurah(newSurah);
          newAyah = surah.numberOfAyahs;
        } catch (error) {
          console.error('Önceki sure alınırken hata:', error);
          return;
        }
      }

      await this.playAyah(newSurah, newAyah);
    }
  }

  // Sonraki ayet
  async playNextAyah() {
    if (this.currentSurah && this.currentAyah) {
      let newSurah = this.currentSurah;
      let newAyah = this.currentAyah + 1;

      // Eğer ayet sayısı fazlaysa, dur (kullanıcı manuel olarak sonraki sureye geçebilir)
      try {
        const currentSurahData = await window.QuranAPI.getSurah(newSurah);
        if (newAyah > currentSurahData.numberOfAyahs) {
          // Sure bitti, dur ve kullanıcıya bildir
          this.pause();
          
          // Kullanıcıya sonraki sureye geçmek isteyip istemediğini sor (modern modal ile)
          const nextSurah = newSurah + 1;
          if (nextSurah <= 114) {
            const surahName = window.QuranAPI.getSurahNameTr(nextSurah);
            const userWantsNext = await this.showSurahTransitionModal(newSurah, surahName, nextSurah);
            
            if (userWantsNext) {
              // Sayfayı güncelle ve sesi başlat
              await this.transitionToNextSurah(nextSurah);
            }
          } else {
            await this.showQuranCompletedModal();
          }
          
          return;
        }

        await this.playAyah(newSurah, newAyah);
      } catch (error) {
        console.error('Sonraki ayet alınırken hata:', error);
      }
    }
  }

  // Ayet bittiğinde
  onAyahEnd() {
    // Önce highlight'ı yumuşak bir şekilde kaldır
    document.querySelectorAll('.quran-verse.active').forEach(v => {
      v.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      v.classList.remove('active');
    });
    
    // Preview class'ını kaldır
    document.querySelectorAll('.quran-verse.next-preview').forEach(v => {
      v.classList.remove('next-preview');
    });
    
    // Transition flag'ini sıfırla
    this.transitionStarted = false;
    
    // Sonraki ayete geç butonunu gizle (otomatik geçiş için)
    const nextAyahBtn = document.getElementById('nextAyahBtn');
    if (nextAyahBtn) {
      nextAyahBtn.style.display = 'none';
    }
    
    // Eğer sonraki ayet yoksa, kuran bitmiş demektir - müzik butonunu göster
    const hasNext = this.currentSurah && this.currentAyah;
    if (!hasNext && window.musicManager) {
      window.musicManager.resumeAfterQuran();
      const musicResumeBtn = document.getElementById('musicResumeBtn');
      if (musicResumeBtn && window.musicManager.wasPausedByQuran) {
        musicResumeBtn.style.display = 'block';
      }
    }
    
    // Otomatik olarak sonraki ayete geç (smooth scroll ile)
    setTimeout(() => {
      this.playNextAyah();
    }, 500); // Optimize edilmiş gecikme ile smooth geçiş
  }

  // Zaman güncellemesi
  onTimeUpdate() {
    if (!this.isPlaying || !this.audio.duration) return;
    
    const currentTime = this.audio.currentTime;
    const duration = this.audio.duration;
    const remaining = duration - currentTime;
    
    // Ayet sonuna yaklaşırken (son 1 saniye) geçişi başlat
    if (remaining > 0 && remaining <= 1 && !this.transitionStarted) {
      this.startTransitionToNext();
      this.transitionStarted = true;
    }
    
    // Ses çalarken aktif ayeti sürekli kontrol et (daha responsive highlight için)
    // Her 1 saniyede bir kontrol et (gereksiz scroll'u önlemek için süreyi artırdık)
    // Ama ayet bitmeden önce aktif ayeti değiştirme (preview mode varsa)
    if (Date.now() - (this.lastHighlightTime || 0) > 1000) {
      // Preview mode aktifse ve ayet bitmesine yaklaşıyorsa, highlight yapma
      const hasPreview = document.querySelector('.quran-verse.next-preview');
      if (hasPreview && remaining <= 1.2) {
        // Preview mode aktifse ve ayet bitmesine 1.2 saniyeden az kaldıysa, hiçbir şey yapma
        this.lastHighlightTime = Date.now();
        return;
      }
      
      // Normal highlight yap (sadece ayet değiştiyse scroll yapacak)
      this.highlightCurrentAyah();
      this.lastHighlightTime = Date.now();
    }
  }

  // Bir sonraki ayete geçiş başlat (ayet bitmeden önce)
  startTransitionToNext() {
    if (!this.currentSurah || !this.currentAyah) return;

    // Sonraki ayeti hazırla
    let nextSurah = this.currentSurah;
    let nextAyah = this.currentAyah + 1;

    // Eğer ayet sayısı fazlaysa, sonraki sureye geç
    window.QuranAPI.getSurah(nextSurah).then(currentSurahData => {
      if (nextAyah > currentSurahData.numberOfAyahs) {
        nextSurah = nextSurah + 1;
        if (nextSurah > 114) {
          nextSurah = 1;
        }
        nextAyah = 1;
      }

      // Sonraki ayeti önceden smooth scroll ile merkeze al (sadece scroll, aktif ayeti değiştirme)
      if (window.scrollToAyahByNumberSmooth) {
        // Ayet sonuna 1 saniye kala smooth scroll başlat (preview mode - aktif ayeti değiştirme)
        setTimeout(() => {
          window.scrollToAyahByNumberSmooth(nextSurah, nextAyah, true); // true = preview mode (sadece scroll)
        }, 200);
      } else {
        // Fallback - sadece scroll yap, aktif ayeti değiştirme
        setTimeout(() => {
          const verses = document.querySelectorAll('.quran-verse');
          verses.forEach(verse => {
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
                const verseData = verse.getAttribute('data-surah');
                if (verseData) {
                  verseSurah = parseInt(verseData);
                }
              }
              
              if (verseSurah === nextSurah && verseAyah === nextAyah) {
                // Sonraki ayete hafif preview efekti ver ve sadece scroll yap
                verse.classList.add('next-preview');
                // Smooth scroll yap ama aktif ayeti değiştirme
                this.smoothScrollToElement(verse, 50);
              }
            }
          });
        }, 200);
      }
    }).catch(err => console.error('Geçiş hazırlığı hatası:', err));
  }

  // Audio bilgilerini güncelle
  updateAudioInfo() {
    // Gerekirse burada audio bilgileri güncellenebilir
  }

  // Player bilgilerini güncelle
  updatePlayerInfo() {
    const surahName = this.currentSurah 
      ? window.QuranAPI.getSurahNameTr(this.currentSurah)
      : '-';
    
    const ayahText = this.currentAyah || '-';

    // quran.html player
    const audioSurah = document.getElementById('audioSurah');
    const audioAyah = document.getElementById('audioAyah');
    
    if (audioSurah) audioSurah.textContent = surahName;
    if (audioAyah) audioAyah.textContent = `Ayet ${ayahText}`;

    // FLORES.html mini player
    const currentSurah = document.getElementById('currentSurah');
    const currentAyah = document.getElementById('currentAyah');
    
    if (currentSurah) currentSurah.textContent = surahName;
    if (currentAyah) currentAyah.textContent = `Ayet ${ayahText}`;
  }

  // Play button güncelle
  updatePlayButton() {
    const audioPlayBtn = document.getElementById('audioPlayBtn');
    const miniPlayBtn = document.getElementById('playPauseBtn');
    
    const icon = this.isPlaying ? '⏸' : '▶';
    
    if (audioPlayBtn) {
      audioPlayBtn.textContent = icon;
      audioPlayBtn.setAttribute('aria-label', this.isPlaying ? 'Duraklat' : 'Oynat');
    }
    
    if (miniPlayBtn) {
      miniPlayBtn.textContent = icon;
      miniPlayBtn.setAttribute('aria-label', this.isPlaying ? 'Duraklat' : 'Oynat');
    }
  }

  // Player'ı göster
  showPlayer() {
    const audioPlayer = document.getElementById('audioPlayer');
    const miniPlayer = document.getElementById('miniPlayer');

    if (audioPlayer) {
      audioPlayer.style.display = 'flex';
    }

    if (miniPlayer) {
      miniPlayer.style.display = 'flex';
    }
  }

  // Player'ı gizle
  hidePlayer() {
    const audioPlayer = document.getElementById('audioPlayer');
    const miniPlayer = document.getElementById('miniPlayer');

    if (audioPlayer) {
      audioPlayer.style.display = 'none';
    }

    if (miniPlayer) {
      miniPlayer.style.display = 'none';
    }
  }

  // Şu anki ayeti vurgula
  highlightCurrentAyah() {
    if (!this.currentSurah || !this.currentAyah) return;
    
    // Preview mode varsa ve ayet bitmesine az kaldıysa, hiçbir şey yapma
    const hasPreview = document.querySelector('.quran-verse.next-preview');
    let remaining = Infinity;
    if (hasPreview && this.audio && this.audio.duration) {
      remaining = this.audio.duration - this.audio.currentTime;
      if (remaining <= 1.2) {
        // Ayet bitmesine 1.2 saniyeden az kaldıysa, hiçbir şey yapma (preview scroll devam etsin)
        return;
      }
    }

    // quran.html'deki ayetleri vurgula
    const verses = document.querySelectorAll('.quran-verse');
    let found = false;
    let targetVerse = null;
    let needsScroll = false; // Scroll gerekip gerekmediğini takip et
    
    // Önce mevcut aktif ayeti bul
    verses.forEach(verse => {
      const verseHeader = verse.querySelector('.quran-verse__number');
      if (verseHeader) {
        const text = verseHeader.textContent;
        // Farklı formatları kontrol et: "Fatiha - Ayet 1" veya "1 - Ayet 1"
        const surahMatch = text.match(/(\d+)\s*-\s*Ayet\s*(\d+)/);
        const surahNameMatch = text.match(/(.+?)\s*-\s*Ayet\s*(\d+)/);
        
        let verseSurah = null;
        let verseAyah = null;
        
        if (surahMatch) {
          verseSurah = parseInt(surahMatch[1]);
          verseAyah = parseInt(surahMatch[2]);
        } else if (surahNameMatch) {
          // Sure ismi ile eşleştirme (quran-reader.js'deki format)
          verseAyah = parseInt(surahNameMatch[2]);
          // data attribute'dan sure numarasını al
          const verseData = verse.getAttribute('data-surah');
          if (verseData) {
            verseSurah = parseInt(verseData);
          } else {
            // İlk ayet ise, sayfanın başlığından sure numarasını al
            const currentTitle = document.getElementById('currentSurahTitle');
            if (currentTitle) {
              const titleMatch = currentTitle.textContent.match(/(\d+)/);
              if (titleMatch) {
                verseSurah = parseInt(titleMatch[1]);
              }
            }
          }
        }
        
        if (verseSurah === this.currentSurah && verseAyah === this.currentAyah) {
          found = true;
          targetVerse = verse;
          
          // Eğer bu ayet zaten aktifse, scroll yapma
          const isAlreadyActive = verse.classList.contains('active');
          if (!isAlreadyActive) {
            needsScroll = true;
          }
        }
      }
    });
    
    // Eğer ayet bulunduysa, vurgulamayı güncelle
    if (found && targetVerse) {
      // Eğer ayet zaten aktifse ve preview yoksa, hiçbir şey yapma (scroll yapma)
      const isAlreadyActive = targetVerse.classList.contains('active');
      if (isAlreadyActive && !hasPreview) {
        // Ayet zaten aktif ve preview yoksa, hiçbir şey yapma
        return;
      }
      
      // Önceki vurgulamayı kaldır (preview hariç)
      verses.forEach(v => {
        if (v !== targetVerse && !v.classList.contains('next-preview')) {
          v.classList.remove('active');
        }
      });
      
      // Ayeti vurgula
      targetVerse.classList.add('active');
      
      // Scroll sadece ayet değiştiğinde veya ilk kez aktif olduğunda yap
      // Ayrıca preview mode varsa ve ayet bitmesine 1.2 saniyeden fazla varsa scroll yap
      if (needsScroll && (!hasPreview || remaining > 1.2)) {
        this.smoothScrollToElement(targetVerse, 100);
      }
    } else {
      // Eşleşmeyen ayetlerden active class'ı kaldır (ama preview'ı koru)
      verses.forEach(v => {
        if (!v.classList.contains('next-preview')) {
          v.classList.remove('active');
        }
      });
    }
    
    // Eğer ayet bulunamadıysa, quran-reader.js'deki global fonksiyonu çağır
    if (!found && window.scrollToAyahByNumber) {
      window.scrollToAyahByNumber(this.currentSurah, this.currentAyah);
    }
  }

  // Smooth scroll fonksiyonu (quran-reader.js'den bağımsız)
  smoothScrollToElement(element, delay = 0) {
    // Önce global fonksiyonu kontrol et
    if (window.smoothScrollToElement && typeof window.smoothScrollToElement === 'function') {
      window.smoothScrollToElement(element, delay);
      return;
    }
    
    // Fallback: Kendi smooth scroll implementasyonu
    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const elementTop = rect.top + scrollTop;
      const elementHeight = rect.height;
      const viewportHeight = window.innerHeight;
      
      const targetScroll = Math.max(0, elementTop - (viewportHeight / 2) + (elementHeight / 2));
      
      const startScroll = scrollTop;
      const distance = targetScroll - startScroll;
      
      const baseDuration = 1400;
      const distanceFactor = Math.min(Math.abs(distance) / 500, 1.5);
      const duration = baseDuration + (distanceFactor * 400);
      
      let startTime = null;
      let lastScroll = startScroll;
      
      const easeOutQuart = (t) => {
        return 1 - Math.pow(1 - t, 4);
      };
      
      const smoothScroll = (currentTime) => {
        if (startTime === null) {
          startTime = currentTime || performance.now();
        }
        
        const elapsed = (currentTime || performance.now()) - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = easeOutQuart(progress);
        const currentScroll = startScroll + distance * ease;
        
        if (Math.abs(currentScroll - lastScroll) > 0.5) {
          window.scrollTo(0, currentScroll);
          lastScroll = currentScroll;
        }
        
        if (progress < 1) {
          requestAnimationFrame(smoothScroll);
        } else {
          window.scrollTo(0, targetScroll);
        }
      };
      
      requestAnimationFrame(smoothScroll);
    }, delay);
  }

  // Hata yönetimi
  handleAudioError() {
    this.isPlaying = false;
    this.updatePlayButton();
    
    // Kullanıcıya bildir (isteğe bağlı)
    console.error('Ses çalma hatası');
  }

  // Dinlemeye başla (FLORES.html için)
  startListening() {
    this.playAyah(1, 1);
  }

  // Sure baştan başlat
  async playSurah(surahNumber, startFromAyah = 1) {
    await this.playAyah(surahNumber, startFromAyah);
  }

  // Durum sıfırla
  reset() {
    this.audio.pause();
    this.audio.src = '';
    this.isPlaying = false;
    this.currentSurah = null;
    this.currentAyah = null;
    this.currentAyahIndex = 0;
    this.updatePlayButton();
  }

  // Hız ayarla
  setSpeed(speed) {
    this.speed = speed;
    this.audio.playbackRate = this.speed;
    
    const speedSelect = document.getElementById('speedSelect');
    if (speedSelect) {
      speedSelect.value = speed.toString();
    }
  }

  // Modern Sure Geçiş Modalı
  async showSurahTransitionModal(currentSurahNumber, currentSurahName, nextSurahNumber) {
    return new Promise((resolve) => {
      const nextSurahName = window.QuranAPI.getSurahNameTr(nextSurahNumber);
      
      const modal = document.createElement('div');
      modal.className = 'surah-transition-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
      `;
      
      modal.innerHTML = `
        <div class="surah-transition-modal__content" style="
          background: linear-gradient(135deg, rgba(10, 10, 20, 0.98) 0%, rgba(26, 26, 46, 0.98) 100%);
          border: 2px solid rgba(255, 235, 59, 0.3);
          border-radius: 20px;
          padding: 40px;
          max-width: 500px;
          width: 90%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 235, 59, 0.2);
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        ">
          <div style="
            font-size: 64px;
            margin-bottom: 20px;
            animation: bounce 1s ease infinite;
          ">✨</div>
          <h2 style="
            color: #ffeb3b;
            font-size: 28px;
            margin-bottom: 15px;
            font-weight: 600;
          ">Sure Tamamlandı</h2>
          <p style="
            color: rgba(255, 255, 255, 0.9);
            font-size: 18px;
            margin-bottom: 10px;
            line-height: 1.6;
          ">
            ${currentSurahNumber}. ${currentSurahName} Suresi tamamlandı.
          </p>
          <p style="
            color: rgba(255, 255, 255, 0.7);
            font-size: 16px;
            margin-bottom: 30px;
          ">
            ${nextSurahNumber}. ${nextSurahName} Suresi'ne geçmek ister misiniz?
          </p>
          <div style="
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
          ">
            <button class="surah-transition-btn surah-transition-btn--primary" style="
              background: linear-gradient(135deg, #ffeb3b, #ffc107);
              color: #000;
              border: none;
              padding: 14px 32px;
              border-radius: 12px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(255, 235, 59, 0.3);
            ">✅ Evet, Devam Et</button>
            <button class="surah-transition-btn surah-transition-btn--secondary" style="
              background: rgba(255, 255, 255, 0.1);
              color: rgba(255, 255, 255, 0.9);
              border: 1px solid rgba(255, 255, 255, 0.2);
              padding: 14px 32px;
              border-radius: 12px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
            ">✕ İptal</button>
          </div>
        </div>
      `;
      
      // CSS animasyonları ekle
      if (!document.getElementById('surah-transition-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'surah-transition-modal-styles';
        style.textContent = `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
          @keyframes slideUp {
            from { 
              transform: translateY(30px);
              opacity: 0;
            }
            to { 
              transform: translateY(0);
              opacity: 1;
            }
          }
          @keyframes slideDown {
            from { 
              transform: translateY(0);
              opacity: 1;
            }
            to { 
              transform: translateY(30px);
              opacity: 0;
            }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .surah-transition-btn--primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 235, 59, 0.5);
          }
          .surah-transition-btn--secondary:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.3);
          }
          .surah-transition-btn:active {
            transform: scale(0.98);
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(modal);
      
      const primaryBtn = modal.querySelector('.surah-transition-btn--primary');
      const secondaryBtn = modal.querySelector('.surah-transition-btn--secondary');
      
      const closeModal = (result) => {
        const content = modal.querySelector('.surah-transition-modal__content');
        if (content) {
          content.style.animation = 'slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
          if (document.body.contains(modal)) {
            document.body.removeChild(modal);
          }
          resolve(result);
        }, 300);
      };
      
      primaryBtn.addEventListener('click', () => closeModal(true));
      secondaryBtn.addEventListener('click', () => closeModal(false));
      
      // ESC tuşu ile kapat
      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          closeModal(false);
          document.removeEventListener('keydown', handleEsc);
        }
      };
      document.addEventListener('keydown', handleEsc);
      
      // Modal dışına tıklama ile kapat
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(false);
        }
      });
    });
  }

  // Kur'an Tamamlandı Modalı
  async showQuranCompletedModal() {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'surah-transition-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
      `;
      
      modal.innerHTML = `
        <div class="surah-transition-modal__content" style="
          background: linear-gradient(135deg, rgba(10, 10, 20, 0.98) 0%, rgba(26, 26, 46, 0.98) 100%);
          border: 2px solid rgba(255, 235, 59, 0.3);
          border-radius: 20px;
          padding: 40px;
          max-width: 500px;
          width: 90%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 235, 59, 0.2);
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        ">
          <div style="
            font-size: 64px;
            margin-bottom: 20px;
          ">🎉</div>
          <h2 style="
            color: #ffeb3b;
            font-size: 28px;
            margin-bottom: 15px;
            font-weight: 600;
          ">Kur'an-ı Kerim Tamamlandı</h2>
          <p style="
            color: rgba(255, 255, 255, 0.9);
            font-size: 18px;
            margin-bottom: 30px;
            line-height: 1.6;
          ">
            Tebrikler! Kur'an-ı Kerim'i tamamladınız.
          </p>
          <button class="surah-transition-btn surah-transition-btn--primary" style="
            background: linear-gradient(135deg, #ffeb3b, #ffc107);
            color: #000;
            border: none;
            padding: 14px 32px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(255, 235, 59, 0.3);
          ">Tamam</button>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const btn = modal.querySelector('.surah-transition-btn--primary');
      
      const closeModal = () => {
        const content = modal.querySelector('.surah-transition-modal__content');
        if (content) {
          content.style.animation = 'slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
          if (document.body.contains(modal)) {
            document.body.removeChild(modal);
          }
          resolve();
        }, 300);
      };
      
      btn.addEventListener('click', closeModal);
      
      // ESC tuşu ile kapat
      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          closeModal();
          document.removeEventListener('keydown', handleEsc);
        }
      };
      document.addEventListener('keydown', handleEsc);
      
      // Modal dışına tıklama ile kapat
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });
    });
  }

  // Sonraki Sureye Geçiş (Sayfayı güncelle ve sesi başlat)
  async transitionToNextSurah(nextSurahNumber) {
    // quran.html sayfasındaysa sayfayı güncelle
    if (window.location.pathname.includes('quran.html') || window.location.pathname.includes('quran')) {
      // loadSurah fonksiyonunu çağır (quran-reader.js'den)
      if (window.loadSurah && typeof window.loadSurah === 'function') {
        await window.loadSurah(nextSurahNumber, 0);
      }
      
      // Sure dropdown'ını güncelle
      const surahSelect = document.getElementById('surahSelect');
      if (surahSelect) {
        surahSelect.value = nextSurahNumber.toString();
      }
    }
    
    // Ses çalmayı başlat
    await this.playAyah(nextSurahNumber, 1);
  }
}

// Global instance oluştur
window.QuranPlayer = new QuranPlayer();

