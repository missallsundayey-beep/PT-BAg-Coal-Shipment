# Vessel Position PT BAg

Generator posisi kapal Tanjung Jati B dari laporan teks, dengan snapshot LT, pratinjau SVG yang dapat digulir, tabel catatan, dan unduhan PNG **4368 × 3400**. Proyek modular berasal dari `V1-BAg-scroll-HD.html`. Revisi status, legenda, dan penempatan mengikuti ketentuan tertulis terbaru; HTML revisi terbaru tidak tersedia sehingga belum dibandingkan langsung. Desain, aset, contoh laporan, dan fitur offline dipertahankan.

## Membuka aplikasi

- Untuk penggunaan offline, buka **`dist/vessel-position-offline.html`** pada browser yang dapat menjalankan HTML lokal. File ini sudah memuat CSS, JavaScript, dan semua gambar; tidak memerlukan Node.js atau server.
- Untuk proyek terpisah, buka `index.html` pada browser yang mengizinkan pemuatan skrip dan stylesheet dari berkas lokal. Jangan memindahkan `index.html` sendirian.
- Untuk pengembangan bila akses berkas lokal dibatasi, dari folder `vessel-position/` jalankan `python3 -m http.server 8765 --bind 127.0.0.1`, lalu buka alamat server lokal itu. Ini pilihan pengembang, bukan syarat versi mandiri.

Tempel laporan lengkap, kosongkan jam snapshot untuk memakai jam laporan atau isi `HH:MM`, periksa pratinjau dan catatan, lalu klik **Unduh PNG**. Perubahan input memperbarui hasil otomatis. **Gunakan contoh laporan** mengembalikan contoh bawaan. Gulir langsung dengan mouse atau geseran sentuh; tidak ada fitur perbesar gambar.

Pengelola file Android/iOS tertentu hanya menampilkan HTML, memblokir JavaScript, atau tidak dapat membuka file lewat browser. Versi mandiri tetap membutuhkan browser yang dapat menjalankan HTML lokal. Dukungan setiap perangkat dan pengelola file tidak dijamin.

## Aturan status dan penempatan

- Snapshot memakai tanggal laporan dan jam laporan/pilihan, sebagai waktu LT. Tanpa tanggal valid atau jam snapshot, status waktu belum dapat ditentukan; waktu komputer tidak dipakai. Bila hanya tanggal tersedia, isi jam pilihan.
- CL aktual dengan jam pasti: sebelum CL mengikuti kegiatan aktual sebelumnya, tepat saat CL menjadi **COMPLETE LOADING**, sesudah CL menjadi **WAITING P.CLEARANCE** sampai kegiatan aktual berikutnya. TD menjadi Sailing; POB diproses sebagai berthing/unberthing/shifting, bukan keberangkatan. Selesai discharge tidak otomatis menjadi Waiting P. Clearance.
- ETA, ETD, ETB, dan operasi `Est` tetap perkiraan. Arrival/Arrived ditampilkan **DROP ANCHOR**, tetapi TA tetap TA dan ETA tetap ETA. Ringkasan Arrival dapat mengonfirmasi status tanpa menciptakan kejadian/jam DA atau TA.
- Jam aktual AM/PM memakai batas konservatif akhir rentang (11:59/23:59), mengikuti penanganan sumber. Tanggal tanpa jam memakai akhir hari sebagai batas kepastian, bukan jam aktual yang diketahui; tampilan tetap `—`. CL tanpa tanggal/jam atau hanya dinyatakan dalam ringkasan tidak diubah otomatis menjadi Waiting karena waktunya belum pasti. Catatan menjelaskan ketidakpastian. Batas rentang tidak dipakai sebagai timestamp pasti untuk urutan kapal.
- Kapal di pelabuhan kanvas diurutkan berdasarkan CmL aktual untuk Loading, TA/DA kunjungan saat ini untuk Drop Anchor, dan CL aktual untuk Waiting. Timestamp sama memakai prioritas Loading → Drop Anchor → Waiting; sisa ikatan stabil. Waktu tidak lengkap diletakkan setelah waktu pasti, lalu memakai prioritas dan urutan input. Pencegahan tabrakan menjaga urutan tersebut.
- Kapal di/menuju lokasi eksternal, termasuk Tanjung Pemancingan, dikelompokkan dari kanan bawah laut, tanpa panah atau label pelabuhan tambahan. Grup besar membungkus ke kolom kiri. Rencana ETD tidak memindahkan kapal dari lokasi aktualnya. Kapasitas kanvas tetap terbatas; warning kapasitas harus diperiksa jika terlalu banyak kapal atau informasi terlalu panjang.
- Panel berisi 2–3 entri legenda relevan. Waktu yang tidak tersedia ditampilkan `—`, bukan event atau timestamp baru. Label CL/CD aktual dibedakan dari ECL/ECD estimasi. Nama kapal tetap satu baris dan informasi panjang dapat dibungkus di dalam panel.

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
    │   ├── browser-baseline.json
    │   └── design-baseline.json
    ├── helpers.js
    ├── revision-cases.js
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

