// ==================== GLOBAL ====================
const API_URL = 'https://api.thecatapi.com/v1/breeds';
const IMAGE_API = 'https://api.thecatapi.com/v1/images/search';

let allBreeds = [];
let customBreeds = [];
let favorites = [];
let currentView = 'all';
let translationInProgress = false;

// ========== ÖNBELLEK TEMİZLEME (ESKI MYMEMORY HATALARINI SIL) ==========
function cleanCorruptedCache() {
    let cleaned = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('desc_')) {
            const val = localStorage.getItem(key);
            if (val && (val.includes('MYMEMORY') || val.includes('WARNING') || val.includes('FREE TRANSLATIONS'))) {
                localStorage.removeItem(key);
                cleaned++;
            }
        }
    }
    if (cleaned > 0) console.log(`${cleaned} adet bozuk çeviri önbelleği temizlendi.`);
}
cleanCorruptedCache();

// Türkçe sözlük (ülke + mizaç)
const translations = {
    'Turkey': 'Türkiye', 'United States': 'Amerika Birleşik Devletleri', 'United Kingdom': 'Birleşik Krallık',
    'Egypt': 'Mısır', 'Thailand': 'Tayland', 'Russia': 'Rusya', 'Japan': 'Japonya', 'China': 'Çin',
    'France': 'Fransa', 'Canada': 'Kanada', 'Norway': 'Norveç', 'Sweden': 'İsveç', 'Germany': 'Almanya',
    'Italy': 'İtalya', 'Greece': 'Yunanistan', 'Iran (Persia)': 'İran', 'Burma': 'Burma', 'Singapore': 'Singapur',
    'Somalia': 'Somali', 'Australia': 'Avustralya', 'Brazil': 'Brezilya', 'Mexico': 'Meksika',
    'Active': 'Aktif', 'Energetic': 'Enerjik', 'Playful': 'Oyuncu', 'Friendly': 'Dost canlısı',
    'Affectionate': 'Sevecen', 'Intelligent': 'Zeki', 'Curious': 'Meraklı', 'Gentle': 'Nazik',
    'Independent': 'Bağımsız', 'Social': 'Sosyal', 'Loyal': 'Sadık', 'Calm': 'Sakin', 'Quiet': 'Sessiz',
    'Adaptable': 'Uyumlu', 'Loving': 'Sevgi dolu', 'Alert': 'Uyanık', 'Confident': 'Kendine güvenen',
    'Outgoing': 'Dışa dönük', 'Agile': 'Çevik', 'Clever': 'Akıllı', 'Mischievous': 'Yaramaz'
};
function translateWord(w) { return translations[w] || w; }
function translateOrigin(origin) { return origin ? origin.split(',').map(p=>translateWord(p.trim())).join(', ') : ''; }
function translateTemperament(temp) { return temp ? temp.split(',').map(t=>translateWord(t.trim())).join(', ') : ''; }

