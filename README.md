# TOSS

A ticketing system for the lead → project flow: Sales creates a lead card,
Developer claims it & reports progress, Marketing monitors & adds
offers — all on a single Kanban board with a per-card report history.

## Tech Stack

- Next.js 16 (App Router, Server Actions) + TypeScript
- PostgreSQL + Prisma ORM
- Auth.js (NextAuth v5) — email/password login, role-based access
- Tailwind CSS + dnd-kit (drag-and-drop board)

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The local PostgreSQL database is already configured via `.env`
(`DATABASE_URL`, `AUTH_SECRET`). To reset/reseed sample data:

```bash
npx prisma migrate reset   # drop & re-migrate the schema
npm run db:seed            # create demo accounts + 1 sample lead
```

## Demo Accounts

All demo accounts use the password `Password123!`.

| Role      | Email               |
| --------- | ------------------- |
| Admin     | admin@demo.com      |
| Sales     | sales@demo.com      |
| Developer | developer@demo.com  |
| Marketing | marketing@demo.com  |

## Deploying to a VPS (Docker)

This repo ships with a `Dockerfile` + `docker-compose.yml`: one container
runs the app (Next.js standalone build, kept alive by PM2), one runs
PostgreSQL, and a one-off `migrate` container applies Prisma migrations
on every deploy.

### One-time server setup

1. **Install Docker** on the VPS (Ubuntu example):
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
2. **Clone the repo** on the server:
   ```bash
   git clone https://github.com/alfianpraa/TOSS.git
   cd TOSS
   ```
3. **Create `.env`** from the template and fill in real values:
   ```bash
   cp .env.example .env
   # generate a random AUTH_SECRET:
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   nano .env   # paste it into AUTH_SECRET, set a strong POSTGRES_PASSWORD
   ```
4. **Open port 80** in the firewall if one is active:
   ```bash
   ufw allow 80/tcp
   ```

### Deploy / redeploy

```bash
docker compose up -d --build
```

This builds the image, starts Postgres, runs pending migrations, then
starts the app. First boot: the database is empty — either run the
seed (demo accounts, password `Password123!` — change them before
real use) or create your first Admin by registering an account and
promoting it directly in the database.

```bash
docker compose run --rm migrate npm run db:seed   # optional demo data
```

Open `http://<server-ip>` (port 80 by default, configurable via
`APP_PORT` in `.env`).

### Day-to-day

```bash
docker compose logs -f app        # tail app logs
docker compose ps                 # container status
git pull && docker compose up -d --build   # ship new code
```

Uploaded files (avatars, card attachments) persist in `./data/uploads`
on the host. Database data persists in the `pgdata` Docker volume —
back it up with:

```bash
docker compose exec db pg_dump -U <POSTGRES_USER> <POSTGRES_DB> > backup.sql
```

### Going further

No domain is wired up yet — the app is reachable by IP over plain
HTTP. When a domain is ready, put a reverse proxy (Nginx or Caddy) in
front of the `app` container for TLS, and update `APP_PORT` so the
container listens on an internal-only port.

## Workflow

1. **Sales** creates a new lead card (`+ New Card` on the board) and
   adds reports/updates (`SALES_UPDATE`).
2. **Developer** claims an unassigned lead (`Claim Lead`), the card
   status automatically moves to "In Progress", then reports
   progress (`DEV_PROGRESS`).
3. **Marketing** monitors all cards and adds offers
   (`MARKETING_OFFER`, including the offer amount) or notes at any
   time.
4. A card's status can be changed manually (button on the card detail
   page) or via drag-and-drop on the board, per each role's
   permissions.
5. **Admin** has full access to all of the actions above.
