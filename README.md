# F1 Pit Wall — Race Strategy Simulator

A browser-based Formula 1 race strategy game that puts you in the role of a race engineer. Manage tire compounds, pit stops, undercuts, overccuts, and react to weather and safety car events lap by lap.

![F1 Pit Wall Screenshot](public/screenshot.png)

## Features

- **Pre-race track briefing** with tire degradation profiles, compound characteristics, pit lane time loss, overtaking difficulty, and undercut/overcut strength ratings
- **Pirelli-style suggested strategies** for each circuit before you set your own plans
- **Strategy planning** — define Plan A, Plan B, and Plan C with customizable stints, pit windows, compound choices, and fallback rules for safety car and rain
- **Car setup** screen with downforce level, tire preservation bias, balance bias, wet weather tuning, and fuel load
- **Full race simulation** — 52 laps (Silverstone), 53 laps (Monza), or 78 laps (Monaco), progressing lap by lap with:
  - Safety cars and VSC deployments
  - Red flags with field compression
  - Dynamic weather (dry → damp → wet → very wet)
  - Tire degradation curves and cliff points
  - AI strategy decisions for 19 other drivers
- **Live timing tower** with gaps, lap times, tire wear, and pit stop counts
- **Undercut / overcut analysis** with real-time recommendations ("Undercut viable", "Overcut risky due to deg")
- **Race action buttons** — Pit Now, Attempt Undercut, Cover Undercut, Commit to Overcut, Push, Conserve, Defend, Attack, React to SC, React to Rain
- **Engineer channel** event log with real-time strategy messages
- **End-of-race results** with full classification, points, and stint history

## Circuits Included

| Circuit | Laps | Deg Level | Key Trait |
|---|---|---|---|
| Silverstone (British GP) | 52 | High | Rear-limited, strong undercut |
| Monza (Italian GP) | 53 | Low | Thermal-limited, strong overcut |
| Monaco (Monaco GP) | 78 | Low | Front-limited, SC gamble circuit |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 8+

### Install & Run

```bash
# Clone / enter the repo
cd f1-strategy-game

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Deployment — Vercel (Recommended)

The app is fully static-ready and deploys on Vercel with zero configuration.

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts. The `vercel.json` at the root handles all configuration.

### Option B — GitHub + Vercel Dashboard

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repo
4. Vercel auto-detects Next.js — click **Deploy**

No environment variables are required. All data is local/mock.

### Option C — Other Platforms

```bash
npm run build
# Serve the .next directory with any Node.js host
npm start
```

Works on Railway, Render, Fly.io, etc. with Node.js runtime.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx         # Root layout + Google Fonts
│   ├── page.tsx           # Main game state orchestrator
│   └── globals.css        # Global styles, F1 timing screen theme
├── types/
│   └── index.ts           # All TypeScript type definitions
├── data/
│   ├── drivers.ts         # 20 F1 drivers with stats
│   ├── teams.ts           # 10 F1 teams with colors
│   ├── tracks.ts          # 3 circuits with tire profiles
│   └── index.ts
├── simulation/
│   ├── engine.ts          # Main race simulation engine (lap-by-lap)
│   ├── tireModel.ts       # Tire degradation, wear, compound deltas
│   ├── weatherSystem.ts   # Dynamic weather transitions
│   ├── underOvercut.ts    # Undercut/overcut analysis logic
│   ├── strategyAI.ts      # AI pit stop and pace decisions
│   └── index.ts
└── components/
    ├── screens/
    │   ├── TrackBriefing.tsx    # Step 1: Track & tire briefing
    │   ├── StrategyPlanning.tsx # Step 2: Define Plan A/B/C
    │   ├── SetupScreen.tsx      # Step 3: Car setup
    │   ├── RaceControl.tsx      # Step 4: Live race
    │   └── RaceResults.tsx      # Step 5: Final results
    └── race/
        ├── TimingTower.tsx      # Live timing with gaps + tire info
        ├── DriverCard.tsx       # Player driver summary + undercut alerts
        ├── StrategyPanel.tsx    # Plan A/B/C with active stint display
        ├── EventLog.tsx         # Engineer channel / race events
        ├── WeatherPanel.tsx     # Weather + race progress bar
        ├── ActionButtons.tsx    # All player race actions
        └── DegradationPanel.tsx # Tire wear analysis by compound
```

## Extending the Game

### Adding Circuits

Add a new entry to `src/data/tracks.ts` following the `TrackProfile` interface in `src/types/index.ts`. Define per-compound `baseWearPerLap`, `thermalSensitivity`, `cliffLap`, `cliffMultiplier`, and suggested strategies.

### Adding Drivers / Teams

Add entries to `src/data/drivers.ts` and `src/data/teams.ts`. All names and colors are data-driven — no code changes required in the UI layer.

### Tuning Simulation

The simulation parameters in `src/simulation/engine.ts` are well-commented. Key constants:
- `FUEL_EFFECT_PER_KG` — fuel effect per kg per lap
- `SC_LAP_TIME_INCREASE` — seconds lost per lap under safety car
- `BASE_VARIANCE` — random lap time variance amplitude

## Technology Stack

- **Next.js 14** (App Router)
- **React 18** with hooks
- **TypeScript 5** — strict mode, full type coverage
- **Tailwind CSS 3** with custom F1 dark theme
- **JetBrains Mono** font (Google Fonts)
- No backend, no database — fully self-contained

## License

This project is open source. F1 team and driver names are used for gameplay reference only. No official F1, FIA, or Pirelli logos or proprietary assets are included.
