# Ticket Event Backend

Backend untuk aplikasi ticketing dan event management berbasis Node.js dan Express.

## Fitur

- Autentikasi pengguna dan organizer
- Manajemen event, kategori, tiket, dan order
- Pembayaran dengan Midtrans
- Check-in tiket
- Upload file/media
- Dashboard API untuk admin dan organizer

## Teknologi yang Digunakan

- Node.js
- Express.js
- Supabase
- Midtrans
- Prisma / database ORM (jika digunakan)
- JWT untuk autentikasi
- Multer untuk upload file

## Persyaratan

Sebelum memulai, pastikan Anda telah menginstall:

- Node.js v18+
- npm atau yarn
- Database yang sesuai (sesuaikan dengan konfigurasi project)

## Instalasi

1. Clone repository
   ```bash
   git clone <repo-url>
   cd ticket-event-backend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Buat file environment
   ```bash
   cp .env.example .env
   ```

4. Isi konfigurasi environment sesuai kebutuhan

5. Jalankan server
   ```bash
   npm run dev
   ```

## Struktur Project

```bash
src/
  app.js
  config/
  controllers/
  middleware/
  routes/
  utils/
```

## Environment Variables

Contoh variabel yang biasanya dibutuhkan:

```env
PORT=5000
JWT_SECRET=your_jwt_secret
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
CORS_ORIGINS=http://localhost:3000,https://event-plus-seven.vercel.app
FRONTEND_URL=https://event-plus-seven.vercel.app
```

`CORS_ORIGINS` menerima beberapa origin yang dipisahkan koma. Tulis origin
tanpa trailing slash.

## API Endpoints

API dapat diakses melalui base URL:

```bash
http://localhost:5000/api
```

## Catatan

Pastikan Anda menjaga file environment tetap rahasia dan tidak dipush ke repository.

## Lisensi

Project ini dibuat untuk kebutuhan pengembangan tiket event secara internal.
