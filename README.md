# Startly

Halaman awal browser pribadi yang tenang, modern, dan sepenuhnya bisa disesuaikan. Startly menggabungkan jam besar, pencarian Google, dan shortcut favorit dalam satu layar ringan tanpa akun, backend, maupun database.

![Startly](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Privasi](https://img.shields.io/badge/data-tetap%20di%20browser-D97757)

## Fitur

- **Jam dan tanggal real-time** dengan sapaan sesuai waktu, format 24/12 jam, serta opsi detik.
- **Pencarian pintar**: ketik pertanyaan untuk mencari di Google, atau tempel domain seperti `github.com` untuk langsung membuka situsnya.
- **Shortcut yang bisa diatur**: tambah, ubah, hapus, dan urutkan hingga 40 shortcut. Ikon merek bawaan untuk GitHub, YouTube, Reddit, Google, dan ChatGPT; situs lain memakai favicon dengan fallback monogram.
- **Tema terang, gelap, atau mengikuti sistem** dengan enam warna aksen preset dan pemilih warna kustom.
- **Empat wallpaper preset** (Aurora, Senja, Samudra, Kertas) serta unggah wallpaper pribadi.
- **Penyimpanan otomatis** di `localStorage` untuk semua preferensi dan shortcut.
- **Undo**: hapus shortcut atau atur ulang semuanya tanpa takut kehilangan data.
- **Responsif dan aksesibel**: layout adaptif dari 320 px hingga desktop, focus trap pada dialog, navigasi keyboard, serta label ARIA.
- **Ringan**: font dan ikon merek disajikan secara lokal, tanpa layanan berbayar.

## Teknologi

- [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)
- CSS murni dengan design token dan `color-mix`
- [Lucide React](https://lucide.dev/) untuk ikon antarmuka
- Font lokal [Instrument Sans & Instrument Serif](https://fontsource.org/)
- `localStorage` untuk persistensi

## Persyaratan

- **Node.js `^20.19.0` atau `>=22.12.0`** (disarankan Node 22 LTS atau lebih baru)
- npm 10+

## Menjalankan Secara Lokal

```bash
# 1. Pasang dependensi
npm install

# 2. Jalankan server pengembangan
npm run dev
```

Buka [http://localhost:5173](http://localhost:5173).

## Build Produksi

```bash
npm run build
npm run preview
```

Hasil build ada di folder `dist/`. Perintah `npm run preview` menjalankan hasil build di [http://localhost:4173](http://localhost:4173).

## Deploy ke Vercel

Repositori sudah dilengkapi `vercel.json`, sehingga tidak perlu konfigurasi tambahan.

### Opsi 1 — Import dari GitHub

1. Push proyek ke GitHub.
2. Buka [vercel.com/new](https://vercel.com/new) dan pilih repositori.
3. Vercel akan mendeteksi Vite secara otomatis.
4. Pastikan:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Klik **Deploy**.

### Opsi 2 — Vercel CLI

```bash
npx vercel
```

Ikuti instruksi interaktif. Untuk produksi:

```bash
npx vercel --prod
```

Tidak ada environment variable yang diperlukan. `vercel.json` sudah menangani rewrite SPA ke `index.html`, jadi halaman tetap bisa dibuka langsung dari URL apa pun.

## Pintasan Keyboard

| Pintasan | Fungsi |
| --- | --- |
| `/` | Fokus ke kolom pencarian |
| `Ctrl/Cmd + K` | Fokus ke kolom pencarian |
| `Enter` | Cari di Google atau buka alamat website |
| `Ctrl/Cmd + Enter` | Buka hasil pencarian/tautan di tab baru |
| `Esc` | Kosongkan pencarian, tutup dialog, atau batalkan input |

## Personalisasi

### Preferensi pengguna

Semua pengaturan tersedia lewat panel **Personalisasi** (ikon di kanan atas):

- Nama panggilan dan kutipan harian
- Tema dan warna aksen
- Wallpaper preset atau unggahan sendiri
- Tingkat peredupan wallpaper kustom
- Tampilan detik dan format jam

### Mengubah default

- Shortcut bawaan: `src/lib/constants.js`
- Warna aksen preset dan wallpaper: `src/lib/constants.js`
- Design token (warna, radius, font): `src/styles/tokens.css`
- Gradien wallpaper: `src/components/Wallpaper.css`
- Nama dan deskripsi meta: `index.html`

## Penyimpanan dan Privasi

- Pengaturan disimpan di kunci `startly.settings.v1`.
- Shortcut disimpan di kunci `startly.shortcuts.v1`.
- Wallpaper kustom dikompres di browser (sisi terpanjang maksimal 1920 px) agar aman untuk kuota `localStorage`.
- Tidak ada akun, backend, database, atau analytics. Data tidak dikirim ke server Startly—karena server tersebut memang tidak ada.
- Untuk shortcut kustom tanpa ikon merek, Startly meminta favicon dari layanan Google S2. Jika permintaan gagal atau offline, ikon monogram digunakan. Preferensi dan wallpaper tetap tidak ikut dikirim.

Untuk memulai dari awal, buka **Personalisasi → Data → Atur ulang semua**. Anda juga bisa menghapus dua kunci `localStorage` di atas lewat DevTools.

## Struktur Proyek

```text
.
├── public/
│   └── favicon.svg
├── src/
│   ├── components/        # UI: jam, pencarian, shortcut, dialog, toast, dsb.
│   ├── data/              # Path ikon merek lokal
│   ├── hooks/             # useClock, useLocalStorage, useMediaQuery
│   ├── lib/               # normalisasi preferensi, URL, warna, gambar, waktu
│   ├── styles/            # token desain dan style global
│   ├── App.jsx            # state aplikasi dan persistensi
│   └── main.jsx
├── index.html             # bootstrap tema sebelum React dimuat
├── vercel.json            # konfigurasi deploy + rewrite SPA
└── vite.config.js
```

## Catatan

- Wallpaper unggahan maksimal **15 MB** sebelum dikompres. Format yang didukung: **JPG, PNG, dan WebP**.
- Kuota `localStorage` berbeda tiap browser (umumnya 5–10 MB). Startly membatasi ukuran wallpaper dan shortcut agar tetap aman, serta menampilkan notifikasi jika penyimpanan penuh.
- Tema **Sistem** akan mengikuti perubahan preferensi terang/gelap perangkat secara langsung.
- Data bersifat per-browser dan per-perangkat; tidak disinkronkan antar perangkat.

## Lisensi

Proyek pribadi ini bebas digunakan dan dimodifikasi sesuai kebutuhan. Ikon merek berasal dari [Simple Icons](https://simpleicons.org/) (CC0) dan disimpan secara lokal. Logo merek tetap merupakan milik pemiliknya masing-masing.
