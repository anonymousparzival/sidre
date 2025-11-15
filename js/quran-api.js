// Kur'an API Entegrasyonu - alquran.cloud
// API Dokümantasyonu: https://alquran.cloud/api

const QURAN_API_BASE = 'https://api.alquran.cloud/v1';
const ARABIC_EDITION = 'quran-uthmani';
const TURKISH_EDITION = 'tr.diyanet'; // Diyanet İşleri Başkanlığı çevirisi
const AUDIO_EDITION = 'ar.alafasy'; // Mishary Alafasy ses kaydı

// Türkçe sure isimleri
const SURAH_NAMES_TR = {
  1: 'Fatiha', 2: 'Bakara', 3: 'Al-i İmran', 4: 'Nisa', 5: 'Maide',
  6: 'En\'am', 7: 'A\'raf', 8: 'Enfal', 9: 'Tevbe', 10: 'Yunus',
  11: 'Hud', 12: 'Yusuf', 13: 'Rad', 14: 'İbrahim', 15: 'Hicr',
  16: 'Nahl', 17: 'İsra', 18: 'Kehf', 19: 'Meryem', 20: 'Taha',
  21: 'Enbiya', 22: 'Hac', 23: 'Müminun', 24: 'Nur', 25: 'Furkan',
  26: 'Şuara', 27: 'Neml', 28: 'Kasas', 29: 'Ankebut', 30: 'Rum',
  31: 'Lokman', 32: 'Secde', 33: 'Ahzab', 34: 'Sebe', 35: 'Fatır',
  36: 'Yasin', 37: 'Saffat', 38: 'Sad', 39: 'Zümer', 40: 'Mümin',
  41: 'Fussilet', 42: 'Şura', 43: 'Zuhruf', 44: 'Duhan', 45: 'Casiye',
  46: 'Ahkaf', 47: 'Muhammed', 48: 'Fetih', 49: 'Hucurat', 50: 'Kaf',
  51: 'Zariyat', 52: 'Tur', 53: 'Necm', 54: 'Kamer', 55: 'Rahman',
  56: 'Vakıa', 57: 'Hadid', 58: 'Mücadele', 59: 'Haşr', 60: 'Mümtehine',
  61: 'Saff', 62: 'Cuma', 63: 'Münafikun', 64: 'Tegabun', 65: 'Talak',
  66: 'Tahrim', 67: 'Mülk', 68: 'Kalem', 69: 'Hakka', 70: 'Mearic',
  71: 'Nuh', 72: 'Cin', 73: 'Müzzemmil', 74: 'Müddessir', 75: 'Kıyame',
  76: 'İnsan', 77: 'Mürselat', 78: 'Nebe', 79: 'Naziat', 80: 'Abese',
  81: 'Tekvir', 82: 'İnfitar', 83: 'Mutaffifin', 84: 'İnşikak', 85: 'Buruc',
  86: 'Tarık', 87: 'A\'la', 88: 'Gaşiye', 89: 'Fecr', 90: 'Beled',
  91: 'Şems', 92: 'Leyl', 93: 'Duha', 94: 'İnşirah', 95: 'Tin',
  96: 'Alak', 97: 'Kadir', 98: 'Beyyine', 99: 'Zilzal', 100: 'Adiyat',
  101: 'Karia', 102: 'Tekasür', 103: 'Asr', 104: 'Hümeze', 105: 'Fil',
  106: 'Kureyş', 107: 'Maun', 108: 'Kevser', 109: 'Kafirun', 110: 'Nasr',
  111: 'Tebbet', 112: 'İhlas', 113: 'Felak', 114: 'Nas'
};

