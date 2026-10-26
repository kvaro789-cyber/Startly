'use strict';

/* ==========================================================================
   1. Konstanta
   ========================================================================== */

const STORAGE_KEYS = {
  settings: 'startly.settings.v1',
  shortcuts: 'startly.shortcuts.v1',
};

const MAX_SHORTCUTS = 20;
const ACCENTS = ['indigo', 'emerald', 'rose', 'amber', 'sky', 'violet'];
const BACKGROUNDS = ['default', 'dawn', 'ocean', 'forest', 'mono'];

const DEFAULT_SETTINGS = {
  theme: 'dark',
  accent: 'indigo',
  background: 'default',
  wallpaper: '',
};

const DEFAULT_SHORTCUTS = [
  { name: 'GitHub', url: 'https://github.com/' },
  { name: 'YouTube', url: 'https://youtube.com/' },
  { name: 'Google', url: 'https://google.com/' },
  { name: 'Reddit', url: 'https://reddit.com/' },
];

// Ikon sederhana disimpan sebagai SVG agar tidak bergantung pada layanan luar.
const BRAND_ICONS = {
  github: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="m8.5 9-3.5 3 3.5 3" />
      <path d="m15.5 9 3.5 3-3.5 3" />
      <path d="M13.5 6.5 10.5 17.5" />
    </svg>
  `,
  youtube: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true">
      <rect x="2.75" y="5.5" width="18.5" height="13" rx="4" />
      <path d="M10.3 9.3v5.4l4.6-2.7Z" fill="currentColor" stroke="none" />
    </svg>
  `,
  google: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m15.5 15.5 4 4" />
    </svg>
  `,
  reddit: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M20.5 11.8a8.5 8.5 0 0 1-12.1 7.7L3.6 20.4l.9-4.6a8.5 8.5 0 1 1 16-4Z" />
      <circle cx="8.8" cy="11.8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="11.8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.2" cy="11.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  `,
};

/* ==========================================================================
   2. Referensi elemen HTML
   ========================================================================== */

const dom = {
  clock: document.querySelector('#clock'),
  clockTime: document.querySelector('#clock-time'),
  clockSeconds: document.querySelector('#clock-seconds'),
  date: document.querySelector('#current-date'),

  searchForm: document.querySelector('#search-form'),
  searchInput: document.querySelector('#search-input'),
  urlHint: document.querySelector('#url-hint'),
  urlHost: document.querySelector('#url-host'),
  urlOpen: document.querySelector('#url-open'),

  shortcutGrid: document.querySelector('#shortcut-grid'),
  addShortcut: document.querySelector('#add-shortcut'),
  shortcutDialog: document.querySelector('#shortcut-dialog'),
  shortcutForm: document.querySelector('#shortcut-form'),
  shortcutName: document.querySelector('#shortcut-name'),
  shortcutUrl: document.querySelector('#shortcut-url'),
  shortcutError: document.querySelector('#shortcut-error'),

  settingsButton: document.querySelector('#open-settings'),
  settingsDialog: document.querySelector('#settings-dialog'),
  wallpaperInput: document.querySelector('#wallpaper-url'),
  applyWallpaper: document.querySelector('#apply-wallpaper'),
  removeWallpaper: document.querySelector('#remove-wallpaper'),

  metaThemeColor: document.querySelector('meta[name="theme-color"]'),
  toast: document.querySelector('#toast'),
};

/* ==========================================================================
   3. State aplikasi
   ========================================================================== */

let settings = { ...DEFAULT_SETTINGS };
let shortcuts = [];
let toastTimer;
let storageWarningShown = false;

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
let lastDateKey = '';

/* ==========================================================================
   4. Fungsi bantu
   ========================================================================== */

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    if (!storageWarningShown) {
      storageWarningShown = true;
      showToast('Penyimpanan lokal tidak tersedia. Perubahan hanya berlaku sesi ini.');
    }
    return false;
  }
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add('is-visible');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    dom.toast.classList.remove('is-visible');
  }, 2800);
}

/**
 * Mengubah teks menjadi URL http/https yang aman.
 * Mengembalikan null jika bukan alamat yang valid.
 */
