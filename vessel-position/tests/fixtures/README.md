# Sumber fixture

- `report-2026-10-06.txt`: salinan persis `SAMPLE` dalam lampiran `V1-BAg-scroll-HD.html`, dengan newline terakhir ditambahkan.
- `synthetic-cases.json`: kasus buatan khusus untuk pengujian; bukan laporan operasional asli. Mencakup antrean jetty, pelabuhan eksternal, complete loading, drop anchor, shifting, variasi parser, dan pergantian tahun.
- `baseline.json`: hasil kode lampiran yang belum direfaktor, direkam sebelum pemisahan. Memuat data hasil dan hash SHA-256 SVG lengkap untuk 14 kombinasi input/snapshot. Pengukuran teks memakai fallback Node sumber, bukan canvas browser.
- `browser-baseline.json`: hasil kode lampiran di Chromium dengan pengukuran canvas asli, input/snapshot yang sama; terpisah dari baseline Node. Hash piksel PNG memerlukan versi browser/font yang sama.

SHA-256 HTML sumber: `61cb1d8e37339a608f1a2ecf627033c6e11223ba877d51ac5b3fcaeb4690bbe8`.

Laporan asli `report-2026-09-13.txt`, `report-2026-09-19.txt`, dan `report-2026-10-08.txt` belum diberikan. Berkas dengan nama itu sengaja tidak dibuat agar tidak menyamarkan data sintetis sebagai laporan asli. Tambahkan laporan asli tanpa mengubah isinya ketika tersedia, lalu rekam hasil sumber dengan snapshot yang sama sebelum menambah baseline.

## Revisi aturan status/penempatan

Baseline historis di atas tetap utuh dan tidak merepresentasikan ekspektasi status yang telah direvisi. Tes membandingkan fakta yang tetap berlaku, menetapkan ekspektasi perubahan status secara eksplisit, serta memeriksa dua diagram yang tidak berubah dengan hash SVG aslinya. Kasus `tests/revision-cases.js` adalah input sintetis untuk aturan baru, termasuk grup kapal; bukan laporan asli. `design-baseline.json` menyimpan hash HTML, CSS, aset, dan scene latar dari commit sebelum revisi `a6aa1b7711022f8559eca246311404d979dfa550`. HTML revisi terbaru belum tersedia; pengujian aturan baru mengacu pada permintaan tertulis.
