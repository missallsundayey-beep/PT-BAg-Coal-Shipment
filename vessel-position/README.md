# Vessel Position PT BAg

Generator posisi kapal Tanjung Jati B dari laporan teks, dengan snapshot LT, pratinjau SVG yang dapat digulir, tabel catatan, dan unduhan PNG **4368 × 3400**. Refaktor ini memisahkan kode lampiran `V1-BAg-scroll-HD.html`; parser, penentuan status, kronologi, posisi kotak, urutan kapal, panah, desain, dan contoh laporan dipertahankan.

## Membuka aplikasi

- Untuk penggunaan offline, buka **`dist/vessel-position-offline.html`** pada browser yang dapat menjalankan HTML lokal. File ini sudah memuat CSS, JavaScript, dan semua gambar; tidak memerlukan Node.js atau server.
- Untuk proyek terpisah, buka `index.html` pada browser yang mengizinkan pemuatan skrip dan stylesheet dari berkas lokal. Jangan memindahkan `index.html` sendirian.
- Untuk pengembangan bila akses berkas lokal dibatasi, dari folder `vessel-position/` jalankan `python3 -m http.server 8765 --bind 127.0.0.1`, lalu buka alamat server lokal itu. Ini pilihan pengembang, bukan syarat versi mandiri.

Tempel laporan lengkap, kosongkan jam snapshot untuk memakai jam laporan atau isi `HH:MM`, periksa pratinjau dan catatan, lalu klik **Unduh PNG**. Perubahan input memperbarui hasil otomatis. **Gunakan contoh laporan** mengembalikan contoh bawaan. Gulir langsung dengan mouse atau geseran sentuh; tidak ada fitur perbesar gambar.

Pengelola file Android/iOS tertentu hanya menampilkan HTML, memblokir JavaScript, atau tidak dapat membuka file lewat browser. Versi mandiri tetap membutuhkan browser yang dapat menjalankan HTML lokal. Dukungan setiap perangkat dan pengelola file tidak dijamin.

## Struktur dan tanggung jawab

```text
vessel-position/
├── index.html
├── README.md
├── css/{style.css,responsive.css}
├── js/
│   ├── config.js
│   ├── utils.js
│   ├── parser.js
│   ├── vessel-status.js
│   ├── layout.js
│   ├── renderer.js
│   ├── export-png.js
│   ├── sample-report.js
│   └── app.js
├── assets/images/
│   ├── ocean.webp
│   ├── vessel.png
│   ├── loading-port.png
│   ├── power-plant.png
│   └── bag-logo.png
├── scripts/build-offline.js
├── dist/vessel-position-offline.html
└── tests/
    ├── fixtures/
    │   ├── README.md
    │   ├── report-2026-10-06.txt
    │   ├── synthetic-cases.json
    │   ├── baseline.json
    │   └── browser-baseline.json
    ├── helpers.js
    ├── parser.test.js
    ├── vessel-status.test.js
    ├── layout.test.js
    ├── export-png.test.js
    └── browser-check.js
```

| File | Tanggung jawab |
| --- | --- |
| `index.html` | Struktur halaman dan urutan `<script defer>` |
| `style.css`, `responsive.css` | Warna, komponen, scroll, dan media queries |
| `config.js` | Ukuran, warna kapal, bulan, pelabuhan, jetty, jalur aset relatif, serta blok data URI hasil build |
| `utils.js` | Escaping, format waktu, pengukuran teks, dan helper pelabuhan |
| `parser.js` | Pembacaan laporan, tipe kejadian aktual/estimasi, dan normalisasi kronologi |
| `vessel-status.js` | Status, lokasi, tujuan, jetty, dan baris informasi pada snapshot |
| `layout.js` | Pengukuran nama/kotak, penempatan, antrean, dan pencegahan tumpang tindih |
| `renderer.js` | SVG, kop, tekstur laut, kapal, pelabuhan, jetty, dan panah; `generate()` tetap memakai bentuk hasil sumber |
| `export-png.js` | Canvas HD, unduhan, dan pelepasan Blob URL |
| `sample-report.js` | Contoh bawaan persis dari sumber |
| `app.js` | Inisialisasi, debounce, event, metrik, pratinjau, dan tabel catatan |

Skrip klasik berbagi binding global dengan urutan yang ditetapkan `index.html`. Tidak memakai framework, CDN, `fetch()`, modul ES, backend, service worker, atau bundler.

## Build dan pembaruan

Dari `vessel-position/`, dengan Node.js 18 atau lebih baru:

