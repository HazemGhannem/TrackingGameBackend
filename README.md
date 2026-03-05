# LoL Live Game Tracker API

A backend service for tracking League of Legends players' live games and notifying users in real-time. Built with **Node.js**, **TypeScript**, **MongoDB**, **Redis**, and **Socket.IO**. Integrates with the **Riot Games API** via the player module.

---

## Features

- Track favorite League of Legends players.
- Polls live games every 2 minutes using Riot API.
- Sends real-time notifications when a player starts or finishes a game.
- Stores recent game state in **Redis** for performance.
- Fetch last match result and champion statistics.
- Handles rate-limiting from Riot API (HTTP 429) with exponential backoff retry.
- Job queue with **BullMQ** — prevents overlapping poll cycles and survives server restarts.
- Queue monitoring dashboard via **Bull Board** at `/admin/queues`.

---

## Tech Stack

- **Node.js / TypeScript**
- **Express** – HTTP server
- **MongoDB** – Player & favorites storage
- **Redis (Upstash)** – Caching live game states + BullMQ job queue
- **Socket.IO** – Real-time notifications
- **Axios** – Riot API requests
- **BullMQ** – Job queue for scheduled polling (replaces node-cron)
- **Bull Board** – Queue monitoring UI
- **Pino** – Structured logging
- **Helmet** – HTTP security headers
- **Zod** – Request validation

---

## Queue Architecture

Polling is handled by a **BullMQ worker** instead of raw cron:
```
Every 2 min → BullMQ adds job to Redis queue
                → Worker picks up job (concurrency: 1)
                    → pollTrackedPlayers() runs
                    → Notifies users via Socket.IO
                → Job marked complete
                → Worker waits for next job
```

**Why BullMQ over cron:**
- `concurrency: 1` prevents two poll cycles from overlapping
- Jobs survive server restarts — Redis keeps the queue state
- Failed jobs retry automatically with exponential backoff (3 attempts)
- Full visibility via Bull Board dashboard

---

## Problem Chosen & Why it Matters

I built this project because I like to get notifications when my friends play games. This solves my own problem and can help other users follow their favorite players in real-time.

---

## What I'd Build Next

Given more time, I would add a **tournament league feature** where users can:

- Add players to tournaments.
- Join tournaments for prize money.
- Track tournament progress in real-time.

---

## Install & Run Instructions
```bash
npm install
npm run dev
```

---

## Environment Variables

Create a `.env` file in the root:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/your-db
REDIS_URL=redis://default:password@host:6379
RIOT_API_KEY=your-riot-api-key
FRONTEND_URL=http://localhost:3000
ADMIN_SECRET=your-admin-secret
```

---

## Monitoring

Bull Board is available at:
```
http://localhost:5000/admin/queues
```
Requires `x-admin-key: your-admin-secret` header.

---

## Authenticity / AI Policy

I used **Claude** to help generate some components and discuss architecture decisions.

I **reviewed, modified, and verified all AI-suggested code myself** to ensure it works correctly, fits my project, and follows best practices. Specifically:

- Adjusted generated components to integrate with Redux and the backend API.
- Fixed TypeScript types and interfaces for proper type safety.
- Replaced AI-suggested node-cron with BullMQ after understanding the overlap problem.

## All final code in this repository has been reviewed and tested manually.