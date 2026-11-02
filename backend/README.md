# Backend (Express + MySQL)

Run from the project root: `npm run dev:backend` (auto-restart) or `npm start` (backend + website).
Settings come from `backend/.env` (copy `backend/.env.example`).

```
src/
├─ server.js        Entry: prepares the database, starts the server, handles shutdown
├─ app.js           Security headers, CORS, limits, mounts routes and error handling
├─ config/          env (validated), MySQL pool + withTransaction
├─ routes/          URL table (index.js)
├─ controllers/     HTTP in/out
├─ validators/      Input checks (400 on bad input)
├─ services/        Business rules, image processing, storage driver
├─ repositories/    All SQL
├─ middleware/      auth, rate limits, upload, error handler
├─ db/              schema + upgrades, demo seed
└─ utils/           passwords, tokens, HttpError, SQL helpers
scripts/backup.js   npm run db:backup -w backend
```

Full documentation: `../docs/architecture.md`, `../docs/api.md`, `../docs/database.md`.
