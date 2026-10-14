# Avora

A Pinterest-style content sharing app: post images ("pins"), organise them into boards, and like, favourite and comment on them. Admins manage accounts.

- **Frontend:** Vue 3, Vite, Tailwind CSS (`frontend/`)
- **Backend:** Express and MySQL (`backend/`)

## Project structure

```
Avora/
├─ frontend/             The website
│  ├─ src/
│  │  ├─ components/     One file per screen or widget
│  │  ├─ utils/          Shared helpers (toast, download)
│  │  ├─ assets/         Theme colours and global styles
│  │  ├─ App.vue         Main state and navigation
│  │  └─ main.ts         App start-up
│  ├─ public/            Static files
│  ├─ index.html
│  └─ vite.config.ts     Dev server; forwards /api to the backend
├─ backend/              The API  (see backend/README.md)
│  ├─ routes/  middleware/  config/  db/  utils/
│  ├─ index.js  app.js
│  ├─ .env               Your private settings (never committed)
│  └─ .env.example       Template for .env
├─ package.json          Runs both apps (npm workspaces)
└─ README.md
```

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
   Open `backend/.env` and fill in your MySQL password and a long random `JWT_SECRET`.

Tables are created automatically on first start, with demo data (users `Aqeel`, `Zara Chen`, ... all with password `password`).

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

- Passwords are hashed (scrypt). Old plaintext passwords are upgraded on the user's next login.
- Every `/api` route except login, register and health needs the bearer token returned at login; `/api/admin/*` also needs the `admin` role.
- Login and sign-up are rate limited.
- To make a user admin: `UPDATE users SET role = 'admin' WHERE username = 'Aqeel';`
- Change the demo passwords before putting this anywhere public.