// ========== SADECE GOOGLE TRANSLATE (HATA YOK, MYMEMORY YOK) ==========
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function translateWithGoogle(text, breedId) {
    if (!text) return 'Açıklama bulunmuyor.';
    const cacheKey = `desc_${breedId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached && !cached.includes('MYMEMORY') && !cached.includes('WARNING')) return cached;

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tr&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            let translated = data[0].map(x => x[0]).join('');
            if (translated && translated.length > 5 && !translated.includes('MYMEMORY')) {
                localStorage.setItem(cacheKey, translated);
                return translated;
            }
        }
    } catch (e) {
        console.warn('Google Translate hatası (sessiz):', e);
    }
    // Çeviri yapılamazsa orijinali kaydet (hatalı mesaj değil)
    const cleanText = text.replace(/MYMEMORY WARNING.*/g, '').trim();
    if (cleanText.length < 5) return text;
    localStorage.setItem(cacheKey, cleanText);
    return cleanText;
}

async function translateAllInBatches(breeds) {
    const BATCH_SIZE = 3;
    const DELAY_MS = 500;
    const results = new Array(breeds.length);
    for (let i = 0; i < breeds.length; i += BATCH_SIZE) {
        const batch = breeds.slice(i, i + BATCH_SIZE);
        const translated = await Promise.all(
            batch.map(b => translateWithGoogle(b.description || b.description_tr || '', b.id))
        );
        translated.forEach((t, j) => { results[i + j] = t; });
        if (i + BATCH_SIZE < breeds.length) await sleep(DELAY_MS);
    }
    return results;
}

// Toast
function showToast(msg, type='info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = { success:'fa-check-circle', error:'fa-times-circle', info:'fa-info-circle', warning:'fa-exclamation-triangle' };
    toast.innerHTML = `<i class="fas ${icon[type]}"></i><div class="toast-message">${msg}</div><button class="toast-close">&times;</button>`;
    container.appendChild(toast);
    toast.querySelector('.toast-close').onclick = () => toast.remove();
    setTimeout(() => toast.remove(), 4000);
}
function showLoading() { document.getElementById('loading').classList.remove('hidden'); }
function hideLoading() { document.getElementById('loading').classList.add('hidden'); }

// Storage
function loadStorage() {
    customBreeds = JSON.parse(localStorage.getItem('customBreeds') || '[]');
    favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
}
function saveCustom() { localStorage.setItem('customBreeds', JSON.stringify(customBreeds)); }
function saveFav() { localStorage.setItem('favorites', JSON.stringify(favorites)); }

// API Çekme
async function fetchBreeds() {
    showLoading();
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error();
        const breeds = await res.json();
        
        const withImages = await Promise.all(breeds.map(async (b) => {
            let img = '';
            try {
                const imgRes = await fetch(`${IMAGE_API}?breed_ids=${b.id}&limit=1`);
                const imgData = await imgRes.json();
                img = imgData[0]?.url || `https://cdn2.thecatapi.com/images/${b.reference_image_id}.jpg`;
            } catch { img = `https://cdn2.thecatapi.com/images/${b.reference_image_id}.jpg`; }
            return { 
                ...b, 
                image_url: img, 
                isCustom: false,
                description_tr: b.description || 'Açıklama yok'
            };
        }));
        
        hideLoading();
        showToast(`${withImages.length} ırk yüklendi, açıklamalar çevriliyor...`, 'info');
        
        if (!translationInProgress) {
            translationInProgress = true;
            translateAllInBatches(withImages).then(descriptions => {
                withImages.forEach((b, i) => { b.description_tr = descriptions[i]; });
                allBreeds = withImages;
                applyFilters();
                showToast('Tüm açıklamalar Türkçeleştirildi', 'success');
                translationInProgress = false;
            }).catch(err => {
                console.error('Çeviri hatası:', err);
                translationInProgress = false;
            });
        }
        return withImages;
    } catch (err) {
        hideLoading();
        showToast('API bağlantı hatası, yedek veriler kullanılıyor', 'warning');
        return [
            { id:'abys', name:'Habeş Kedisi', origin:'Egypt', temperament:'Aktif, Zeki, Oyuncu', life_span:'14-15', weight:{metric:'3-5'}, image_url:'https://cdn2.thecatapi.com/images/0XYvRd7oD.jpg', description_tr:'Zeki ve meraklı, insanlarla güçlü bağ kurar.', isCustom:false },
            { id:'beng', name:'Bengal', origin:'United States', temperament:'Enerjik, Atletik', life_span:'12-16', weight:{metric:'4-7'}, image_url:'https://cdn2.thecatapi.com/images/O3btzLlsO.jpg', description_tr:'Vahşi görünümlü, suyu seven aktif kedi.', isCustom:false },
            { id:'mcoo', name:'Maine Coon', origin:'United States', temperament:'Nazik, Zeki', life_span:'12-15', weight:{metric:'5-8'}, image_url:'https://cdn2.thecatapi.com/images/MTYwNjE2MQ.jpg', description_tr:'En büyük ev kedilerinden, köpek gibi sadık.', isCustom:false },
            { id:'pers', name:'İran Kedisi', origin:'Iran (Persia)', temperament:'Sakin, Sevecen', life_span:'14-17', weight:{metric:'3-6'}, image_url:'https://cdn2.thecatapi.com/images/ZocD-pQxd.jpg', description_tr:'Uzun tüylü, lüks görünümlü sessiz kedi.', isCustom:false },
            { id:'tang', name:'Ankara Kedisi', origin:'Turkey', temperament:'Zeki, Oyuncu', life_span:'15-18', weight:{metric:'3-5'}, image_url:'https://cdn2.thecatapi.com/images/7CGV6WXPL.jpg', description_tr:'Türkiye’nin ünlü beyaz kedisi, farklı göz renkleri.', isCustom:false },
            { id:'sphy', name:'Sfenks', origin:'Canada', temperament:'Sevecen, Enerjik', life_span:'12-14', weight:{metric:'3-5'}, image_url:'https://cdn2.thecatapi.com/images/BDb8ZXb1v.jpg', description_tr:'Tüysüz, insanlarla yakın temas ister.', isCustom:false }
        ];
    }
}

