# Bloom — Habit Tracker

A small, gentle habit tracker built with React + Vite. Calendar-first
interface, flexible per-habit schedules, streaks with grace days, a year
heatmap, optional cloud sync, and installable as a PWA.

> 🌐 **Live demo:** <!-- TODO: paste your deployed URL here after deployment -->
> _Add your deployed URL here_

![Bloom favicon](public/favicon.svg)

## Highlights

- 📅 **Calendar-first** — the whole month at a glance, one card per day
- 🌸 **Flexible schedules** per habit — daily, specific weekdays, every-N-days, or N times per week
- 🎯 **Quantified habits** with daily targets (e.g. "drink 8 cups", "read 30 min")
- 🏷️ **Tags + filtering**, color-coded
- 🔥 **Streaks** with optional weekly grace days
- 📊 **Stats page**, year heatmap, downloadable monthly summary
- 🔔 **Browser reminders** (fires while the app is open)
- ☁️ **Optional cloud sync** via Supabase (email + password auth)
- 📱 **Installable PWA** — works offline, drops into your dock / home screen
- 🎨 Six built-in themes

## Quick start

```bash
git clone <your-fork-url>
cd habit-tracker
npm install
npm run dev
```

Open <http://localhost:5173>. Bloom runs in **guest mode** by default — all
data lives in your browser's localStorage. You can use the entire app this way
without any backend setup.

To enable cross-device sync and accounts, follow the optional Supabase setup
below.

## Cloud sync (optional)

Bloom uses [Supabase](https://supabase.com) for auth + a single JSON blob per
user. The free tier covers personal use indefinitely.

### 1. Create a Supabase project

[supabase.com](https://supabase.com) → **New project**. The free tier is
plenty.

### 2. Run the schema

In the Supabase dashboard, open the **SQL editor** and run
[`supabase/schema.sql`](supabase/schema.sql). It creates one table
(`user_data`) with row-level-security policies that scope every row to its
owner — your data is invisible to other users by default.

### 3. Wire up environment variables

```bash
cp .env.example .env.local
```

Fill in the two values from **Project Settings → API** in the Supabase
dashboard:

- `VITE_SUPABASE_URL` — the project URL (`https://<project-ref>.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` — the **anon / publishable** key (the public one,
  not the `service_role` / `secret` key)

> ⚠️ Never commit your real `.env.local` — it's already in `.gitignore`.

### 4. Configure auth redirect URLs

In Supabase **Authentication → URL Configuration**, add your dev origin
(`http://localhost:5173`) and your deployed URL under both **Site URL** and
**Redirect URLs**. Without this, signup confirmations and password resets
won't redirect back into your app.

### 5. (Optional) Skip email confirmation

Bloom uses email + password (not magic links) so emails only send on signup
and password reset. To skip the confirmation email entirely, in Supabase
**Authentication → Providers → Email**, uncheck **Confirm email**. New
signups become instant — useful for personal projects with no privacy stakes.

## Deploy your own

Bloom builds to a static SPA. The two free-forever options:

### Vercel (recommended for ease)

1. Push your fork to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Set:
   - **Root Directory:** `habit-tracker` (if the app is in a subfolder)
   - **Framework Preset:** Vite (auto-detected)
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Environment
   Variables** for both *Production* and *Preview*.
5. Deploy. Add the resulting `*.vercel.app` URL to Supabase auth redirect URLs.

`vercel.json` is checked in so you get sensible security headers + cache
control out of the box.

### Cloudflare Pages (recommended for unlimited bandwidth)

Same flow at [pages.cloudflare.com](https://pages.cloudflare.com). Build
command: `npm run build`. Output: `dist`. `_redirects` and `_headers` files
in `public/` are pre-configured.

### Cost summary

| Service | Free tier covers |
|---|---|
| Vercel / Cloudflare Pages | Static hosting, custom domain, SSL |
| Supabase | 500 MB DB, 5 GB egress, 50k MAU, magic-link emails (rate-limited) |
| Google Fonts | Free, no API key |

Realistic personal use never escapes the free tiers.

## Install as a PWA

Bloom is a Progressive Web App — once deployed, it can be installed to the
home screen / dock and runs in its own window with offline support.

- **Chrome / Edge / Brave (desktop & Android):** an "Install" pill appears
  in the header when the browser deems the app installable. The address bar
  also shows a native install icon.
- **Safari macOS 17+:** *File → Add to Dock*.
- **iOS / iPadOS:** Share menu → *Add to Home Screen*.

The service worker pre-caches the app shell on first visit, so you can open
Bloom and edit habits with no network. Cloud syncs queue and complete the
next time you're online.

## Architecture notes

- **Local-first.** Every hook (`useHabits`, `useChecks`, `useSettings`,
  `useTheme`) reads/writes localStorage synchronously. The cloud is a sync
  layer on top, not a dependency.
- **Single JSON payload per user** in Supabase (`user_data.payload`). Trivial
  to evolve, atomic writes, last-write-wins.
- **Server is the source of truth on login.** Hydration overrides local
  state. First-time signin with existing local data prompts the user to
  upload it.

## Stack

- [React 19](https://react.dev) + [Vite 8](https://vite.dev)
- [Supabase](https://supabase.com) for auth + sync
- [@dnd-kit](https://dndkit.com) for drag/drop reordering
- [lucide-react](https://lucide.dev) for icons
- Plain CSS with custom properties for theming

## Project layout

```
src/
├── components/    UI components (DayCard, Stats, AuthGate, ...)
├── hooks/         Domain hooks (useHabits, useAuth, useCloudSync, ...)
├── lib/           Pure utilities (stats, dataIO, supabase client)
└── styles/        Global CSS + theme variables
public/
├── service-worker.js
├── manifest.webmanifest
└── favicon.svg
supabase/
└── schema.sql     One-time DB setup
```

## Contributing

Issues and PRs welcome. The codebase is small and self-contained — no test
framework yet, but every file aims to read top-to-bottom.

## License

Use it however you like.