function normalizeHttpUrl(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const input = value.trim();

  if (!input || /\s/.test(input)) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(input) ? input : `https://${input}`;

  try {
    const url = new URL(candidate);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    // "hello" bukan alamat situs, sedangkan "localhost" tetap diizinkan.
    if (!url.hostname.includes('.') && url.hostname !== 'localhost') {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

function getHostLabel(urlString) {
  try {
    const url = new URL(urlString);
    const path = url.pathname === '/' ? '' : url.pathname;
    return `${url.host}${path}`;
  } catch {
    return urlString;
  }
}

function getBrand(urlString) {
  try {
    const hostname = new URL(urlString).hostname.toLowerCase().replace(/^www\./, '');

    if (hostname === 'github.com' || hostname.endsWith('.github.com')) {
      return 'github';
    }

    if (
      hostname === 'youtube.com' ||
      hostname === 'youtu.be' ||
      hostname.endsWith('.youtube.com')
    ) {
      return 'youtube';
    }

    if (
      hostname === 'google.com' ||
      hostname.endsWith('.google.com') ||
      /^google\.[a-z.]+$/.test(hostname)
    ) {
      return 'google';
    }

    if (
      hostname === 'reddit.com' ||
      hostname.endsWith('.reddit.com') ||
      hostname === 'redd.it'
    ) {
      return 'reddit';
    }
  } catch {
    return null;
  }

  return null;
}

/* ==========================================================================
   5. Pengaturan dan penyimpanan
   ========================================================================== */

function sanitizeSettings(value) {
  const clean = { ...DEFAULT_SETTINGS };

  if (!value || typeof value !== 'object') {
    return clean;
  }

  if (value.theme === 'light' || value.theme === 'dark') {
    clean.theme = value.theme;
  }

  if (ACCENTS.includes(value.accent)) {
    clean.accent = value.accent;
  }

  if (BACKGROUNDS.includes(value.background)) {
    clean.background = value.background;
  }

  const wallpaper = normalizeHttpUrl(value.wallpaper);

  if (wallpaper) {
    clean.wallpaper = wallpaper;
  }

  return clean;
}

function loadSettings() {
  const stored = readStorage(STORAGE_KEYS.settings);

  if (!stored) {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    return sanitizeSettings(JSON.parse(stored));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function applySettings() {
  const root = document.documentElement;

  root.dataset.theme = settings.theme;
  root.dataset.accent = settings.accent;
  root.dataset.background = settings.background;
  root.classList.toggle('has-wallpaper', Boolean(settings.wallpaper));

  if (settings.wallpaper) {
    // encodeURI mencegah karakter berbahaya masuk ke nilai CSS.
    root.style.setProperty('--wallpaper-image', `url("${encodeURI(settings.wallpaper)}")`);
  } else {
    root.style.removeProperty('--wallpaper-image');
  }

  if (dom.metaThemeColor) {
    dom.metaThemeColor.setAttribute(
      'content',
      settings.theme === 'dark' ? '#080a0f' : '#f4f5f9',
    );
  }

  syncSettingsControls();
}

function persistSettings() {
  applySettings();
  writeStorage(STORAGE_KEYS.settings, JSON.stringify(settings));
}

function syncSettingsControls() {
  document.querySelectorAll('[data-theme-choice]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.themeChoice === settings.theme));
  });

  document.querySelectorAll('[data-accent-choice]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.accentChoice === settings.accent));
  });

  document.querySelectorAll('[data-background-choice]').forEach((button) => {
    button.setAttribute(
      'aria-pressed',
      String(button.dataset.backgroundChoice === settings.background),
    );
  });

  dom.removeWallpaper.disabled = !settings.wallpaper;
}

function createDefaultShortcuts() {
  return DEFAULT_SHORTCUTS.map((shortcut) => ({
    id: makeId(),
    name: shortcut.name,
    url: shortcut.url,
  }));
}

function loadShortcuts() {
  const stored = readStorage(STORAGE_KEYS.shortcuts);

  if (stored === null) {
    const defaults = createDefaultShortcuts();
    writeStorage(STORAGE_KEYS.shortcuts, JSON.stringify(defaults));
    return defaults;
  }

  try {
    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      throw new Error('Format shortcut tidak valid.');
    }

    const clean = [];

    parsed.slice(0, MAX_SHORTCUTS).forEach((item) => {
      if (!item || typeof item !== 'object') {
        return;
      }

      if (typeof item.name !== 'string' || typeof item.url !== 'string') {
        return;
      }

      const name = item.name.trim().slice(0, 24);
      const url = normalizeHttpUrl(item.url);

      if (!name || !url) {
        return;
      }

      clean.push({
        id: makeId(),
        name,
        url,
      });
    });

    return clean;
  } catch {
    const defaults = createDefaultShortcuts();
    writeStorage(STORAGE_KEYS.shortcuts, JSON.stringify(defaults));
    return defaults;
  }
}

function saveShortcuts() {
  writeStorage(STORAGE_KEYS.shortcuts, JSON.stringify(shortcuts));
}

/* ==========================================================================
   6. Jam dan tanggal
   ========================================================================== */

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  dom.clockTime.textContent = `${hours}:${minutes}`;
  dom.clockSeconds.textContent = seconds;
  dom.clock.dateTime = now.toISOString();
  dom.clock.setAttribute('aria-label', `Pukul ${hours}:${minutes}:${seconds}`);

  const dateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  if (dateKey !== lastDateKey) {
    lastDateKey = dateKey;
    const formattedDate = dateFormatter.format(now);
    dom.date.textContent =
      formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  }
}

/* ==========================================================================
   7. Pencarian
   ========================================================================== */

function updateUrlHint() {
  const websiteUrl = normalizeHttpUrl(dom.searchInput.value);

  if (!websiteUrl) {
    dom.urlHint.hidden = true;
    dom.urlOpen.removeAttribute('href');
    return;
  }

  dom.urlHost.textContent = getHostLabel(websiteUrl);
  dom.urlOpen.href = websiteUrl;
  dom.urlHint.hidden = false;
}

function handleSearchSubmit(event) {
  event.preventDefault();

  const value = dom.searchInput.value.trim();

  if (!value) {
    dom.searchInput.focus();
    return;
  }

  const websiteUrl = normalizeHttpUrl(value);
  const openAsWebsite = event.ctrlKey || event.metaKey;

  // Ctrl/Cmd + Enter membuka tautan langsung. Enter biasa tetap mencari di Google.
  if (websiteUrl && openAsWebsite) {
    window.open(websiteUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  window.location.assign(
    `https://www.google.com/search?q=${encodeURIComponent(value)}`,
  );
}

/* ==========================================================================
   8. Shortcut
   ========================================================================== */

function createShortcutElement(shortcut) {
  const wrapper = document.createElement('div');
  wrapper.className = 'shortcut';

  const link = document.createElement('a');
  link.className = 'shortcut-card';
  link.href = shortcut.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.title = `${shortcut.name} — ${getHostLabel(shortcut.url)}`;
  link.setAttribute('aria-label', `Buka ${shortcut.name} di tab baru`);

  const icon = document.createElement('span');
  icon.className = 'shortcut-icon';
  icon.setAttribute('aria-hidden', 'true');

  const brand = getBrand(shortcut.url);

  if (brand) {
    icon.dataset.brand = brand;
    icon.innerHTML = BRAND_ICONS[brand];
  } else {
    icon.textContent = shortcut.name.charAt(0).toUpperCase();
  }

  const name = document.createElement('span');
  name.className = 'shortcut-name';
  name.textContent = shortcut.name;

  link.append(icon, name);

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'shortcut-delete';
  removeButton.title = 'Hapus shortcut';
  removeButton.setAttribute('aria-label', `Hapus shortcut ${shortcut.name}`);
  removeButton.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  `;
  removeButton.addEventListener('click', () => deleteShortcut(shortcut.id));

  wrapper.append(link, removeButton);
  return wrapper;
}

function renderShortcuts() {
  dom.shortcutGrid.querySelectorAll('.shortcut').forEach((item) => item.remove());

  const fragment = document.createDocumentFragment();

  shortcuts.forEach((shortcut) => {
    fragment.append(createShortcutElement(shortcut));
  });

  dom.shortcutGrid.insertBefore(fragment, dom.addShortcut);
}

function resetShortcutForm() {
  dom.shortcutForm.reset();
  dom.shortcutError.hidden = true;
  dom.shortcutError.textContent = '';
  dom.shortcutName.removeAttribute('aria-invalid');
  dom.shortcutUrl.removeAttribute('aria-invalid');
}

function openShortcutDialog() {
  if (shortcuts.length >= MAX_SHORTCUTS) {
    showToast(`Maksimal ${MAX_SHORTCUTS} shortcut.`);
    return;
  }

  resetShortcutForm();
  dom.shortcutDialog.showModal();
  dom.shortcutName.focus();
}

function showShortcutError(message, input) {
  dom.shortcutError.textContent = message;
  dom.shortcutError.hidden = false;

  if (input) {
    input.setAttribute('aria-invalid', 'true');
    input.focus();
  }
}

function handleShortcutSubmit(event) {
  event.preventDefault();

  const name = dom.shortcutName.value.trim().replace(/\s+/g, ' ');
  const websiteUrl = normalizeHttpUrl(dom.shortcutUrl.value);

  if (!name) {
    showShortcutError('Nama shortcut wajib diisi.', dom.shortcutName);
    return;
  }

  if (name.length > 24) {
    showShortcutError('Nama shortcut maksimal 24 karakter.', dom.shortcutName);
    return;
  }

  if (!websiteUrl) {
    showShortcutError(
      'Alamat situs tidak valid. Contoh yang benar: https://example.com.',
      dom.shortcutUrl,
    );
    return;
  }

  if (shortcuts.length >= MAX_SHORTCUTS) {
    showShortcutError(`Maksimal ${MAX_SHORTCUTS} shortcut.`);
    return;
  }

  if (shortcuts.some((shortcut) => shortcut.url === websiteUrl)) {
    showShortcutError('Situs ini sudah ada di daftar shortcut.', dom.shortcutUrl);
    return;
  }

  shortcuts.push({
    id: makeId(),
    name,
    url: websiteUrl,
  });

  saveShortcuts();
  renderShortcuts();
  dom.shortcutDialog.close();
  showToast(`${name} ditambahkan.`);
}

function deleteShortcut(id) {
  const shortcut = shortcuts.find((item) => item.id === id);

  if (!shortcut) {
    return;
  }

  const confirmed = window.confirm(`Hapus shortcut "${shortcut.name}"?`);

  if (!confirmed) {
    return;
  }

  shortcuts = shortcuts.filter((item) => item.id !== id);
  saveShortcuts();
  renderShortcuts();
  showToast('Shortcut dihapus.');
}

/* ==========================================================================
   9. Dialog pengaturan
   ========================================================================== */

function openSettingsDialog() {
  dom.wallpaperInput.value = settings.wallpaper;
  dom.wallpaperInput.removeAttribute('aria-invalid');
  syncSettingsControls();
  dom.settingsDialog.showModal();
}

function applyWallpaper() {
  const wallpaperUrl = normalizeHttpUrl(dom.wallpaperInput.value);

  if (!wallpaperUrl) {
    dom.wallpaperInput.setAttribute('aria-invalid', 'true');
    dom.wallpaperInput.focus();
    showToast('Masukkan URL gambar yang valid (http/https).');
    return;
  }

  settings.wallpaper = wallpaperUrl;
  dom.wallpaperInput.value = wallpaperUrl;
  dom.wallpaperInput.removeAttribute('aria-invalid');
  persistSettings();
  showToast('Wallpaper berhasil dipasang.');
}

function removeWallpaper() {
  if (!settings.wallpaper) {
    return;
  }

  settings.wallpaper = '';
  dom.wallpaperInput.value = '';
  dom.wallpaperInput.removeAttribute('aria-invalid');
  persistSettings();
  showToast('Wallpaper dihapus.');
}

function selectBackground(background) {
  if (!BACKGROUNDS.includes(background)) {
    return;
  }

  settings.background = background;

  // Memilih latar bawaan sekaligus melepas wallpaper gambar.
  if (settings.wallpaper) {
    settings.wallpaper = '';
    dom.wallpaperInput.value = '';
  }

  dom.wallpaperInput.removeAttribute('aria-invalid');
  persistSettings();
}

/* ==========================================================================
   10. Event listener
   ========================================================================== */

function bindEvents() {
  dom.searchForm.addEventListener('submit', handleSearchSubmit);
  dom.searchInput.addEventListener('input', updateUrlHint);

  dom.addShortcut.addEventListener('click', openShortcutDialog);
  dom.shortcutForm.addEventListener('submit', handleShortcutSubmit);
  dom.shortcutDialog.addEventListener('close', resetShortcutForm);

  [dom.shortcutName, dom.shortcutUrl].forEach((input) => {
    input.addEventListener('input', () => {
      input.removeAttribute('aria-invalid');
      dom.shortcutError.hidden = true;
    });
  });

  dom.settingsButton.addEventListener('click', openSettingsDialog);

  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => {
      button.closest('dialog')?.close();
    });
  });

  [dom.settingsDialog, dom.shortcutDialog].forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  });

  document.querySelectorAll('[data-theme-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      const theme = button.dataset.themeChoice;

      if (theme !== 'light' && theme !== 'dark') {
        return;
      }

      settings.theme = theme;
      persistSettings();
    });
  });

  document.querySelectorAll('[data-accent-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      const accent = button.dataset.accentChoice;

      if (!ACCENTS.includes(accent)) {
        return;
      }

      settings.accent = accent;
      persistSettings();
    });
  });

  document.querySelectorAll('[data-background-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      selectBackground(button.dataset.backgroundChoice);
    });
  });

  dom.applyWallpaper.addEventListener('click', applyWallpaper);
  dom.removeWallpaper.addEventListener('click', removeWallpaper);

  dom.wallpaperInput.addEventListener('input', () => {
    dom.wallpaperInput.removeAttribute('aria-invalid');
  });

  dom.wallpaperInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyWallpaper();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      updateClock();
    }
  });
}

/* ==========================================================================
   11. Jalankan aplikasi
   ========================================================================== */

function init() {
  settings = loadSettings();
  shortcuts = loadShortcuts();

  bindEvents();
  applySettings();
  renderShortcuts();
  updateClock();
  window.setInterval(updateClock, 1000);
}

init();