**141 tes Node** mencakup baseline parser yang tetap utuh, status lama dengan revisi yang diharapkan secara eksplisit, CL sebelum/tepat/sesudah dan hari berikutnya, ketidakpastian waktu, estimasi, Arrival, urutan/prioritas, lokasi eksternal, legenda kosong, pergantian bulan/tahun, shifting, stop/continue discharge, identitas sama pada kontrak berbeda, jumlah kapal, batas kotak, tabrakan, ekspor, dan build deterministik. Dua skenario SVG yang tidak memerlukan perubahan tetap dibandingkan byte/hash terhadap baseline asli. Hash desain memastikan HTML antarmuka, CSS, aset, serta scene latar tidak berubah. Build ulang dalam tes memakai salinan sementara.

Baseline historis tidak diperbarui massal: `baseline.json` dan `browser-baseline.json` tetap menggambarkan sumber sebelum revisi. `revision-cases.js` memuat kasus sintetis beserta status/urutan yang diharapkan berdasarkan ketentuan tertulis.

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

`VESSEL_BASE_URL` dapat diisi bila port/alamat server berbeda. `VESSEL_ARTIFACT_DIR` menyimpan PNG dan screenshot untuk inspeksi; `VESSEL_BEFORE_URL` opsional menunjuk server checkout sebelum revisi untuk membandingkan gaya antarmuka serta piksel kop/footer. Jangan mengubah baseline hanya karena browser/font berbeda. Baseline historis dibuat dengan **Chromium 154.0.8037.57**; versi/font lain dapat menghasilkan selisih rendering yang perlu ditinjau.

Validasi browser pada revisi ini memeriksa **54 kombinasi input/snapshot** di versi modular dan HTML mandiri: semua data/SVG setara, status revisi sesuai ekspektasi, setiap panel berada di kanvas, tidak bertabrakan, dan bounding box teks berada dalam panel. PNG yang benar-benar diunduh **4368 × 3400** dan buffer piksel modular/mandiri identik. Gaya antarmuka pada delapan lebar viewport (390–1800 px), aset, kop, serta footer gambar tetap cocok dengan versi sebelum revisi; isi tabel catatan disamakan khusus untuk perbandingan gaya karena legenda baru dapat menambah tinggi tabel. Pengukuran teks Node memakai fallback sumber, sedangkan pemeriksaan browser memakai canvas dan bounding box SVG nyata.

Tombol contoh/generate/download, perubahan laporan, snapshot, scroll halaman/gambar, wheel mouse, dan geseran sentuh emulasi juga diperiksa. HTML mandiri dijalankan dengan jaringan browser dimatikan melalui `setContent`, termasuk ekspor dan input tanpa snapshot. Browser lingkungan ini memblokir navigasi `file://`; pembukaan lokal langsung belum terverifikasi. Pengujian HP memakai emulasi Chromium, bukan perangkat Android/iOS fisik; browser lain belum diuji.

## Batas ruang lingkup

Perubahan visual yang diharapkan adalah status, urutan, legenda, ukuran panel yang mengikuti isi legenda, dan kelompok eksternal. Arah panah perjalanan/antrean dan shifting mengikuti aturan yang dipertahankan; panah eksternal sengaja dihapus. Laporan dan contoh asli tidak diubah untuk memaksakan hasil. Badge “Satu file HTML” tetap berasal dari desain sumber dan berlaku untuk distribusi mandiri.
