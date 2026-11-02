# Architecture

Avora is two apps in one npm-workspaces repo.

```
content-project/
├─ frontend/   Vue 3 + Vite + Tailwind + Pinia + Vue Router
├─ backend/    Express 5 + MySQL
└─ docs/       this folder
```

## Backend: request flow

```
HTTP request
  -> helmet / CORS / body limit / rate limit          (app.js)
  -> routes/index.js                                   which URL goes where
  -> middleware: requireAuth, requireAdmin, upload     who may call it
  -> controllers/*      read + validate input (validators/*), call a service, send JSON
  -> services/*         business rules, transactions, file handling
  -> repositories/*     the only place that writes SQL (always with ? placeholders)
  -> MySQL
```

Errors are thrown as `HttpError` (or by libraries) and turned into `{ "error": "message" }` by
`middleware/errorHandler.js`. Express 5 forwards rejected promises automatically, so handlers need no try/catch.

| Folder | Responsibility |
|---|---|
| `config/` | `.env` loading and validation, MySQL pool, `withTransaction` |
| `routes/` | URL table |
| `controllers/` | HTTP in/out only |
| `validators/` | Reject bad input with 400 before it reaches a service |
| `services/` | Rules such as ownership, "last admin" protection, image processing |
| `repositories/` | SQL |
| `middleware/` | auth, rate limits, uploads, error handler |
| `db/` | schema creation/upgrade and demo seed (run on start-up) |
| `utils/` | passwords, tokens, errors, SQL helpers |

## Frontend

```
src/
├─ router/       routes, login/admin guards, lazy-loaded pages, 404
├─ layouts/      AppLayout = navbar + page + pin popup
├─ pages/        one per route (Feed, Board, Create, Profile, Admin, Login, NotFound)
├─ components/   reusable pieces used by pages
├─ stores/       Pinia: session (who is signed in), feed (pins/boards/search), ui (theme, popup)
├─ services/     http (token + global error toasts), session storage, upload progress, download
├─ composables/  useToast
├─ types/        shared TypeScript types
└─ assets/       global CSS
```

## Security model

* **Passwords**: scrypt with a per-user salt, hashed asynchronously; unknown usernames cost the same time as wrong passwords.
* **Sessions**: HMAC-signed bearer token, 7 days. The user's role is re-read from the database on every request, so demotion/deletion is immediate. In production `JWT_SECRET` (>= 32 chars) is mandatory.
* **Authorization**: every route except `/api/health` and `/api/auth/*` needs a token; `/api/admin/*` needs the admin role; users can only edit their own profile and boards; admins cannot delete or demote themselves or remove the last admin.
* **Input**: every body/param is validated (types, lengths, `http(s)`-only URLs). All SQL uses placeholders; `LIKE` wildcards in searches are escaped.
* **Uploads**: images only, 10 MB, memory-buffered, then decoded with `sharp` to prove they are real images (the declared type is not trusted). Output is re-encoded (strips EXIF/GPS), named with random bytes, and a 480 px WebP thumbnail is generated. Pixel limit blocks decompression bombs. Delete paths are confined to the uploads folder.
* **HTTP**: helmet headers, CORS limited to `CORS_ORIGINS`, 100 KB JSON limit, rate limits (auth 20/15 min, API 600/5 min, uploads 30/10 min per user).
* **Browser**: production build ships a strict Content-Security-Policy; the app never uses `v-html`.

### Known limits (deliberately not done yet)

* The token lives in `localStorage`. Moving to an `HttpOnly` cookie would remove XSS token theft but needs CSRF protection; revisit before a public launch.
* Rate limits are in memory (per server process). Use a shared store such as Redis when running several instances.
* Tokens cannot be revoked individually before they expire (changing a password does not log out other devices).
* Video uploads and external object storage (S3/R2) are not implemented. `services/storage.service.js` is the single place to swap storage.
