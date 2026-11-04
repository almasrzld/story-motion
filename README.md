# Animated Videos

Studio lokal untuk menyusun draf dialog dua tokoh dari cerita pengguna, membuat audio TTS Bahasa Indonesia, lalu mempreview dan mengekspor video vertikal MP4.

## Provider dan biaya

- Ollama menjalankan LLM di komputer lokal. Cerita tidak dikirim ke layanan AI cloud untuk menyusun dialog.
- Supertonic-3 berjalan lokal di komputer pengguna untuk TTS Bahasa Indonesia dengan preset suara pria dan wanita. Tidak memakai layanan cloud atau billing.
- Preview dan ekspor memakai Remotion di browser. Ekspor membutuhkan browser dengan WebCodecs, misalnya Chrome yang terbaru.
- Dialog harus ditinjau dan disetujui sebelum TTS dipanggil.

## Konfigurasi lokal

Pasang Ollama dan unduh model bahasa Indonesia yang sesuai dengan kapasitas komputer. `qwen3:8b` tersedia sebagai pilihan multilingual (unduhan sekitar 5.2 GB); ubah model atau endpoint jika memilih model/port Ollama lain.

Pasang server lokal Supertonic dengan `pip install 'supertonic[serve]'`, lalu jalankan `supertonic serve --host 127.0.0.1 --port 7788`. Pertama kali dijalankan, server mengunduh model TTS. Env example memakai preset `M1` (pria) dan `F1` (wanita), serta bahasa `id`.

Salin `.env.example` menjadi `.env.local`, lalu jalankan aplikasi dengan `npm run dev`. Masukkan nama tokoh dan cerita, buat draf dialog, tinjau/edit, lalu setujui untuk membuat suara lokal. Di langkah preview, gunakan **Unduh MP4**.

Nilai environment wajib:

- `OLLAMA_CHAT_URL`
- `OLLAMA_MODEL`
- `SUPERTONIC_TTS_URL`
- `SUPERTONIC_LANGUAGE`
- `SUPERTONIC_MALE_VOICE`
- `SUPERTONIC_FEMALE_VOICE`

Aturan kerja agent ada di [AGENTS.md](./AGENTS.md).
# story-motion
