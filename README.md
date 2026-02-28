# LoL Live Game Tracker API

A backend service for tracking League of Legends players’ live games and notifying users in real-time. Built with **Node.js**, **TypeScript**, **MongoDB**, **Redis**, and **Socket.IO**. Integrates with the **Riot Games API** via the player module.

---

## Features

- Track favorite League of Legends players.
- Polls live games every 2 minutes using Riot API.
- Sends real-time notifications when a player starts or finishes a game.
- Stores recent game state in **Redis** for performance.
- Fetch last match result and champion statistics.
- Handles rate-limiting from Riot API (HTTP 429).

---

## Tech Stack

- **Node.js / TypeScript**  
- **Express** – HTTP server  
- **MongoDB** – Player & favorites storage  
- **Redis** – Caching live game states  
- **Socket.IO** – Real-time notifications  
- **Axios** – Riot API requests  
- **Node-Cron** – Scheduled polling jobs  

---
---

## Problem Chosen & Why it Matters

I built this project because I like to get notifications when my friends play games. This solves my own problem and can help other users follow their favorite players in real-time.

---

## What I’d Build Next

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
REDIS_URL=redis://localhost:6379
RIOT_API_KEY=your-riot-api-key
FRONTEND_URL=http://localhost:3000