// Render
function renderBreeds(breeds) {
    const grid = document.getElementById('breedsGrid');
    const empty = document.getElementById('emptyState');
    document.getElementById('breedCount').innerText = breeds.length;
    grid.innerHTML = '';
    if (breeds.length === 0) { empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');
    breeds.forEach(breed => grid.appendChild(createCard(breed)));
}

function createCard(breed) {
    const card = document.createElement('div');
    card.className = 'breed-card';
    const isFav = favorites.includes(breed.id);
    const origin = translateOrigin(breed.origin);
    const temperament = translateTemperament(breed.temperament);
    const tags = temperament.split(',').slice(0,3).map(t => `<span class="temp-tag">${t.trim()}</span>`).join('');
    const life = breed.life_span || '?';
    const weight = breed.weight?.metric || '?';
    const desc = (breed.description_tr || '').substring(0,100);
    const img = breed.image_url || 'https://via.placeholder.com/400x200?text=Kedi';
    card.innerHTML = `
        <img class="card-img" src="${img}" onerror="this.src='https://via.placeholder.com/400x200?text=Resim+Yok'">
        <div class="card-content">
            <div class="card-header"><h3>${breed.name}</h3><button class="fav-btn ${isFav ? 'active' : ''}" data-id="${breed.id}"><i class="fas fa-heart"></i></button></div>
            <div class="card-origin"><i class="fas fa-map-marker-alt"></i> ${origin}</div>
            <div class="temp-tags">${tags}</div>
            <div class="card-stats"><span><i class="fas fa-hourglass-half"></i> ${life} yıl</span><span><i class="fas fa-weight-hanging"></i> ${weight} kg</span></div>
            <p class="card-desc">${desc}${desc.length>=100?'...':''}</p>
            <div class="card-actions">
                <button class="btn btn-primary detail-btn" data-id="${breed.id}"><i class="fas fa-eye"></i> Detay</button>
                ${breed.isCustom ? `<button class="btn btn-secondary edit-btn" data-id="${breed.id}"><i class="fas fa-edit"></i> Düzenle</button>
                <button class="btn btn-danger delete-btn" data-id="${breed.id}"><i class="fas fa-trash"></i> Sil</button>` : ''}
            </div>
        </div>
    `;
    card.querySelector('.fav-btn').addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(breed.id); });
    card.querySelector('.detail-btn').addEventListener('click', () => showDetail(breed));
    if (breed.isCustom) {
        card.querySelector('.edit-btn').addEventListener('click', () => openEditModal(breed));
        card.querySelector('.delete-btn').addEventListener('click', () => deleteBreed(breed.id));
    }
    return card;
}

