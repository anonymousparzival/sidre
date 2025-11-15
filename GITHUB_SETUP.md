# GitHub Setup - anonymousparzival Hesabı İçin

## Adım Adım Kurulum

### 1. Git Config Ayarları (Bu Proje İçin)

PowerShell'de şu komutları çalıştırın:

```powershell
cd C:\Users\User\Desktop\flower\sidre

# Bu proje için özel git config (global ayarları değiştirmez)
git config user.name "anonymousparzival"
git config user.email "YENI_HESAP_EMAIL_ADRESI@example.com"

# Config'i kontrol edin
git config user.name
git config user.email
```

### 2. Personal Access Token Oluşturma

1. GitHub.com → anonymousparzival hesabıyla giriş yapın
2. Sağ üst profil → **Settings**
3. Sol menü → **Developer settings**
4. **Personal access tokens** → **Tokens (classic)**
5. **Generate new token** → **Generate new token (classic)**
6. Ayarlar:
   - **Note**: "Sidre Project - anonymousparzival"
   - **Expiration**: 90 days (veya istediğiniz süre)
   - **Select scopes**: `repo` ✓ (tüm checkbox'ları işaretle)
7. **Generate token** → Token'ı KOPYALAYIN (bir daha gösterilmeyecek!)

### 3. Remote Repository Ayarları

```powershell
cd C:\Users\User\Desktop\flower\sidre

# Mevcut remote'u kontrol edin
git remote -v

# Eğer remote varsa ve yanlışsa, silin
git remote remove origin

# Yeni hesap için remote ekleyin
git remote add origin https://github.com/anonymousparzival/sidre.git

# Remote'u kontrol edin
git remote -v
```

### 4. Windows Credential Manager Temizleme

```powershell
# Eski GitHub credentials'ları temizleyin
cmdkey /list | Select-String "github"

# Eğer varsa, silin (ana hesabınız için olanları)
# Sadece github.com için olanları silmek için:
cmdkey /delete:git:https://github.com

# Veya tüm GitHub credential'ları listeleyin:
cmdkey /list | Select-String "github" | ForEach-Object { 
    $_.ToString() -match 'Target: (.+?)$' | Out-Null
    cmdkey /delete:$matches[1]
}
```

### 5. Commit ve Push İşlemleri

```powershell
cd C:\Users\User\Desktop\flower\sidre

# Dosyaları kontrol edin
git status

# Tüm dosyaları ekleyin
git add .

# Commit yapın (eğer yapmadıysanız)
git commit -m "Initial commit: Sidre - Special gift website"

# Branch ismini kontrol edin
git branch

# Eğer master ise main'e çevirin
git branch -M main

# Push yapın (token isteyecek)
git push -u origin main
```

**Push sırasında sorulduğunda:**
- **Username**: `anonymousparzival`
- **Password**: Oluşturduğunuz **Personal Access Token** (şifre değil!)

### 6. Credential Manager ile Token Kaydetme

Token'ı her seferinde girmemek için:

```powershell
# Git Credential Manager ile token'ı kaydedin
git config credential.helper manager-core

# Push yaparken token'ı girince otomatik kaydedilecek
git push -u origin main
```

### 7. Token'ı URL'de Kullanma (Alternatif - Daha Güvenli Değil)

```powershell
# Remote URL'i token ile güncelleyin (TOKEN yerine oluşturduğunuz token'ı yazın)
# NOT: Bu yöntem güvenli değil, token commit log'larında görünebilir
git remote set-url origin https://TOKEN@github.com/anonymousparzival/sidre.git
git push -u origin main
```

## Sorun Giderme

### Eğer "Permission denied" hatası alırsanız:

1. Token'ın doğru oluşturulduğundan emin olun (`repo` scope'u olmalı)
2. Username'in `anonymousparzival` olduğundan emin olun
3. Repository'nin `anonymousparzival/sidre` adında oluşturulduğundan emin olun
4. Credentials'ları temizleyin ve tekrar deneyin

### Farklı Hesaplar Arasında Geçiş

Her proje için farklı hesap kullanmak için:

```powershell
# Her projede local config kullanın (global değil)
cd C:\Users\User\Desktop\flower\sidre
git config user.name "anonymousparzival"
git config user.email "yeni_hesap@email.com"

# Ana hesabınız için başka bir projede:
cd C:\başka\proje
git config user.name "ana_hesap_adiniz"
git config user.email "ana_hesap@email.com"
```

## GitHub Pages Aktivasyon

1. https://github.com/anonymousparzival/sidre repository'sine gidin
2. **Settings** → **Pages**
3. **Source**: Deploy from a branch
4. **Branch**: `main` / `/ (root)`
5. **Save**

Site adresi: `https://anonymousparzival.github.io/sidre/`

