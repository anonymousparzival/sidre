// Global Müzik Yöneticisi - Sayfalar arası müzik yönetimi
// localStorage ile pozisyon saklama ve sayfalar arası senkronizasyon

class MusicManager {
  constructor() {
    this.audio = null;
    this.audioUrl = "https://cdn.pixabay.com/audio/2024/02/14/audio_b9bc3934cc.mp3";
    this.isPlaying = false;
    this.wasPausedByQuran = false; // Kuran tarafından durduruldu mu?
    this.lastPosition = 0;
    this.intervalId = null;
    this.checkInterval = 100; // 100ms'de bir pozisyonu kaydet
    
    this.init();
  }

  init() {
    // localStorage'dan pozisyonu yükle
    const savedPosition = localStorage.getItem('backgroundMusicPosition');
    const wasPlaying = localStorage.getItem('backgroundMusicPlaying') === 'true';
    this.wasPausedByQuran = localStorage.getItem('backgroundMusicPausedByQuran') === 'true';
    
    // Audio nesnesini oluştur
    this.audio = new Audio(this.audioUrl);
    
    // Pozisyonu geri yükle
    if (savedPosition && parseFloat(savedPosition) > 0) {
      this.audio.currentTime = parseFloat(savedPosition);
      this.lastPosition = parseFloat(savedPosition);
    }
    
    // Otomatik çalma devre dışı (tarayıcı politikası)
    this.audio.autoplay = false;
    this.audio.loop = true;
    
    // Event listener'lar
    this.audio.addEventListener('loadedmetadata', () => {
      // Metadata yüklendiğinde pozisyonu ayarla
      if (this.lastPosition > 0) {
        this.audio.currentTime = this.lastPosition;
      }
    });
    
    this.audio.addEventListener('timeupdate', () => {
      this.lastPosition = this.audio.currentTime;
    });
    
    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.saveState();
    });
    
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.saveState();
    });
    
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.saveState();
    });
    
    // Pozisyonu periyodik olarak kaydet
    this.startPositionSaving();
    
    // Eğer önceki sayfada çalıyorsa ve kuran tarafından durdurulmamışsa, devam et
    if (wasPlaying && !this.wasPausedByQuran) {
      // Kullanıcı etkileşimi bekle (tarayıcı politikası)
      document.addEventListener('click', () => {
        if (!this.isPlaying && !this.wasPausedByQuran) {
          this.play();
        }
      }, { once: true });
      
      // Veya sayfa yüklendiğinde otomatik çal (eğer izin varsa)
      window.addEventListener('load', () => {
        if (!this.isPlaying && !this.wasPausedByQuran) {
          this.play().catch(() => {
            // Otomatik çalma engellendi, sessizce devam et
          });
        }
      });
    }
  }

  startPositionSaving() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => {
      if (this.audio && this.isPlaying) {
        localStorage.setItem('backgroundMusicPosition', this.audio.currentTime.toString());
      }
    }, this.checkInterval);
  }

  play() {
    if (!this.audio) return Promise.resolve();
    
    // Kuran çalıyor mu kontrol et
    if (window.QuranPlayer && window.QuranPlayer.instance && window.QuranPlayer.instance.isPlaying) {
      // Kuran çalıyorsa müziği başlatma
      return Promise.resolve();
    }
    
    this.wasPausedByQuran = false;
    this.saveState();
    return this.audio.play();
  }

  pause() {
    if (!this.audio) return;
    this.audio.pause();
    this.saveState();
  }

  stop() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.lastPosition = 0;
    this.saveState();
  }

  pauseForQuran() {
    // Kuran çalarken müziği durdur
    if (this.audio && this.isPlaying) {
      this.pause();
      this.wasPausedByQuran = true;
      this.saveState();
    }
  }

  resumeAfterQuran() {
    // Kuran durduktan sonra müziği devam ettir (eğer kullanıcı durdurmadıysa)
    if (this.audio && this.wasPausedByQuran && !this.isPlaying) {
      this.wasPausedByQuran = false;
      this.play().catch(() => {
        // Otomatik çalma engellendi
      });
    }
  }

  saveState() {
    if (this.audio) {
      localStorage.setItem('backgroundMusicPosition', this.audio.currentTime.toString());
      localStorage.setItem('backgroundMusicPlaying', this.isPlaying.toString());
      localStorage.setItem('backgroundMusicPausedByQuran', this.wasPausedByQuran.toString());
    }
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
  }
}

// Global instance oluştur
window.MusicManager = MusicManager;
window.musicManager = new MusicManager();

