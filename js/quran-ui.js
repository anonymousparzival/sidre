// Kur'an UI Yönetimi - Menü ve Overlay Sistemi

document.addEventListener('DOMContentLoaded', () => {
  // Menü elementleri
  const quranMenu = document.getElementById('quranMenu');
  const menuToggle = document.getElementById('menuToggle');
  const menuNav = document.getElementById('menuNav');
  const menuItems = document.querySelectorAll('.quran-menu__item');
  const overlay = document.getElementById('quranOverlay');
  const overlayContent = document.getElementById('overlayContent');
  const closeOverlay = document.getElementById('closeOverlay');

  // Menü görünürlüğü CSS animasyonu ile yönetiliyor (7 saniye sonra fadeInMenu)
  // Ekstra JavaScript gerekmez, CSS animasyonu zaten opacity: 0'dan opacity: 1'e geçiyor

  // Menü toggle
  if (menuToggle && menuNav) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      menuToggle.classList.toggle('active');
      menuNav.classList.toggle('active');
    });

    // Dışarı tıklandığında menüyü kapat
    document.addEventListener('click', (e) => {
      if (!quranMenu.contains(e.target)) {
        menuToggle.classList.remove('active');
        menuNav.classList.remove('active');
      }
    });
  }

  // Menü item tıklamaları
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const action = item.getAttribute('data-action');
      handleMenuAction(action);
      menuToggle.classList.remove('active');
      menuNav.classList.remove('active');
    });
  });

  // Overlay kapatma
  if (closeOverlay) {
    closeOverlay.addEventListener('click', () => {
      hideOverlay();
    });
  }

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        hideOverlay();
      }
    });
  }

  // ESC tuşu ile overlay kapatma
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && overlay.style.display !== 'none') {
      hideOverlay();
    }
  });

  // Menü aksiyonları
  function handleMenuAction(action) {
    switch(action) {
      case 'read':
        window.location.href = './quran.html';
        break;
      case 'listen':
        showListenModal();
        break;
      case 'search':
        showSearchModal();
        break;
      case 'categories':
        showCategoriesModal();
        break;
      case 'ai':
        showAIModal();
        break;
      default:
        console.log('Bilinmeyen aksiyon:', action);
    }
  }

  // Overlay göster/gizle fonksiyonları
  function showOverlay(content) {
    if (overlay && overlayContent) {
      overlayContent.innerHTML = content;
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  function hideOverlay() {
    if (overlay) {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  // Modal içerikleri
  function showListenModal() {
    const content = `
      <div class="quran-modal-listen">
        <h2 style="color: #ffeb3b; margin-bottom: 20px; font-size: 24px;">🎵 Kur'an Dinle</h2>
        <div style="color: rgba(255, 255, 255, 0.9); margin-bottom: 20px;">
          <p>Mini player'ı kullanarak Kur'an dinleyebilirsiniz.</p>
          <p style="margin-top: 10px; font-size: 14px; color: rgba(255, 255, 255, 0.7);">
            Mini player sağ alt köşede görünecektir.
          </p>
        </div>
        <button id="startListening" style="
          background: linear-gradient(135deg, #ffeb3b, #ffc107);
          color: #000;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        ">Dinlemeye Başla</button>
      </div>
    `;
    showOverlay(content);

    // Dinlemeye başla butonu
    setTimeout(() => {
      const startBtn = document.getElementById('startListening');
      if (startBtn) {
        startBtn.addEventListener('click', () => {
          if (window.QuranPlayer) {
            window.QuranPlayer.startListening();
          }
          hideOverlay();
        });
      }
    }, 100);
  }

  function showSearchModal() {
    const content = `
      <div class="quran-modal-search">
        <h2 style="color: #ffeb3b; margin-bottom: 20px; font-size: 24px;">🔍 Kur'an'da Arama</h2>
        <div style="margin-bottom: 20px;">
          <input type="text" id="searchInput" placeholder="Kelime veya ayet numarası ara..." style="
            width: 100%;
            padding: 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #fff;
            font-size: 16px;
            margin-bottom: 15px;
          ">
          <div id="searchResults" style="
            max-height: 400px;
            overflow-y: auto;
            color: rgba(255, 255, 255, 0.9);
          "></div>
        </div>
      </div>
    `;
    showOverlay(content);

    // Arama fonksiyonunu bağla
    setTimeout(() => {
      const searchInput = document.getElementById('searchInput');
      const searchResults = document.getElementById('searchResults');
      
      if (searchInput && searchResults) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
          clearTimeout(searchTimeout);
          const query = e.target.value.trim();
          
          if (query.length < 2) {
            searchResults.innerHTML = '<p style="color: rgba(255, 255, 255, 0.5);">En az 2 karakter giriniz.</p>';
            return;
          }

          searchTimeout = setTimeout(async () => {
            searchResults.innerHTML = '<p style="color: rgba(255, 255, 255, 0.5);">Aranıyor...</p>';
            if (window.QuranAPI) {
              try {
                const results = await window.QuranAPI.search(query);
                displaySearchResults(results, searchResults);
              } catch (error) {
                searchResults.innerHTML = '<p style="color: #ff6b6b;">Arama sırasında bir hata oluştu.</p>';
              }
            } else {
              searchResults.innerHTML = '<p style="color: rgba(255, 255, 255, 0.5);">API yükleniyor...</p>';
            }
          }, 500);
        });
      }
    }, 100);
  }

  function displaySearchResults(results, container) {
    if (!results || results.length === 0) {
      container.innerHTML = '<p style="color: rgba(255, 255, 255, 0.5);">Sonuç bulunamadı.</p>';
      return;
    }

    const html = results.slice(0, 10).map(result => `
      <div class="search-result-item" style="
        padding: 15px;
        margin-bottom: 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        border-left: 3px solid #ffeb3b;
        cursor: pointer;
        transition: background 0.2s;
      " data-surah="${result.surah}" data-ayah="${result.ayah}">
        <div style="font-weight: 600; color: #ffeb3b; margin-bottom: 5px;">
          ${result.surahName} - Ayet ${result.ayah}
        </div>
        <div style="font-size: 14px; line-height: 1.6;">
          ${result.text}
        </div>
      </div>
    `).join('');

    container.innerHTML = html;

    // Sonuç tıklamaları
    container.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const surah = item.getAttribute('data-surah');
        const ayah = item.getAttribute('data-ayah');
        window.location.href = `./quran.html?surah=${surah}&ayah=${ayah}`;
      });
    });
  }

  function showCategoriesModal() {
    const categories = [
      { name: 'Sabır', icon: '⏳' },
      { name: 'Şükür', icon: '🙏' },
      { name: 'Dua', icon: '🤲' },
      { name: 'Merhamet', icon: '💚' },
      { name: 'Adalet', icon: '⚖️' },
      { name: 'İlim', icon: '📖' },
    ];

    const content = `
      <div class="quran-modal-categories">
        <h2 style="color: #ffeb3b; margin-bottom: 20px; font-size: 24px;">📚 Kategoriler</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
          ${categories.map(cat => `
            <div class="category-card" style="
              padding: 20px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 12px;
              cursor: pointer;
              transition: all 0.2s;
              text-align: center;
            " data-category="${cat.name}">
              <div style="font-size: 32px; margin-bottom: 10px;">${cat.icon}</div>
              <div style="color: #fff; font-weight: 600; font-size: 16px;">${cat.name}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    showOverlay(content);

    // Kategori tıklamaları
    setTimeout(() => {
      document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
          const category = card.getAttribute('data-category');
          window.location.href = `./quran.html?category=${category}`;
        });
      });
    }, 100);
  }

  function showAIModal() {
    const content = `
      <div class="quran-modal-ai">
        <h2 style="color: #ffeb3b; margin-bottom: 10px; font-size: 24px;">💬 AI Soru-Cevap</h2>
        <p style="color: rgba(255, 255, 255, 0.7); font-size: 14px; margin-bottom: 20px;">
          Ayetler hakkında soru sorabilir veya açıklama talep edebilirsiniz.
        </p>
        <div style="
          background: rgba(255, 235, 59, 0.1);
          border-left: 3px solid #ffeb3b;
          padding: 12px;
          margin-bottom: 20px;
          border-radius: 4px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
        ">
          <strong>⚠️ Önemli:</strong> AI yanıtları yardımcı açıklama niteliğindedir. 
          Doğru bilgi için güvenilir tefsir kaynaklarına başvurunuz.
        </div>
        <div style="margin-bottom: 15px;">
          <input type="text" id="aiQuestion" placeholder="Sorunuzu veya ayet numarasını girin..." style="
            width: 100%;
            padding: 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #fff;
            font-size: 16px;
          ">
        </div>
        <button id="askAI" style="
          background: linear-gradient(135deg, #ffeb3b, #ffc107);
          color: #000;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          margin-bottom: 20px;
        ">Soru Sor</button>
        <div id="aiResponse" style="
          min-height: 100px;
          padding: 15px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.6;
          display: none;
        "></div>
      </div>
    `;
    showOverlay(content);

    // AI soru sorma
    setTimeout(() => {
      const questionInput = document.getElementById('aiQuestion');
      const askBtn = document.getElementById('askAI');
      const aiResponse = document.getElementById('aiResponse');

      if (askBtn && questionInput && aiResponse) {
        askBtn.addEventListener('click', async () => {
          const question = questionInput.value.trim();
          if (!question) {
            alert('Lütfen bir soru giriniz.');
            return;
          }

          askBtn.disabled = true;
          askBtn.textContent = 'Yanıtlanıyor...';
          aiResponse.style.display = 'block';
          aiResponse.innerHTML = '<p style="color: rgba(255, 255, 255, 0.5);">AI düşünüyor...</p>';

          if (window.QuranAI) {
            try {
              const response = await window.QuranAI.askQuestion(question);
              aiResponse.innerHTML = `<div style="white-space: pre-wrap;">${response}</div>`;
            } catch (error) {
              aiResponse.innerHTML = '<p style="color: #ff6b6b;">Bir hata oluştu. Lütfen tekrar deneyin.</p>';
            }
          } else {
            aiResponse.innerHTML = '<p style="color: #ff6b6b;">AI servisi yüklenemedi.</p>';
          }

          askBtn.disabled = false;
          askBtn.textContent = 'Soru Sor';
        });

        // Enter tuşu ile soru sor
        questionInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            askBtn.click();
          }
        });
      }
    }, 100);
  }

  // Global fonksiyonlar
  window.QuranUI = {
    showOverlay,
    hideOverlay,
    showListenModal,
    showSearchModal,
    showCategoriesModal,
    showAIModal
  };
});