function toggleFavorite(id) {
    if (favorites.includes(id)) { favorites = favorites.filter(f => f !== id); showToast('Favorilerden çıkarıldı', 'info'); }
    else { favorites.push(id); showToast('Favorilere eklendi', 'success'); }
    saveFav();
    if (currentView === 'favorites') showFavorites();
    else applyFilters();
}
function showFavorites() {
    currentView = 'favorites';
    document.getElementById('btnAll').classList.remove('active');
    document.getElementById('btnFav').classList.add('active');
    applyFilters();
}
function showAll() {
    currentView = 'all';
    document.getElementById('btnAll').classList.add('active');
    document.getElementById('btnFav').classList.remove('active');
    applyFilters();
}

function applyFilters() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const originVal = document.getElementById('filterOrigin').value;
    const tempVal = document.getElementById('filterTemperament').value;
    const sortVal = document.getElementById('sortBy').value;
    let filtered = [...allBreeds, ...customBreeds];
    if (currentView === 'favorites') filtered = filtered.filter(b => favorites.includes(b.id));
    if (term) filtered = filtered.filter(b => b.name.toLowerCase().includes(term) || (b.origin||'').toLowerCase().includes(term) || (b.description_tr||'').toLowerCase().includes(term));
    if (originVal) filtered = filtered.filter(b => b.origin === originVal);
    if (tempVal) filtered = filtered.filter(b => (b.temperament||'').toLowerCase().includes(tempVal.toLowerCase()));
    if (sortVal === 'name') filtered.sort((a,b) => a.name.localeCompare(b.name));
    if (sortVal === 'name-desc') filtered.sort((a,b) => b.name.localeCompare(a.name));
    if (sortVal === 'life') filtered.sort((a,b) => (parseInt(a.life_span)||0) - (parseInt(b.life_span)||0));
    if (sortVal === 'life-desc') filtered.sort((a,b) => (parseInt(b.life_span)||0) - (parseInt(a.life_span)||0));
    renderBreeds(filtered);
}

function populateFilters() {
    const all = [...allBreeds, ...customBreeds];
    const origins = [...new Set(all.map(b=>b.origin).filter(Boolean))].sort();
    const originSel = document.getElementById('filterOrigin');
    originSel.innerHTML = '<option value="">🌍 Tüm Kökenler</option>';
    origins.forEach(o => { let opt = document.createElement('option'); opt.value = o; opt.textContent = translateOrigin(o); originSel.appendChild(opt); });
    const tempSet = new Set();
    all.forEach(b => { if(b.temperament) b.temperament.split(',').forEach(t => tempSet.add(t.trim())); });
    const tempSel = document.getElementById('filterTemperament');
    tempSel.innerHTML = '<option value="">🐱 Tüm Mizaçlar</option>';
    [...tempSet].sort().forEach(t => { let opt = document.createElement('option'); opt.value = t; opt.textContent = translateWord(t); tempSel.appendChild(opt); });
}

