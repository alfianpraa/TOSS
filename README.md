# TOSS

Sistem ticketing untuk alur lead → project: Sales membuat card lead,
Developer mengambil & melaporkan progress, Marketing memantau &
menambahkan penawaran — semua dalam satu board Kanban dengan riwayat
laporan per card.

## Tech Stack

- Next.js 16 (App Router, Server Actions) + TypeScript
- PostgreSQL + Prisma ORM
- Auth.js (NextAuth v5) — login email/password, role-based access
- Tailwind CSS + dnd-kit (drag-and-drop board)

## Menjalankan di lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Database PostgreSQL lokal sudah dikonfigurasi lewat `.env`
(`DATABASE_URL`, `AUTH_SECRET`). Untuk reset/isi ulang data contoh:

```bash
npx prisma migrate reset   # hapus & migrasi ulang schema
npm run db:seed            # buat akun demo + 1 contoh lead
```

## Akun Demo

Semua akun demo memakai password `Password123!`.

| Role      | Email               |
| --------- | ------------------- |
| Admin     | admin@demo.com      |
| Sales     | sales@demo.com      |
| Developer | developer@demo.com  |
| Marketing | marketing@demo.com  |

## Alur Kerja

1. **Sales** membuat card lead baru (`+ Card Baru` di board) dan
   menambahkan laporan/update (`SALES_UPDATE`).
2. **Developer** mengambil lead yang belum ditugaskan (`Ambil Lead`),
   status card otomatis pindah ke "Dikerjakan", lalu melaporkan
   progress (`DEV_PROGRESS`).
3. **Marketing** memantau semua card dan menambahkan penawaran
   (`MARKETING_OFFER`, termasuk nilai penawaran) atau catatan kapan
   saja.
4. Card bisa dipindah status secara manual (tombol di detail card)
   atau drag-and-drop di board, sesuai izin masing-masing role.
5. **Admin** punya akses penuh ke semua aksi di atas.