```sh
node scripts/build-offline.js
```

Ubah kode di `js/`, CSS di `css/`, atau struktur di `index.html`, lalu jalankan build. Untuk mengganti aset, ubah gambar di `assets/images/` dan bila perlu mapping `ASSET_FILES` di `config.js`. Build memeriksa signature PNG/WebP dan kesesuaian ekstensi, memperbarui **blok aset yang dihasilkan otomatis** di `config.js`, kemudian menyatukan sumber ke `dist/vessel-position-offline.html`. Jangan menyunting blok tersebut atau HTML distribusi secara manual. Commit sumber, aset, blok hasil build, dan distribusi bersama.

Data URI diperlukan agar gambar di SVG Blob tidak bergantung pada jalur relatif atau akses canvas lintas origin. Gambar siap tersedia secara sinkron sebelum renderer dan aplikasi dijalankan. Kelima aset diekstrak tanpa konversi dari lampiran; transparansi, format, dan byte asli dipertahankan. Pengguna akhir hanya membutuhkan HTML hasil build.

## Pengujian

Dari `vessel-position/`:

```sh
node --test tests/parser.test.js tests/vessel-status.test.js tests/layout.test.js tests/export-png.test.js
```

**48 tes Node** mencakup 14 skenario input/snapshot, perbandingan semua data hasil dengan baseline sumber, hash SVG lengkap (teks/koordinat/ukuran/panah), kronologi September–Oktober dan tahun baru, status sebelum/sesudah kejadian, shifting sebelum/sesudah All Fast, pelabuhan eksternal, antrean jetty, variasi parser, serta simulasi ekspor dan pelepasan URL. Pengujian ulang build memakai salinan sementara agar tidak menulis berkas yang sedang dibaca tes lain.

Hanya laporan **6 Oktober 2026** dari contoh sumber tersedia. Laporan asli **13 September, 19 September, dan 8 Oktober 2026** belum diberikan; fixture bernama tanggal tersebut tidak dikarang. Kasus buatan berlabel sintetis. Provenance dan hash sumber tercatat di `tests/fixtures/README.md`.

Pengujian browser opsional memerlukan Node.js 20+, Chromium, Python 3, dan dua paket khusus pengujian, dipasang di luar proyek:

```sh
npm install --prefix /tmp/vessel-browser --cache /tmp/vessel-npm-cache playwright-core@1.64.0 pngjs@7.0.0
python3 -m http.server 8765 --bind 127.0.0.1
```

Di terminal lain, tetap dari `vessel-position/`:

```sh
NODE_PATH=/tmp/vessel-browser/node_modules CHROMIUM_PATH=/usr/bin/chromium node tests/browser-check.js
```

`VESSEL_BASE_URL` dapat diisi bila port/alamat server berbeda. Hash piksel dan pengukuran teks baseline dibuat dengan **Chromium 154.0.8037.57** dan font lingkungan pengujian; browser/font lain dapat menghasilkan selisih rendering yang perlu diperiksa, bukan otomatis memperbarui baseline.

Validasi nyata pada lingkungan tugas: data dan SVG proyek terpisah serta HTML mandiri cocok dengan sumber untuk 14 skenario; computed CSS cocok dengan sumber di delapan lebar viewport (390–1800 px). PNG yang benar-benar diunduh dari sumber, proyek, dan versi mandiri memiliki dimensi yang benar serta **buffer piksel identik**. Logo, kapal, laut, pelabuhan, dan teks diperiksa pada PNG. Event contoh, perubahan laporan, snapshot, tombol, scroll gambar/halaman, geseran sentuh emulasi dan wheel mouse, serta ketiadaan error JavaScript/aset gagal diperiksa.

HTML mandiri juga dijalankan dan mengekspor PNG identik ketika jaringan browser dimatikan, menggunakan pemuatan dokumen `setContent`. Kebijakan Chromium lingkungan ini memblokir navigasi `file://`, sehingga pembukaan lokal langsung belum terverifikasi di sini. Viewport HP adalah emulasi desktop Chromium, bukan pengujian perangkat Android/iOS fisik.

## Batas ruang lingkup

Tanggal, status, warning, algoritma panah, dan batas kapasitas diagram mengikuti kode sumber. Jika data tidak lengkap atau diagram penuh, catatan sumber tetap ditampilkan; laporan tidak diubah untuk memaksakan hasil. Tidak ditemukan perbedaan perilaku pada skenario yang diuji. Badge “Satu file HTML” dipertahankan dari desain sumber dan berlaku untuk distribusi mandiri.
