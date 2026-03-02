# Samsung Club of Chefs – Project Description

**Live Website:** [https://club-of-chefs.netlify.app/](https://club-of-chefs.netlify.app/)

## 1. Project Overview

**Samsung Club of Chefs** is a full-stack web application clone inspired by the Samsung Club of Chefs experience. It lets users explore Michelin-star chefs, recipes, club news, and editorials; save favorites; react to articles; and manage a profile with points and badges—all with a modern, responsive UI and optional dark mode.

---

## 2. Core Features

| Feature | Description |
|--------|-------------|
| **Home** | Hero section, featured chefs carousel, Chef’s Favorites (recipes), Club News (articles), Editor’s Notes (editorials), contact CTA, footer. |
| **Authentication** | Login/Register with username or Gmail + password. Local accounts stored in `localStorage`; sample user (sai/sai123) seeded on first visit. |
| **Profile** | Account details (name, username, email, login type), stats (saved recipes, completed recipes, news responses, chefs followed), change password for local accounts. |
| **Chefs** | List of Michelin chefs with bios, timelines, famous dishes; follow/unfollow (favorite chefs) when logged in. |
| **Recipes** | Browse all recipes; save to “My Recipes”; view detail and step-by-step process; track progress (in progress, completed); recent recipes. |
| **News** | Club news articles; like/dislike; scenario actions (preorder, order, register, notify, guide). Reactions and actions persisted in DB when API is used. |
| **Editorials** | Editorial notes list and detail pages. |
| **Theme** | Light/Dark mode with preference saved in `localStorage`. |
| **AI Cooking Assistant** | Floating button to open a mock AI assistant panel; user can type ingredients and get placeholder recipe suggestions. |

---

## 3. Additional Features Added (Beyond Base Clone)

| Addition | Purpose |
|----------|---------|
| **Dual database backend** | Local dev: PGLite (WASM). Production: PostgreSQL via `DATABASE_URL` (e.g. Render Postgres) to avoid WASM issues on cloud. |
| **Netlify + Render deployment** | Frontend on Netlify (SPA); API on Render with Postgres; `VITE_API_BASE_URL` and `netlify.toml` for build and SPA routing. |
| **Logout → Login flow** | Client-side redirect to `/login` (no full reload) so Netlify doesn’t 404; preferences kept after re-login. |
| **Preference persistence across logout** | On logout only `clubAuthUser` is cleared; saved recipes, favorites, points, badges, theme, recipe progress, and `newsReactionUserId` stay in `localStorage` so they work again after re-login. |
| **API health/db check** | `GET /api/health/db` returns `{ ok, database: 'postgres' \| 'pglite' }` for deployment verification. |
| **Build script for Netlify** | `node node_modules/typescript/bin/tsc -b && node node_modules/vite/bin/vite.js build` to avoid `tsc` permission issues in Netlify’s environment. |

---

## 4. Technologies Used

### Frontend
- **React 19** – UI components and state.
- **TypeScript** – Typed JS.
- **Vite 7** – Build tool, dev server, HMR.
- **React Router 7** – Client-side routes.
- **Tailwind CSS** – Styling and theme (light/dark).
- **Framer Motion** – Animations and transitions.
- **Radix UI** – Accessible primitives (dialogs, dropdowns, etc.).
- **Lucide React** – Icons.
- **date-fns** – Date formatting.
- **React Hook Form + Zod** – Forms and validation.
- **Recharts** – Charts (if used in profile/stats).
- **Swiper / Embla Carousel** – Carousels.
- **next-themes** – Theme handling (optional).
- **Sonner** – Toasts (if used).

### Backend
- **Node.js** – Runtime.
- **Express 5** – API server.
- **PostgreSQL** – Production DB (via `pg` when `DATABASE_URL` is set).
- **PGLite** – Local/dev in-process Postgres (when `DATABASE_URL` is not set).
- **CORS** – Enabled for cross-origin requests (Netlify → Render).

### DevOps / Hosting
- **Netlify** – Frontend hosting, SPA redirects, env `VITE_API_BASE_URL`.
- **Render** – API hosting and (optionally) Postgres; env `DATABASE_URL`, `API_PORT`.

### Dev / Tooling
- **ESLint** – Linting.
- **TypeScript (tsc)** – Type checking and build.
- **PostCSS / Autoprefixer** – CSS processing.

---

## 5. Images and Assets

### 5.1 Local images (in `public/`)

These are served at the root (e.g. `/hero-chefs.jpg`).

| File | Usage |
|------|--------|
| `hero-chefs.jpg` | Hero background on home. |
| `chef-favorites-bg.jpg` | Chef’s Favorites section background. |
| `club-news-bg.jpg` | Club News section background. |
| `editors-notes-bg.jpg` | Editor’s Notes section background. |
| `brand-kitchen.jpg` | Brand/kitchen image in brand section. |
| `news-kitchen.jpg` | News/kitchen imagery. |
| `chef-michel.jpg` | Chef Michel image. |
| `editorial-valentine.jpg` | Editorial (e.g. Valentine). |
| `editorial-winter.jpg` | Editorial (e.g. Winter). |
| `recipe-1.jpg` … `recipe-8.jpg` | Recipe cards and details (home + recipe pages). |

### 5.2 External images

- **Unsplash** – Chef avatars and many recipe/food images (`https://images.unsplash.com/...`).
- **Picsum** – Placeholder images for some news and editorials (`https://picsum.photos/seed/...`).

### 5.3 In-app image usage

- **Chefs:** Avatar/image from seed data (Unsplash URLs).
- **Recipes:** `recipe.image` – local (`/recipe-N.jpg`) or from seed (Unsplash/Picsum).
- **News/Editorials:** `article.image` from API/seed (Picsum/Unsplash).
- **Backgrounds:** Inline `backgroundImage: 'url(/hero-chefs.jpg)'` etc. in sections.
- **UI:** SVG noise texture in CSS for subtle background effect.

---

## 6. Data and Processing

### 6.1 API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check `{ ok: true }`. |
| GET | `/api/health/db` | `{ ok, database: 'postgres' \| 'pglite' }`. |
| GET | `/api/content` | App content (chefs, recipes, news, editorials, badges); optional `?userId=` for user-specific news data. |
| GET | `/api/news` | News list; optional `?userId=`. |
| GET | `/api/news/:articleId` | Single article; optional `?userId=`. |
| POST | `/api/news/:articleId/react` | Like/dislike; body `{ userId, reaction }`. |
| POST | `/api/news/:articleId/action` | Scenario action; body `{ userId, action }`. |
| GET | `/api/editorials` | Editorials list. |
| GET | `/api/editorials/:editorialId` | Single editorial. |

### 6.2 Database (Postgres / PGLite)

- **app_content** – Key-value store for seed data (chefs, recipes, news list, editorials, badges).
- **news_feedback** – Like/dislike counts per article.
- **news_user_reactions** – User’s like/dislike per article.
- **news_actions** – Action count per article.
- **news_user_actions** – User’s action per article.

Seed data is upserted on server start (`initDb`); user reactions/actions persist across restarts when using Postgres.

### 6.3 Client-side storage (localStorage / sessionStorage)

- **Auth:** `clubAuthUser`, `clubUsers`.
- **Preferences (persist across logout):** `savedRecipes`, `favoriteChefIds`, `userPoints`, `earnedBadges`, `themeMode`, `recipeProcessProgress`, `inProgressRecipeIds`, `recentRecipeIds`, `newsReactionUserId`, `cookingLevel`.
- **Session:** `returnToRecipePath`, `returnToNewsSection`, `returnToChefsSection`, `newsScrollY`, `logoutSuccess`.

---

## 7. Routes (Pages)

| Path | Page | Description |
|------|------|-------------|
| `/` | App (Home) | Full home experience. |
| `/login` | LoginPage | Login / register. |
| `/profile` | ProfilePage | Account and stats (requires login). |
| `/chefs` | AllChefsPage | All chefs, follow/unfollow. |
| `/recipes` | AllRecipesPage | All recipes, save/start. |
| `/recipes/:recipeId` | RecipeDetailPage | Recipe detail. |
| `/recipes/:recipeId/process` | RecipeProcessPage | Step-by-step cooking process. |
| `/news` | AllNewsPage | All news. |
| `/news/popular` | PopularArticlesPage | Popular news. |
| `/news/latest` | LatestArticlesPage | Latest news. |
| `/news/:articleId` | NewsArticlePage | Single article, react/action. |
| `/editorials` | EditorialsPage | All editorials. |
| `/editorials/:editorialId` | EditorialDetailPage | Single editorial. |

---

## 8. Environment Variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_API_BASE_URL` | Netlify (build) | API base URL for the frontend (e.g. `https://your-api.onrender.com`). |
| `DATABASE_URL` | Render (API) | Postgres connection string; if unset, PGLite is used locally. |
| `API_PORT` | Render / local | Port for the API server (default 4000). |

---

## 9. Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite --open` | Frontend dev server. |
| `api:dev` | `node server/index.ts` | API server (PGLite or Postgres from env). |
| `dev:full` | `api:dev` + `dev` | Frontend + API together. |
| `build` | `tsc -b && vite build` | Production build (output in `dist/`). |
| `preview` | `vite preview` | Preview production build. |
| `lint` | `eslint .` | Lint. |

This document summarizes the project description, features, added features, technologies, images, and main processing and configuration details.
