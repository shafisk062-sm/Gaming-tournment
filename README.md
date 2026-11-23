# Arena X — Esports Tournament Hub

A responsive MERN esports tournament portal with authentication, tournaments, teams, matches, leaderboard, notifications, and an administrator dashboard.

## Requirements

- Node.js 18 or later
- MongoDB running locally, or a MongoDB Atlas connection string

## Installation

```powershell
npm install
npm install --prefix frontend
npm install --prefix backend
Copy-Item backend\.env.example backend\.env
```

Update `backend/.env` with a real `MONGODB_URI` and `JWT_SECRET`.

## Run locally

From the project root:

```powershell
npm run dev
```

This starts both the backend API and frontend. Open the **Local** URL printed by Vite (normally `http://localhost:5173`). If that port is in use, Vite automatically selects another one.

To load the demo data, run this once from the project root while MongoDB is running:

```powershell
npm run seed --prefix backend
```

## Deploy to Vercel

Import this repository into Vercel with the repository root as the project root. The root `vercel.json` builds a public Vite frontend, routes `/api/*` to the Express backend, and rewrites frontend deep links to the SPA entry point.

Set these environment variables for the backend service in Vercel:

- `MONGODB_URI`: your MongoDB Atlas connection string
- `JWT_SECRET`: a long, random secret
- `JWT_EXPIRES`: optional; defaults to `7d`

The frontend uses the same-domain `/api` path, so no frontend API URL or service binding is required. Locally, Vite proxies `/api` to the backend on port `5000`.

## Demo accounts

After seeding:

- Admin: `admin@arenax.gg` / `Admin@123`
- Player: `player1@demo.gg` / `Player@123`

## Main API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/games`
- `GET /api/tournaments`
- `GET /api/tournaments/:id`
- `POST /api/tournaments/:id/register`
- `POST /api/teams`
- `GET /api/leaderboard`
- `GET /api/matches`
- `GET /api/admin/stats`
