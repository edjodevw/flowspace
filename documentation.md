# FlowSpace Documentation

**Design your day. Own your time.**

FlowSpace is a personal productivity workspace that unifies tasks, habits, focus sessions, and calendar planning in one minimalist app. Built as a full-stack portfolio project with JWT auth, PostgreSQL, and a role-gated admin dashboard.

---

## Table of contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech stack](#tech-stack)
4. [Project structure](#project-structure)
5. [Getting started](#getting-started)
6. [Environment variables](#environment-variables)
7. [API reference](#api-reference)
8. [Data model](#data-model)
9. [Auth & security](#auth--security)
10. [Frontend routes](#frontend-routes)
11. [Demo walkthrough](#demo-walkthrough)
12. [Technical highlights](#technical-highlights)
13. [Scripts](#scripts)
14. [Future ideas](#future-ideas)

---

## Overview

| Layer | Role |
|--------|------|
| **Client** | React SPA (Vite) — landing page, auth screens, and the `/app` workspace |
| **Server** | Express REST API with Prisma ORM |
| **Database** | PostgreSQL |

Users register with email/password, receive a JWT, and manage their own productivity data. Admins (`isAdmin: true`) can open a read-only platform dashboard.

---

## Features

### For users

| Feature | Description |
|---------|-------------|
| **Tasks** | Kanban board (`todo` → `inprogress` → `done`) with priority, tags, due dates, nested subtasks, drag-and-drop between columns |
| **Habits** | Create, rename, delete habits; daily check-in / uncheck; streak calculation; one log per habit per day |
| **Pomodoro** | Focus / short break / long break timers; completed sessions saved to the API; durations synced to the account |
| **Calendar** | Month view with CRUD events (title, description, times, all-day, color) |
| **Insights** | Personal 7-day analytics: tasks done, habit check-ins, focus minutes, bar chart |
| **Settings** | Profile name/email, password change, Pomodoro prefs, feedback, account deletion |
| **Theme** | Light / dark mode |

### For admins

| Feature | Description |
|---------|-------------|
| **Admin dashboard** | Platform counts, user list, recent activity, 7-day chart, feedback inbox |

### Public

| Feature | Description |
|---------|-------------|
| **Landing page** | Marketing site with live public stats (users, completed tasks, habits) |

---

## Tech stack

### Client (`client/`)

- React 19 + Vite 8
- React Router 7
- TanStack Query
- Axios
- Tailwind CSS 3
- Lucide icons
- Recharts
- react-hot-toast

### Server (`server/`)

- Express 5
- Prisma 5 + PostgreSQL
- JWT (`jsonwebtoken`)
- bcryptjs
- CORS (origin allowlist)
- Custom in-memory rate limiting on login/register

---

## Project structure

```
flowspace/
├── client/                 # React frontend
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── api/            # Axios instance
│   │   ├── components/     # Navbar, ConfirmModal, …
│   │   ├── context/        # AuthContext, ThemeContext
│   │   ├── pages/          # Landing, auth, app pages
│   │   ├── App.jsx         # Authenticated app shell + routes
│   │   └── main.jsx        # Router, providers, route guards
│   └── .env.example
├── server/                 # Express API
│   ├── middleware/         # auth, admin, rateLimit
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.js
│   ├── routes/             # auth, tasks, habits, …
│   └── index.js
└── documentation.md        # This file
```

---

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a remote connection string)

### 1. Clone and install

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Configure the server

Create `server/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/flowspace"
JWT_SECRET="replace-with-a-long-random-string"
PORT=5000
CORS_ORIGIN="http://localhost:5173"
```

### 3. Database setup

```bash
cd server
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

### 4. Configure the client (optional)

Copy `client/.env.example` to `client/.env` if the API is not on the default URL:

```env
VITE_API_URL=http://localhost:5000/api
```

If unset, the client defaults to `http://localhost:5000/api`.

### 5. Run locally

Terminal 1 — API:

```bash
cd server
npm run dev
```

Terminal 2 — UI:

```bash
cd client
npm run dev
```

Open the Vite URL (usually `http://localhost:5173`).

---

## Environment variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret used to sign JWTs |
| `PORT` | No | API port (default `5000`) |
| `CORS_ORIGIN` | No | Comma-separated allowed origins (default `http://localhost:5173`) |

### Client (`client/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | API base URL including `/api` (default `http://localhost:5000/api`) |

---

## API reference

Base URL: `http://localhost:5000/api`

Unless noted, protected routes need:

```http
Authorization: Bearer <jwt>
```

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/register` | No | Create account (name, email, password ≥ 6). Returns `{ token, user }` |
| `POST` | `/login` | No | Login. Returns `{ token, user }` |
| `GET` | `/me` | Token | Current user |
| `PUT` | `/profile` | Yes | Update name / email |
| `PUT` | `/password` | Yes | Change password (requires current password) |
| `GET` | `/settings` | Yes | User settings JSON (Pomodoro prefs, tags) |
| `PUT` | `/settings` | Yes | Merge-update settings |
| `DELETE` | `/account` | Yes | Delete account (password confirmation) |

Login and register are rate-limited (30 requests / 15 minutes per IP).

### Tasks — `/api/tasks`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List current user’s tasks |
| `POST` | `/` | Create task |
| `PUT` | `/:id` | Update owned task (sets `completedAt` when status → `done`) |
| `DELETE` | `/:id` | Delete owned task |

### Habits — `/api/habits`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List habits + logs |
| `POST` | `/` | Create habit |
| `PUT` | `/:id` | Rename owned habit |
| `POST` | `/:id/log` | Check in for today (unique per day) |
| `DELETE` | `/:id/log` | Remove today’s check-in |
| `DELETE` | `/:id` | Delete habit + logs |

### Pomodoro — `/api/pomodoro`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Recent sessions (last 20) |
| `POST` | `/` | Save completed session `{ duration, type }` |

### Events — `/api/events`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/?year=&month=` | List events (optional month filter) |
| `POST` | `/` | Create event |
| `PUT` | `/:id` | Update owned event |
| `DELETE` | `/:id` | Delete owned event |

### Insights — `/api/insights`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/summary` | Personal weekly summary + daily chart series |

### Feedback — `/api/feedback`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/` | Submit feedback message |

### Public — `/api/public`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/stats` | `{ totalUsers, totalTasks, totalHabits }` (tasks = completed count) |

### Admin — `/api/admin` (JWT + `isAdmin`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/insights` | Platform totals |
| `GET` | `/users` | User list with resource counts |
| `GET` | `/activity` | Recent cross-user activity |
| `GET` | `/stats/daily` | 7-day tasks completed + pomodoros |
| `GET` | `/feedback` | All feedback with user info |

---

## Data model

```
User
 ├── settings (JSON)     # pomodoro durations, custom tags
 ├── isAdmin
 ├── Task[]               # status, priority, tag, dueDate, subtasks, completedAt
 ├── Habit[]
 │    └── HabitLog[]     # unique (habitId, day)
 ├── PomodoroSession[]
 ├── Event[]
 └── Feedback[]
```

Account deletion removes related rows in a transaction (habit logs, tasks, pomodoros, events, habits, feedbacks, then user).

---

## Auth & security

- Passwords hashed with **bcrypt** (cost 10).
- Sessions are **JWTs** (7-day expiry), stored in `localStorage` on the client.
- Mutating task/habit/event routes verify **resource ownership** (`userId` match) to prevent IDOR.
- Register validates email format and minimum password length on the server.
- Habit logs enforce **one check-in per habit per calendar day**.
- CORS is restricted to configured origins.
- Login/register endpoints are rate-limited.

---

## Frontend routes

| Path | Access | Page |
|------|--------|------|
| `/` | Public | Landing |
| `/login` | Guests only | Login |
| `/register` | Guests only | Register |
| `/app` | Auth | Redirects to tasks |
| `/app/tasks` | Auth | Kanban tasks |
| `/app/habits` | Auth | Habits |
| `/app/pomodoro` | Auth | Timer |
| `/app/calendar` | Auth | Calendar |
| `/app/insights` | Auth | Personal insights |
| `/app/settings` | Auth | Account settings |
| `/app/admin` | Auth + admin | Admin dashboard |

Protected routes use `ProtectedRoute` in `client/src/main.jsx`. Logged-in users hitting `/login` or `/register` are redirected to `/app`.

---

## Demo walkthrough

A short path to show the product:

1. Open the landing page → note public stats.
2. Register a new account → land in **Tasks**.
3. Create a task → drag it to **In Progress**, then **Done**.
4. Add a habit → check it in for today → rename it.
5. Run a short Pomodoro (or wait for a session save) → confirm it appears in history.
6. Add a calendar event for today.
7. Open **Insights** → see the 7-day chart update.
8. (Optional) Log in as admin → open **Admin** for platform overview.

---

## Technical highlights

Useful talking points for a portfolio or interview:

1. **Full-stack ownership** — React SPA + Express + Prisma/PostgreSQL with a real auth lifecycle (register, login, profile, password, delete account).
2. **Authorization, not just authentication** — JWT identifies the user; mutating routes also scope by `userId`.
3. **Product consistency** — Landing markets Insights; the app ships a user-facing Insights page backed by aggregated APIs.
4. **Synced preferences** — Pomodoro durations and task tags live in `User.settings` (JSON) with localStorage as a cache.
5. **Admin surface** — Role flag + middleware gate for platform analytics and feedback review.
6. **UX details** — Kanban drag-and-drop, dark mode, confirm dialogs, toast feedback, responsive sidebar/drawer.

---

## Scripts

### Server

```bash
npm run dev      # nodemon
npm start        # node index.js
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
npx prisma studio
```

### Client

```bash
npm run dev      # Vite dev server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint
```

---

## Future ideas

Not required for a portfolio demo, but natural next steps:

- Deploy (e.g. client on Vercel/Netlify, API + Postgres on Railway/Render)
- Password reset via email
- Soft delete / audit log for admin actions
- Link Pomodoro sessions to a specific task
- Automated tests for auth and ownership rules
- Replace seed demo passwords with env-driven secrets

---

## License

Personal / portfolio project. Adjust this section if you publish under a specific license.