const QuranAPI = {
  // Tüm sureleri listele
  async getSurahs() {
    try {
      const response = await fetch(`${QURAN_API_BASE}/surah`);
      const data = await response.json();
      
      if (data.code === 200 && data.data) {
        return data.data.map(surah => ({
          number: surah.number,
          name: surah.englishName,
          nameTr: SURAH_NAMES_TR[surah.number] || surah.englishName,
          englishNameTranslation: surah.englishNameTranslation,
          numberOfAyahs: surah.numberOfAyahs,
          revelationType: surah.revelationType
        }));
      }
      throw new Error('API yanıtı beklenen formatta değil');
    } catch (error) {
      console.error('Sureler alınırken hata:', error);
      throw error;
    }
  },

  // Belirli bir sureyi getir
  async getSurah(surahNumber, edition = TURKISH_EDITION, arabicEdition = ARABIC_EDITION) {
    try {
      const [arabicResponse, turkishResponse] = await Promise.all([
        fetch(`${QURAN_API_BASE}/surah/${surahNumber}/${arabicEdition}`),
        fetch(`${QURAN_API_BASE}/surah/${surahNumber}/${edition}`)
      ]);

      const [arabicData, turkishData] = await Promise.all([
        arabicResponse.json(),
        turkishResponse.json()
      ]);

      if (arabicData.code === 200 && turkishData.code === 200) {
        const surah = {
          number: arabicData.data.number,
          name: arabicData.data.englishName,
          nameTr: SURAH_NAMES_TR[arabicData.data.number] || arabicData.data.englishName,
          englishNameTranslation: arabicData.data.englishNameTranslation,
          revelationType: arabicData.data.revelationType,
          numberOfAyahs: arabicData.data.numberOfAyahs,
          ayahs: []
        };

        // Ayetleri birleştir
        arabicData.data.ayahs.forEach((arabicAyah, index) => {
          const turkishAyah = turkishData.data.ayahs[index];
          surah.ayahs.push({
            number: arabicAyah.number,
            text: arabicAyah.text,
            translation: turkishAyah ? turkishAyah.text : '',
            numberInSurah: arabicAyah.numberInSurah,
            juz: arabicAyah.juz,
            manzil: arabicAyah.manzil,
            page: arabicAyah.page,
            ruku: arabicAyah.ruku,
            hizbQuarter: arabicAyah.hizbQuarter,
            sajda: arabicAyah.sajda
          });
        });

        return surah;
      }
      throw new Error('API yanıtı beklenen formatta değil');
    } catch (error) {
      console.error('Sure alınırken hata:', error);
      throw error;
    }
  },

  // Belirli bir ayeti getir
  async getAyah(reference, edition = TURKISH_EDITION, arabicEdition = ARABIC_EDITION) {
    try {
      // Reference format: "1:1" veya "262" (Ayat al-Kursi)
      const [arabicResponse, turkishResponse] = await Promise.all([
        fetch(`${QURAN_API_BASE}/ayah/${reference}/${arabicEdition}`),
        fetch(`${QURAN_API_BASE}/ayah/${reference}/${edition}`)
      ]);

      const [arabicData, turkishData] = await Promise.all([
        arabicResponse.json(),
        turkishResponse.json()
      ]);

      if (arabicData.code === 200 && turkishData.code === 200) {
        const arabicAyah = arabicData.data;
        const turkishAyah = turkishData.data;

        return {
          number: arabicAyah.number,
          text: arabicAyah.text,
          translation: turkishAyah.text,
          surah: {
            number: arabicAyah.surah.number,
            name: arabicAyah.surah.englishName,
            nameTr: SURAH_NAMES_TR[arabicAyah.surah.number] || arabicAyah.surah.englishName
          },
          numberInSurah: arabicAyah.numberInSurah,
          juz: arabicAyah.juz,
          manzil: arabicAyah.manzil,
          page: arabicAyah.page,
          ruku: arabicAyah.ruku,
          hizbQuarter: arabicAyah.hizbQuarter,
          sajda: arabicAyah.sajda
        };
      }
      throw new Error('API yanıtı beklenen formatta değil');
    } catch (error) {
      console.error('Ayet alınırken hata:', error);
      throw error;
    }
  },

  // Ayet için ses URL'i getir
  getAudioUrl(surahNumber, ayahNumber, edition = AUDIO_EDITION) {
    // API formatı: https://api.alquran.cloud/v1/ayah/[surah]:[ayah]/ar.alafasy
    return `${QURAN_API_BASE}/ayah/${surahNumber}:${ayahNumber}/${edition}`;
  },

  // Kur'an'da arama
  async search(keyword, surah = 'all', edition = TURKISH_EDITION) {
    try {
      const response = await fetch(
        `${QURAN_API_BASE}/search/${encodeURIComponent(keyword)}/${surah}/${edition}`
      );
      const data = await response.json();

      if (data.code === 200 && data.data) {
        return data.data.matches.map(match => ({
          surah: match.surah.number,
          surahName: SURAH_NAMES_TR[match.surah.number] || match.surah.englishName,
          ayah: match.numberInSurah,
          text: match.text,
          number: match.number
        }));
      }
      
      // Sonuç bulunamadı
      return [];
    } catch (error) {
      console.error('Arama yapılırken hata:', error);
      // Hata durumunda boş dizi döndür
      return [];
    }
  },

  // Sayfa bazlı getirme (Kur'an'da 604 sayfa var)
  async getPage(pageNumber, edition = TURKISH_EDITION, arabicEdition = ARABIC_EDITION) {
    try {
      const [arabicResponse, turkishResponse] = await Promise.all([
        fetch(`${QURAN_API_BASE}/page/${pageNumber}/${arabicEdition}`),
        fetch(`${QURAN_API_BASE}/page/${pageNumber}/${edition}`)
      ]);

      const [arabicData, turkishData] = await Promise.all([
        arabicResponse.json(),
        turkishResponse.json()
      ]);

      if (arabicData.code === 200 && turkishData.code === 200) {
        return {
          page: arabicData.data.page,
          ayahs: arabicData.data.ayahs.map((arabicAyah, index) => {
            const turkishAyah = turkishData.data.ayahs[index];
            return {
              number: arabicAyah.number,
              text: arabicAyah.text,
              translation: turkishAyah ? turkishAyah.text : '',
              surah: {
                number: arabicAyah.surah.number,
                name: arabicAyah.surah.englishName,
                nameTr: SURAH_NAMES_TR[arabicAyah.surah.number] || arabicAyah.surah.englishName
              },
              numberInSurah: arabicAyah.numberInSurah
            };
          })
        };
      }
      throw new Error('API yanıtı beklenen formatta değil');
    } catch (error) {
      console.error('Sayfa alınırken hata:', error);
      throw error;
    }
  },

  // Kategori bazlı ayetleri getir (önceden tanımlı kategoriler)
  async getCategoryVerses(categoryName) {
    // Basit kategori mapping - gerçek uygulamada daha kapsamlı olabilir
    const categoryMap = {
      'Sabır': ['2:153', '2:155', '3:200'],
      'Şükür': ['2:152', '14:7', '31:12'],
      'Dua': ['2:186', '40:60', '25:77'],
      'Merhamet': ['7:156', '21:107', '27:77'],
      'Adalet': ['4:135', '5:8', '57:25'],
      'İlim': ['20:114', '39:9', '58:11']
    };

    const verseReferences = categoryMap[categoryName] || [];
    if (verseReferences.length === 0) {
      return [];
    }

    try {
      const verses = await Promise.all(
        verseReferences.map(ref => this.getAyah(ref))
      );
      return verses;
    } catch (error) {
      console.error('Kategori ayetleri alınırken hata:', error);
      return [];
    }
  },

  // Sure adını Türkçe'ye çevir
  getSurahNameTr(surahNumber) {
    return SURAH_NAMES_TR[surahNumber] || `Sure ${surahNumber}`;
  }
};

// Global erişim için
window.QuranAPI = QuranAPI;

