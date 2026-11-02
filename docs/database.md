# Database

MySQL. Tables, indexes and upgrades are created automatically on every server start (`backend/src/db/schema.js`).

## Tables

| Table | Purpose | Key columns |
|---|---|---|
| `users` | accounts | `username` (**unique**), `password` (scrypt hash), `role` (`user`/`admin`) |
| `pins` | posts | `user_id` -> users, `image_url`, `thumb_url`, `category`, `tags` |
| `boards` | a user's collections | `user_id` -> users |
| `board_pins` | pins saved in boards | PK (`board_id`, `pin_id`) |
| `likes` | public likes | PK (`user_id`, `pin_id`) |
| `favorites` | private bookmarks | PK (`user_id`, `pin_id`) |
| `comments` | comments on pins | `pin_id`, `user_id` |
| `categories` | admin-managed list | `name` (**unique**) |

All foreign keys use `ON DELETE CASCADE`: deleting a user removes their pins, boards, likes and comments;
deleting a pin removes its likes, favourites, comments and board links.

## Indexes

`users(username)` unique, `pins(user_id)`, `pins(category)`, `pins(created_at)`, `boards(user_id)`,
`board_pins(pin_id)`, `likes(pin_id)`, `favorites(pin_id)`, `comments(pin_id, id)`, `comments(user_id)`.

## Transactions

Multi-step changes run in one transaction (`withTransaction` in `config/db.js`) so they fully apply or not at all:

* create a pin and attach it to a board
* delete a category and move its pins to "Other"
* delete a user (with the last-admin check)

Uploaded files are written before and removed after these steps, and cleaned up if the database step fails.

## Pagination

`GET /api/pins` returns 30 pins per page by default (`?page=2&limit=50`, max 100) and the total match count
in the `X-Total-Count` header. Comments are capped at 500 per pin.

## Upgrading an older database

On start-up the server adds `pins.thumb_url`, removes the old `'password'` column default, **hashes any
plaintext passwords left by older versions**, and adds missing indexes. If the unique `username` index
cannot be added because duplicates exist, a warning is logged; remove the duplicates and restart.

## Backup and recovery

Back up **both** the database and `backend/uploads/` (pins point at those files).

```sh
npm run db:backup -w backend
```

writes `backend/backups/<timestamp>/db.sql` and a copy of `uploads/` (needs `mysqldump` on your PATH; the
password is passed through the environment, not the command line).

Recommended routine:

1. Run the backup daily (Windows Task Scheduler or cron) and copy the folder **off this machine**.
2. Keep at least 7 daily and 4 weekly copies.
3. **Test a restore** now and then: create an empty database, then `mysql -u root -p new_db < db.sql`, and copy `uploads/` back.
4. In production prefer your host's managed snapshots/point-in-time recovery as well.
