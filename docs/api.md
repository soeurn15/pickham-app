# API

Base URL `/api`. JSON in, JSON out. Authenticated calls send `Authorization: Bearer <token>`.

**Errors** always look like `{ "error": "Human readable message" }` with a matching status:
400 invalid input, 401 not signed in, 403 not allowed, 404 not found, 409 conflict, 413 body too large,
429 rate limited, 500 server error.

## Public

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/health` | | `{status, database}` |
| POST | `/auth/register` | `username` (3-50: letters, numbers, space . _ -), `password` (8-128), `avatar?` (http/https URL), `bio?` | 201 -> user + `token`. Rate limited |
| POST | `/auth/login` | `username`, `password` | user + `token`. Rate limited |

## Signed-in users

| Method | Path | Notes |
|---|---|---|
| GET | `/users/:id` | `{user, created_pins, liked_pins, boards}` |
| POST | `/users/:id` | `username`, `avatar?`, `bio?`. Own profile only (admins: any) |
| GET | `/categories` | `[{id, name, pins_count}]` |
| GET | `/pins` | `?search&category&tag&page&limit`. Array of pins; total in `X-Total-Count` |
| GET | `/pins/:id` | `{pin, similar}` |
| POST | `/pins` | multipart: `title`, `description?`, `category`, `tags?`, `board_id?`, and `image` (file, 10 MB, jpg/png/gif/webp) **or** `image_url` (http/https) |
| DELETE | `/pins/:id` | Owner or admin |
| POST / DELETE | `/pins/:id/like` | `{success, likes_count}` |
| POST / DELETE | `/pins/:id/favorite` | private bookmark |
| GET | `/favorites` | your favourites |
| GET / POST | `/pins/:id/comments` | POST `comment_text` (max 1000) |
| GET / POST | `/boards` | your boards / create (`name`, `description?`) |
| GET | `/boards/:id/pins` | `{board, pins}` |
| POST | `/boards/:id/pins` | `{pin_id}`; owner only |
| DELETE | `/boards/:id/pins/:pinId` | owner only |

## Admin only (`role = admin`)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/metrics` | counts + pins per category |
| GET | `/admin/users` | all users with pin counts |
| POST | `/admin/users/:id/role` | `{role: "user"\|"admin"}`; not yourself |
| POST | `/admin/users/:id/edit` | edit any profile |
| DELETE | `/admin/users/:id` | not yourself, not the last admin |
| POST | `/admin/categories` | `{name}` (max 50) |
| DELETE | `/admin/categories/:id` | its pins move to "Other"; "Other" cannot be deleted |

## Files

Uploaded images are served from `/uploads/<random>.<ext>` and thumbnails from `/uploads/<random>_thumb.webp`
(cached for 7 days). Pins expose `image_url` and `thumb_url` (`null` for pins that link to an external image).
