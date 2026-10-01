# content-project

A Pinterest-style content sharing app: Vue 3 + Vite frontend, Express + MySQL API.

## Setup

1. Install dependencies: `npm install`
2. Make sure MySQL is running and create the database named in `.env` (`DB_NAME`).
3. Copy `.env.example` to `.env` and fill it in:

```
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=content-dabase
JWT_SECRET=any-long-random-string
```

Tables are created automatically on first start, with demo data (users `Aqeel`, `Zara Chen`, ... all with password `password`).

## Run

```sh
npm start
```

This starts both the API (`http://localhost:5000`) and the frontend (Vite, usually `http://localhost:5173`). The frontend proxies `/api` and `/uploads` to the API, so **both must be running** - `npm run dev` alone starts only the frontend, and login will fail.

Run them separately with `npm run server` and `npm run dev` if you prefer.

## Project structure

- `src/` - the Vue website (screens in `src/components`, shared helpers in `src/utils`)
- `server/` - the API; see [server/README.md](server/README.md) for the folder map and how a request flows

## Security notes

- Passwords are hashed (scrypt). Old plaintext passwords are upgraded on the user's next login.
- Every `/api` route except login/register needs the bearer token returned at login; `/api/admin/*` also needs the `admin` role.
- To make a user admin: `UPDATE users SET role = 'admin' WHERE username = 'Aqeel';`

## Build

```sh
npm run build
```
