// FLORES.html için müzik entegrasyonu
// Kuran durdurulduğunda şeffaf oynatma butonu göster

document.addEventListener('DOMContentLoaded', () => {
  const musicResumeBtn = document.getElementById('musicResumeBtn');
  
  if (!musicResumeBtn || !window.musicManager) {
    return;
  }

  // Müzik yöneticisi hazır olduğunda butonu kontrol et
  const checkMusicButton = () => {
    if (window.musicManager) {
      const wasPausedByQuran = window.musicManager.wasPausedByQuran;
      const isQuranPlaying = window.QuranPlayer && window.QuranPlayer.instance && window.QuranPlayer.instance.isPlaying;
      
      // Kuran çalmıyorsa ve müzik kuran tarafından durdurulmuşsa butonu göster
      if (!isQuranPlaying && wasPausedByQuran && !window.musicManager.isPlaying) {
        musicResumeBtn.style.display = 'block';
      } else {
        musicResumeBtn.style.display = 'none';
      }
    }
  };

  // Müzik oynatma butonu tıklama
  musicResumeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.musicManager) {
      window.musicManager.play().then(() => {
        musicResumeBtn.style.display = 'none';
        window.musicManager.wasPausedByQuran = false;
        window.musicManager.saveState();
      }).catch(() => {
        // Otomatik çalma engellendi
      });
    }
  });

  // Periyodik olarak buton durumunu kontrol et
  setInterval(checkMusicButton, 500);

  // İlk kontrol
  setTimeout(checkMusicButton, 1000);
});

