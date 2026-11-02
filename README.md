# Avora

A Pinterest-style content sharing app: post images ("pins"), organise them into boards, and like, favourite and comment on them. Admins manage accounts.

- **Frontend:** Vue 3, Vite, Tailwind CSS (`frontend/`)
- **Backend:** Express and MySQL (`backend/`)

## Project structure

```
content-project/
├─ frontend/                 The website (Vue 3, Vite, Tailwind, Pinia, Vue Router)
│  └─ src/  assets/ components/ layouts/ pages/ router/ stores/ services/ composables/ types/
├─ backend/                  The API (Express 5, MySQL)
│  ├─ src/  config/ routes/ controllers/ services/ repositories/ middleware/ validators/ utils/ db/
│  ├─ scripts/backup.js      Database + uploads backup
│  ├─ .env.example           Template for your private .env
│  └─ uploads/               Uploaded images and thumbnails (not committed)
├─ docs/                     architecture.md, database.md, api.md
└─ package.json              Runs both apps (npm workspaces)
```

Read `docs/architecture.md` for how a request flows and how the app is secured.

## Setup (first time)

1. Install Node.js 20.19+ and MySQL, and make sure MySQL is running.
2. Create an empty MySQL database (the default name is `content-dabase`).
3. Install everything from the project root:
   ```sh
   npm install
   ```
4. Create your settings file:
   ```sh
   copy backend\.env.example backend\.env
   ```
   Open `backend/.env`, fill in your MySQL password and set `JWT_SECRET` (at least 32 random characters; the file explains how to generate one).

Tables are created automatically on first start, with demo data in development (users `Aqeel`, `Zara Chen`, ... all with password `password`). Demo data is off when `NODE_ENV=production`.

## Run

```sh
npm start
```

This starts the backend (`http://localhost:5000`) and the website (`http://localhost:5173`, or the next free port) together. The website forwards `/api` and `/uploads` to the backend, so **both must be running**.

Run them separately if you prefer:

| Command | What it does |
|---|---|
| `npm run dev:backend` | API with auto-restart on changes |
| `npm run dev:frontend` | Website only |
| `npm run build` | Type-check and build the website into `frontend/dist` |
| `npm run type-check` | Type-check the website |

## Security notes

- Passwords are hashed with scrypt; accounts need 8+ character passwords. Passwords stored in plaintext by old versions are hashed automatically on the next start.
- Every `/api` route except login, register and health needs the bearer token; `/api/admin/*` also needs the `admin` role.
- All input is validated; uploads are verified as real images, stripped of metadata and thumbnailed.
- Login, sign-up, uploads and the API overall are rate limited. CORS only allows the origins in `CORS_ORIGINS`.
- To make a user admin: `UPDATE users SET role = 'admin' WHERE username = 'Aqeel';`
- **Before going public:** set `NODE_ENV=production`, a strong `JWT_SECRET`, `CORS_ORIGINS`, `TRUST_PROXY`, serve over HTTPS, change or remove demo accounts, and schedule `npm run db:backup -w backend`.

See `docs/architecture.md` for the full list and the known limits.
