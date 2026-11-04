<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Aturan project

- Jangan menambahkan hardcode untuk data bisnis, konfigurasi lingkungan, kredensial, URL API, maupun nilai yang seharusnya berasal dari API atau environment variable. Simpan konfigurasi aplikasi terpusat di `constants/config.ts`; rahasia hanya boleh berada di environment server.
- Jangan menambahkan fallback atau nilai default untuk data, konfigurasi, respons API, autentikasi, maupun state yang tidak tersedia. Tangani kondisi kosong atau error secara eksplisit dan tampilkan error yang sesuai.
- Jangan membuat dummy/mock data, fixture, atau seed data untuk menggantikan integrasi nyata. Gunakan hanya data dari sumber resmi yang ditentukan.
- Jangan mengarang endpoint, schema, atau alur produk. Jika kontrak belum tersedia, siapkan struktur tanpa mengisi asumsi; minta spesifikasi saat implementasi membutuhkannya.
- Letakkan kode sesuai domain pada `features/`, komponen lintas domain pada `components/`, hook pada `hook/`, dan utilitas/integrasi pada `lib/`.
- Gunakan TypeScript secara ketat dan komponen shadcn/ui dari `components/ui/` bila sesuai.
- Jangan menambahkan dependency baru jika kemampuan yang tersedia sudah mencukupi.

## Arah produk yang disepakati

- Tujuan jangka panjang adalah aplikasi SaaS yang bisa dipakai banyak pengguna. Versi yang sedang dibangun masih prototipe lokal untuk memvalidasi alur dan kualitas video; endpoint `localhost`, penyimpanan in-memory, dan proses di komputer pengguna tidak boleh diasumsikan cocok untuk deployment SaaS.
- Sebelum deployment multi-pengguna, rancang autentikasi dan isolasi data per pengguna, penyimpanan proyek/aset, antrean job untuk generasi dan render panjang, penghapusan data, batas penggunaan, pemantauan biaya, serta lokasi pemrosesan cerita personal. Jangan mulai memindahkan data ke cloud tanpa keputusan privasi dan biaya yang jelas.
- Pada arsitektur SaaS, jangan meminta browser pengguna mengakses service `localhost`. Integrasi model dan TTS harus berjalan di backend terkelola atau layanan yang memang disediakan pengguna, dengan autentikasi, isolasi tenant, dan batas penggunaan yang jelas.
- Aplikasi ditujukan untuk membuat video cerita vertikal 9:16 untuk TikTok dari cerita yang diketik pengguna.
- Gaya visual yang dipilih pengguna: anime.
- Alur yang disepakati: cerita asli → AI menyusun draf dialog dua tokoh → pengguna meninjau dan menyetujui dialog → TTS suara pria dan wanita berbahasa Indonesia → subtitle yang mengikuti audio → animasi dan render video dengan Remotion.
- Gaya penyampaian suara mengikuti suasana cerita. Jangan mengubah cerita menjadi dialog final, membuat audio, atau merender video sebelum pengguna menyetujui draf dialog.
- Penyedia yang dipilih untuk prototipe lokal: Ollama lokal untuk draf dialog dan Supertonic-3 lokal untuk suara Bahasa Indonesia pria/wanita. Kedua service berjalan di komputer pengguna; endpoint, model, bahasa, dan suara wajib diatur lewat environment. Jangan mengirim cerita atau dialog ke TTS cloud dan jangan meminta kredensial billing.
- Supertonic-3 mendukung Bahasa Indonesia dan preset suara pria/wanita, tetapi upstream Python package/model archive per November 2026; tinjau lisensi OpenRAIL-M dan status pemeliharaan sebelum menaikkan versi atau menggunakannya untuk konteks lain.
- Render video memakai Remotion Player dan Web Renderer di browser pengguna, tanpa layanan render cloud. Ekspor MP4 memerlukan browser dengan dukungan WebCodecs. Untuk penggunaan pribadi, periksa lisensi Remotion saat versi berubah.
- Suasana dapat ditunjukkan lewat teks, subtitle, pacing, dan visual; jangan mengklaim kendali emosi suara melebihi kemampuan preset lokal.
- Perlakukan cerita dan nama tokoh sebagai data personal. Kirim ke layanan eksternal hanya untuk fungsi yang disetujui; simpan API key hanya di server dan jangan pernah mengirimkannya ke browser.

## Cara mengerjakan project

- Bangun project bertahap dalam milestone yang kecil dan bisa ditinjau; jangan mencoba menyelesaikan semua alur video dalam satu perubahan besar.
- Urutan milestone: input/penyimpanan cerita, draf dialog dan persetujuan pengguna, TTS per tokoh, sinkronisasi subtitle, lalu preview dan render Remotion.
- Sebelum memulai milestone, pastikan kontrak data, sumber layanan, dan keputusan produk yang dibutuhkan sudah jelas. Jangan mengisi bagian yang belum disepakati dengan stub, mock, fallback, atau asumsi.
- Jaga cerita asli tetap tersedia sebagai sumber acuan. Hasil AI harus bisa diedit; jangan menambahkan fakta, detail hubungan, atau dialog yang tidak didukung cerita pengguna.
- Pastikan teks subtitle berasal dari dialog yang disetujui dan waktunya selaras dengan audio yang benar-benar dihasilkan. Tangani kegagalan layanan secara eksplisit agar video tidak diam-diam memakai konten atau audio lain.
- Setiap milestone harus meninggalkan project dalam keadaan konsisten dan mudah dilanjutkan pada milestone berikutnya.
