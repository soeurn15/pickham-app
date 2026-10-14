# Backend (Express + MySQL)

Run it from the project root with `npm run dev:backend` (auto-restarts on changes) or `npm start` (backend and website together).
Settings come from `backend/.env`; copy `backend/.env.example` to get started.

## Folder map

```
backend/
├─ .env / .env.example  Settings (.env is private and never committed)
├─ index.js        Entry point: starts the server, then creates missing tables
├─ app.js          Builds the Express app and wires everything together
├─ config/
│  ├─ env.js       Loads .env (PORT, JWT_SECRET)
│  └─ db.js        The shared MySQL connection pool
├─ db/
│  ├─ schema.js    Creates tables if they do not exist (initDb)
│  └─ seed.js      Demo users and pins, only on an empty database
├─ middleware/
│  ├─ auth.js      requireAuth (valid token) and requireAdmin (admin role)
│  ├─ upload.js    Image upload rules (images only, 10 MB) and the uploads folder
│  ├─ rateLimit.js Login / sign-up limiter (30 per 15 min per IP)
│  └─ errorHandler.js  Turns errors into JSON responses
├─ utils/
│  ├─ password.js  Hash and verify passwords (scrypt)
│  ├─ token.js     Create and read signed login tokens
│  ├─ user.js      publicUser(): strips the password hash from a user row
│  └─ boards.js    ownsBoard(): does this user own this board?
├─ routes/          One file per topic; each maps URLs to the code that handles them
└─ uploads/         Uploaded images (not committed to git)
```

## How a request flows

1. `app.js` receives it, applies CORS and JSON parsing.
2. Everything under `/api` (except `/api/auth/*` and `/api/health`) must pass `requireAuth`.
3. `/api/admin/*` must also pass `requireAdmin`.
4. The matching file in `routes/` runs its SQL (always with `?` placeholders) and sends JSON.
5. Any thrown error ends in `middleware/errorHandler.js`.

## Routes

| File | Mounted at | Endpoints |
|---|---|---|
| `auth.routes.js` | `/api/auth` | `POST /login`, `POST /register` (public, rate limited) |
| `users.routes.js` | `/api` | `GET /users/:id`, `POST /users/:id` |
| `pins.routes.js` | `/api` | `GET /pins`, `GET /pins/:id`, `POST /pins` (upload), `DELETE /pins/:id` |
| `likes.routes.js` | `/api` | `POST` / `DELETE /pins/:id/like` |
| `favorites.routes.js` | `/api` | `GET /favorites`, `POST` / `DELETE /pins/:id/favorite` |
| `comments.routes.js` | `/api` | `GET` / `POST /pins/:id/comments` |
| `boards.routes.js` | `/api` | `GET` / `POST /boards`, `GET` / `POST /boards/:id/pins`, `DELETE /boards/:id/pins/:pinId` |
| `admin.routes.js` | `/api/admin` | `GET /metrics`, `GET /users`, `POST /users/:id/role`, `POST /users/:id/edit`, `DELETE /users/:id` |
| `app.js` | `/api/health` | Public check that the server and database are reachable |

## Common tasks

- **Add an endpoint:** add it to the right file in `routes/` (or create a new `*.routes.js` and mount it in `app.js`).
- **Add a table or column:** add it to `db/schema.js`. New tables are created on the next start.
  Changing an existing table needs an `ALTER TABLE` statement.
- **Change who can do what:** edit the checks in `middleware/auth.js` or the route itself.
- **Change upload rules:** `middleware/upload.js`.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `ECONNREFUSED 3306` | MySQL is not running |
| `Access denied for user` | Wrong `DB_USER` / `DB_PASSWORD` in `.env` |
| `Unknown database` | Create the database named in `DB_NAME` first |
| Everyone logged out after a restart | `JWT_SECRET` is missing from `.env` |
| `429 Too many attempts` | Wait 15 minutes or restart the server |