// CRUD
function openAddModal() {
    document.getElementById('modalTitle').innerText = 'Yeni Kedi Irkı Ekle';
    document.getElementById('breedId').value = '';
    document.getElementById('breedForm').reset();
    document.getElementById('modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}
function openEditModal(breed) {
    document.getElementById('modalTitle').innerText = 'Irk Düzenle';
    document.getElementById('breedId').value = breed.id;
    document.getElementById('breedName').value = breed.name;
    document.getElementById('breedOrigin').value = breed.origin;
    document.getElementById('breedTemperament').value = breed.temperament || '';
    document.getElementById('breedLife').value = breed.life_span || '';
    document.getElementById('breedDescription').value = breed.description_tr || '';
    document.getElementById('breedImage').value = breed.image_url || '';
    document.getElementById('modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeModal() {
    document.getElementById('modal').classList.remove('active');
    document.body.style.overflow = '';
}
function saveBreed(e) {
    e.preventDefault();
    const id = document.getElementById('breedId').value;
    const name = document.getElementById('breedName').value.trim();
    const origin = document.getElementById('breedOrigin').value.trim();
    const temperament = document.getElementById('breedTemperament').value.trim();
    const life_span = document.getElementById('breedLife').value.trim();
    const description_tr = document.getElementById('breedDescription').value.trim();
    let image_url = document.getElementById('breedImage').value.trim();
    if (!image_url) image_url = 'https://via.placeholder.com/400x200?text=Özel+Irk';
    if (!name || !origin || !description_tr) { showToast('Ad, köken ve açıklama zorunludur', 'warning'); return; }
    const data = { name, origin, temperament, life_span, description_tr, image_url, weight: { metric: '3-5' }, isCustom: true };
    if (id) {
        const idx = customBreeds.findIndex(b => b.id === id);
        if (idx !== -1) { customBreeds[idx] = { ...customBreeds[idx], ...data, id }; saveCustom(); showToast('Irk güncellendi', 'success'); }
    } else {
        const newId = 'custom_' + Date.now();
        customBreeds.push({ id: newId, ...data });
        saveCustom();
        showToast('Yeni ırk eklendi', 'success');
    }
    closeModal();
    populateFilters();
    applyFilters();
}
function deleteBreed(id) {
    if (confirm('Bu ırkı silmek istediğinize emin misiniz?')) {
        customBreeds = customBreeds.filter(b => b.id !== id);
        favorites = favorites.filter(f => f !== id);
        saveCustom(); saveFav();
        populateFilters();
        applyFilters();
        showToast('Irk silindi', 'success');
    }
}

// Detay
function showDetail(breed) {
    const body = document.getElementById('detailBody');
    const origin = translateOrigin(breed.origin);
    const temperament = translateTemperament(breed.temperament);
    const tags = temperament.split(',').map(t => `<span class="temp-tag">${t.trim()}</span>`).join('');
    const desc = breed.description_tr || 'Açıklama yok';
    const img = breed.image_url || 'https://via.placeholder.com/800x400';
    body.innerHTML = `
        <img class="detail-img" src="${img}" onerror="this.src='https://via.placeholder.com/800x400?text=Resim+Yok'">
        <div class="detail-info">
            <h3>${breed.name}</h3>
            <p><strong>Köken:</strong> ${origin}</p>
            <p><strong>Yaşam:</strong> ${breed.life_span || '?'} yıl</p>
            <p><strong>Ağırlık:</strong> ${breed.weight?.metric || '?'} kg</p>
            <div><strong>Mizaç:</strong> <div style="margin-top:6px;">${tags}</div></div>
            <p><strong>Açıklama:</strong><br>${desc}</p>
            ${breed.isCustom ? '<p><em>⭐ Bu özel bir ırktır</em></p>' : ''}
        </div>
    `;
    document.getElementById('detailModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('active');
    document.body.style.overflow = '';
}

// Dark Mode
function initDarkMode() {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('darkModeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
    document.getElementById('darkModeToggle').addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('darkMode', 'false');
            document.getElementById('darkModeToggle').innerHTML = '<i class="fas fa-moon"></i>';
            showToast('Aydınlık mod', 'info');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('darkMode', 'true');
            document.getElementById('darkModeToggle').innerHTML = '<i class="fas fa-sun"></i>';
            showToast('Karanlık mod', 'info');
        }
    });
}

function bindEvents() {
    document.getElementById('btnAll').addEventListener('click', showAll);
    document.getElementById('btnFav').addEventListener('click', showFavorites);
    document.getElementById('btnAdd').addEventListener('click', openAddModal);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
    document.querySelector('#modal .modal-overlay').addEventListener('click', closeModal);
    document.getElementById('closeDetailBtn').addEventListener('click', closeDetailModal);
    document.querySelector('#detailModal .modal-overlay').addEventListener('click', closeDetailModal);
    document.getElementById('breedForm').addEventListener('submit', saveBreed);
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('filterOrigin').addEventListener('change', applyFilters);
    document.getElementById('filterTemperament').addEventListener('change', applyFilters);
    document.getElementById('sortBy').addEventListener('change', applyFilters);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); closeDetailModal(); } });
}

async function init() {
    loadStorage();
    initDarkMode();
    bindEvents();
    allBreeds = await fetchBreeds();
    populateFilters();
    applyFilters();
}
document.addEventListener('DOMContentLoaded', init);