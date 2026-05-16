# Nosedive — Social Rating App

Rate the people in your life. Be rated by them. Your score reflects who you are — weighted by how well they know you.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (Postgres, Auth, Realtime, Row Level Security)
- **Tailwind CSS** — dark/neon design
- **Recharts** — radar chart for skill breakdown
- **Framer Motion** — animations

## Quick Start

### 1. Install Node.js

Download from https://nodejs.org (LTS version recommended).

### 2. Set up Supabase

1. Create a free project at https://supabase.com
2. In your project, go to **SQL Editor** and paste the contents of `supabase/migrations/001_initial_schema.sql` — run it.
3. Copy your **Project URL** and **anon public** key from **Settings → API**.

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Install & run

```bash
npm install
npm run dev
```

Open http://localhost:3000

---

## How the Proximity Weight Algorithm Works

When you rate someone, your rating's influence is computed from **how close you are** to that person:

```
closeness_score = 
  0.35 × interaction_count_score   (how many times you've interacted)
  0.30 × connection_type_score     (colleague/friend/acquaintance/stranger)
  0.20 × recency_score             (how recently you interacted)
  0.15 × mutual_connections_score  (shared connections)
```

| Connection | Base influence |
|---|---|
| Friend | 90% base |
| Colleague | 80% base |
| Acquaintance | 50% base |
| Stranger | 10% base |

A stranger's 5-star rating contributes far less to your score than a close colleague's 3-star rating.

**Weighted score** = `raw_score × closeness_score` (min 10% so all voices count a little)

---

## Features

- **User profiles** — avatar, bio, occupation, location
- **6 rating metrics** — Kindness, Leadership, Friendship, Reliability, Creativity, Professionalism
- **Radar chart** — visual breakdown of your metric scores
- **Semi-anonymous ratings** — you see the score and weight, not who rated you
- **Proximity weight badge** — shows how much each rating contributed
- **Live search** — find anyone by name or username
- **Rating feed** — all ratings you've received, with metric breakdown

## Project Structure

```
src/
├── app/
│   ├── (app)/             # Protected app routes (Navbar layout)
│   │   ├── dashboard/     # Home — your score, recent ratings
│   │   ├── profile/[username]/  # Public profile + radar chart
│   │   ├── rate/[userId]/ # Rate a person (the core screen)
│   │   ├── search/        # Search users
│   │   └── feed/          # Your incoming ratings
│   ├── auth/              # Login + Signup
│   └── page.tsx           # Landing page
├── components/
│   ├── ui/                # ScoreRing, MetricSlider, UserCard, RatingCard
│   └── Navbar.tsx
├── lib/
│   ├── algorithm/proximity.ts   # The proximity weight algorithm
│   ├── supabase/                # Client + server helpers
│   └── utils.ts
└── types/index.ts
```
