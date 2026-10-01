Recommended project folder structure

src/
  ├─ assets/         # static assets (images, fonts)
  ├─ components/     # shared Vue components
  │   └─ common/     # small, reusable components
  ├─ pages/          # route/page components
  ├─ layouts/        # layout components
  ├─ store/          # state management (pinia/vuex)
  ├─ services/       # API clients and data services
  ├─ utils/          # utility helpers
  ├─ types/          # TypeScript types and interfaces
  ├─ hooks/          # composables / custom hooks
  ├─ plugins/        # Vue plugins and app bootstrap
  └─ styles/         # global styles and variables

tests/
  ├─ unit/
  └─ e2e/

Notes:
- Add index files as needed; keep components small and focused.
- I can create starter `index.ts` or `README` files in each folder if you want.
