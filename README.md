# 🐾 Kedi Irkları Rehberi

> **Web Tasarımı Dersi Ödevi** — TheCatAPI entegrasyonu ile geliştirilmiş tam işlevli, Türkçe arayüzlü kedi ırkları yönetim uygulaması.

---

## 📋 İçindekiler

- [Proje Hakkında](#-proje-hakkında)
- [Özellikler](#-özellikler)
- [Kullanılan Teknolojiler](#-kullanılan-teknolojiler)
- [Proje Yapısı](#-proje-yapısı)
- [Kurulum ve Çalıştırma](#-kurulum-ve-çalıştırma)
- [API Entegrasyonu](#-api-entegrasyonu)
- [CRUD İşlemleri](#-crud-i̇şlemleri)
- [Ödev Gereksinimleri Karşılaştırması](#-ödev-gereksinimleri-karşılaştırması)
- [Ekran Görüntüleri](#-ekran-görüntüleri)
- [Geliştirici](#-geliştirici)

---

## 📌 Proje Hakkında

Bu proje, **Web Tasarımı** dersi kapsamında geliştirilmiş, gerçek bir Public API'den veri çeken ve tam CRUD (Create, Read, Update, Delete) işlemlerini destekleyen dinamik bir web uygulamasıdır.

[TheCatAPI](https://thecatapi.com/) üzerinden 67+ kedi ırkının verisi çekilmekte, her ırkın açıklaması [MyMemory Translation API](https://mymemory.translated.net/) aracılığıyla otomatik olarak Türkçeye çevrilmektedir. Kullanıcılar mevcut ırklara ek olarak kendi özel ırkı kayıtlarını oluşturabilir, düzenleyebilir ve silebilir.

---

## ✨ Özellikler

### Temel İşlevler
| Özellik | Açıklama |
|---|---|
| 📡 **API Veri Çekme** | TheCatAPI'den async/await ile gerçek zamanlı veri alımı |
| 🔍 **Arama Sistemi** | İsim, köken ve açıklamada anlık arama (debounce) |
| 🎛️ **Filtreleme** | Köken ve mizaç bazlı çoklu filtre desteği |
| ↕️ **Sıralama** | Ada ve yaşam süresine göre çift yönlü sıralama |
| ❤️ **Favoriler** | LocalStorage tabanlı kalıcı favori listesi |
| 🌙 **Dark Mode** | Sistem tercihini hatırlayan karanlık mod |
| 📱 **Responsive Tasarım** | Mobil, tablet ve masaüstü uyumlu grid sistemi |
| 🔔 **Toast Bildirimleri** | Animasyonlu kullanıcı geri bildirim mesajları |
| ⏳ **Loading Animasyonu** | API isteği süresince görünen yükleme ekranı |

### CRUD İşlemleri
| İşlem | Kaynak |
|---|---|
| **Create** | Kullanıcı tanımlı özel ırk ekleme (modal form) |
| **Read** | API + LocalStorage verilerini birleştirerek listeleme |
| **Update** | Mevcut özel irkları düzenleme |
| **Delete** | Özel ırkı onay dialogu ile silme |

### Ek Özellikler
- 🌐 **Otomatik Türkçe Çeviri** — API açıklamaları MyMemory ile çevrilir, önbelleğe alınır
- 🗺️ **Köken/Mizaç Çevirisi** — Ülke ve karakter özellikleri Türkçe olarak gösterilir
- 💾 **LocalStorage Kalıcılığı** — Özel ırklar, favoriler ve çeviri önbelleği oturum sonrasında korunur
- 🛡️ **Hata Yönetimi** — API başarısız olursa 6 ırklık Türkçe yedek veri seti devreye girer
- ⌨️ **Klavye Desteği** — `Escape` tuşu açık modalları kapatır

---

## 🛠️ Kullanılan Teknolojiler

### Zorunlu (Ödev Gereksinimi)
```
Vanilla JavaScript (ES6+)
├── fetch API          → HTTP istekleri
├── async / await      → Asenkron veri akışı
├── DOM Manipulation   → Dinamik HTML oluşturma
└── Event Listener     → Kullanıcı etkileşimleri
```

### Harici Kaynaklar
```
TheCatAPI              → Kedi ırkı verileri (Public API)
MyMemory API           → İngilizce → Türkçe çeviri
Font Awesome 6.5.1     → İkon seti (CDN)
Google Fonts / Inter   → Tipografi
```

### Depolama
```
localStorage
├── customBreeds       → Kullanıcı eklediği özel ırklar
├── favorites          → Favori ırk ID listesi
├── darkMode           → Tema tercihi
└── desc_{breedId}     → Çeviri önbelleği (API kotası optimizasyonu)
```

---

## 📁 Proje Yapısı

```
kedi-irklari-rehberi/
│
├── index.html          # Ana HTML yapısı, modal şablonları, semantik işaretleme
├── style.css           # CSS değişkenleri, Dark Mode, responsive grid, animasyonlar
├── script.js           # Tüm uygulama mantığı; API, CRUD, DOM, event'ler
└── README.md           # Bu dosya
```

> **Not:** Proje kasıtlı olarak sıfır bağımlılıklı (dependency-free) tasarlanmıştır. Hiçbir framework, build tool veya paket yöneticisi gerektirmez; doğrudan tarayıcıda çalışır.

---

## 🚀 Kurulum ve Çalıştırma

### Seçenek 1 — Doğrudan Açma (En Basit)
```bash
# Repoyu klonla
git clone https://github.com/KULLANICI_ADI/kedi-irklari-rehberi.git

# Klasöre gir
cd kedi-irklari-rehberi

# index.html dosyasını tarayıcıda aç
# (Çift tıklama veya sürükle-bırak yeterlidir)
```

### Seçenek 2 — Local Server ile (Önerilen)
```bash
# Python 3 ile
python -m http.server 8080

# Node.js ile (npx)
npx serve .

# Tarayıcıda aç
# → http://localhost:8080
```

> **Neden local server?** Bazı tarayıcılar `file://` protokolünde `fetch()` isteklerini CORS politikası nedeniyle engelleyebilir. Local server bu sorunu ortadan kaldırır.

---

## 📡 API Entegrasyonu

### TheCatAPI
```
Base URL  : https://api.thecatapi.com/v1/breeds
Görsel URL: https://api.thecatapi.com/v1/images/search?breed_ids={id}&limit=1
Yöntem    : GET
Auth      : Gerekmiyor (Public, ücretsiz katman)
```

**Veri akışı:**
```
fetchBreeds()
  └─ GET /v1/breeds                      → Tüm ırkların listesi
       └─ Her ırk için paralel:
            ├─ GET /v1/images/search     → Kapak fotoğrafı
            └─ translateDescription()    → MyMemory API çeviri
                  └─ localStorage cache  → Tekrar istek yapma
```

### Hata Yönetimi
API erişilemez olduğunda uygulama çökmez; sabit kodlanmış 6 Türkçe ırk verisiyle devam eder ve kullanıcıya uyarı toastı gösterir.

---

## 🔄 CRUD İşlemleri

### Create — Yeni Irk Ekleme
```javascript
// Tetikleyici: "Yeni Irk Ekle" butonu
openAddModal()
  └─ Form submit → saveBreed(e)
       └─ customBreeds.push({ id: 'custom_' + Date.now(), ...data })
            └─ localStorage.setItem('customBreeds', ...)
```

### Read — Listeleme
```javascript
// Tüm kaynakları birleştirerek render eder
applyFilters()
  └─ [...allBreeds, ...customBreeds]  ← API verisi + yerel veri
       ├─ Arama filtresi
       ├─ Köken filtresi
       ├─ Mizaç filtresi
       └─ Sıralama → renderBreeds()
```

### Update — Irk Düzenleme
```javascript
// Sadece isCustom === true olan ırklar düzenlenebilir
openEditModal(breed)
  └─ Form doldurulur → saveBreed(e)
       └─ customBreeds[idx] = { ...mevcut, ...yeniData }
            └─ localStorage güncellenir
```

### Delete — Irk Silme
```javascript
// Onay dialogu sonrası
deleteBreed(id)
  └─ customBreeds.filter(b => b.id !== id)
       └─ Favorilerden de kaldırılır
            └─ localStorage güncellenir
```

---

## ✅ Ödev Gereksinimleri Karşılaştırması

| Gereksinim | Durum | Detay |
|---|:---:|---|
| Public API'den veri çekme | ✅ | TheCatAPI, async/await |
| Veri listeleme | ✅ | Kart grid sistemi, 67+ ırk |
| Veri ekleme | ✅ | Modal form, LocalStorage |
| Veri silme | ✅ | Onay dialogu ile |
| Veri güncelleme | ✅ | Düzenleme modalı |
| `fetch` API kullanımı | ✅ | Tüm HTTP isteklerinde |
| `async / await` | ✅ | `fetchBreeds()`, `translateDescription()` |
| DOM Manipulation | ✅ | `createElement`, `innerHTML`, `classList` |
| Event Listener | ✅ | Click, input, change, keydown, submit |
| Responsive tasarım | ✅ | CSS Grid, `@media (max-width: 768px)` |
| **EKSTRA:** Arama sistemi | ✅ | Anlık, çoklu alan |
| **EKSTRA:** Filtreleme | ✅ | Köken + mizaç |
| **EKSTRA:** LocalStorage | ✅ | Irklar, favoriler, tema, çeviri cache |
| **EKSTRA:** Dark Mode | ✅ | CSS değişkenleri, kalıcı tercih |
| **EKSTRA:** Loading animasyonu | ✅ | Blur overlay + spinner |
| **EKSTRA:** Toast mesajları | ✅ | 4 tip, otomatik kapanma |

---

## 📸 Ekran Görüntüleri

> *(GitHub'a yükledikten sonra `screenshots/` klasörü oluşturup buraya ekleyebilirsin.)*

| Aydınlık Mod | Karanlık Mod |
|---|---|
| `screenshots/light.png` | `screenshots/dark.png` |

---

## 👤 Geliştirici

**Ad Soyad:** *Mete GÜDBOĞDU*
**Öğrenci No:** *25019909016*
**Bölüm:** *Robotik ve Yapay Zeka*
**Ders:** Web Tasarımı
**Dönem:** 2025–2026 Bahar

---

## 📄 Lisans

Bu proje eğitim amaçlı geliştirilmiştir. Kullanılan API'lerin kendi kullanım koşulları geçerlidir:
- [TheCatAPI Terms](https://thecatapi.com/privacy)
- [MyMemory API Terms](https://mymemory.translated.net/doc/usagelimits.php)
