# AI Control Room

A sophisticated, multi-domain Agentic AI Control Room for enterprise AI agent orchestration.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AI AGENT CONTROL ROOM                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Agent Studio │  │  Monitoring  │  │   Config     │              │
│  │   (No-Code)  │  │  Dashboard   │  │   Manager    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│                    ORCHESTRATION LAYER                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Agent Router → Workflow Engine → Tool Registry → Memory    │   │
│  └─────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│                    MULTI-TENANT DATA LAYER                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │ Tenant A   │  │ Tenant B   │  │ Tenant C   │  │ Tenant N   │   │
│  │ (Isolated) │  │ (Isolated) │  │ (Isolated) │  │ (Isolated) │   │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Quick Start (Windows)

### Prerequisites

- **Node.js 18+**: Download from https://nodejs.org/
- **Git**: Download from https://git-scm.com/

### 1. Clone the Repository

```powershell
# Open PowerShell or Command Prompt
cd C:\Users\sumit\Documents\AIControl

# Clone the repo (or download ZIP)
git clone https://github.com/SumitAG008/agentic-aicontrol.git .

# Or if you already have files, just navigate to the folder
```

### 2. Setup Frontend

```powershell
# Navigate to frontend
cd C:\Users\sumit\Documents\AIControl\frontend

# Install dependencies
npm install

# Create environment file
copy .env.example .env.local

# Start development server
npm run dev
```

Frontend will be available at: **http://localhost:3000**

### 3. Setup Backend

```powershell
# Open new terminal, navigate to backend
cd C:\Users\sumit\Documents\AIControl\backend

# Install dependencies
npm install

# Create environment file
copy .env.example .env

# Initialize database (SQLite - no setup required!)
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Backend API will be available at: **http://localhost:3001**

## Database Options

### Option 1: SQLite (Default - Recommended for Local Dev)

No setup required! Database file is created automatically.

```env
DATABASE_URL="file:./dev.db"
```

### Option 2: Free Cloud PostgreSQL

| Provider | Free Tier | URL |
|----------|-----------|-----|
| **Neon** | 3GB | https://neon.tech |
| **Supabase** | 500MB | https://supabase.com |
| **Railway** | 500MB | https://railway.app |

To use PostgreSQL:

1. Sign up for a free account
2. Create a new database
3. Copy the connection string
4. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
5. Update `.env`:
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/dbname"
   ```
6. Run: `npx prisma db push`

### Option 3: Free Cloud MySQL

| Provider | Free Tier | URL |
|----------|-----------|-----|
| **PlanetScale** | 5GB | https://planetscale.com |
| **Railway** | 500MB | https://railway.app |

## Project Structure

```
C:\Users\sumit\Documents\AIControl\
├── frontend/                 # Next.js 14 React App
│   ├── src/
│   │   ├── app/             # Pages (App Router)
│   │   │   ├── dashboard/   # Main dashboard
│   │   │   ├── agents/      # Agent management
│   │   │   └── builder/     # Agent builder studio
│   │   ├── components/      # React components
│   │   │   ├── ui/          # Base UI (Button, Card, etc.)
│   │   │   ├── layout/      # Sidebar, Header
│   │   │   └── dashboard/   # Dashboard widgets
│   │   ├── lib/             # Utilities
│   │   └── types/           # TypeScript types
│   ├── package.json
│   └── tailwind.config.ts
│
├── backend/                  # Express.js API Server
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   │   ├── agents.ts    # /api/agents
│   │   │   ├── tools.ts     # /api/tools
│   │   │   ├── runs.ts      # /api/runs
│   │   │   └── tenants.ts   # /api/tenants
│   │   └── index.ts         # Server entry
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
│
├── docs/                     # Documentation
│   └── IMPLEMENTATION_PLAN.md
│
└── README.md
```

## Available Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/dashboard` | Mission control overview |
| Agents | `/agents` | Manage AI agents |
| Agent Builder | `/builder` | Create agents with NL |
| Tools | `/tools` | Tool registry (coming) |
| Logs | `/logs` | Execution logs (coming) |

## API Endpoints

```
GET    /api/agents              # List all agents
POST   /api/agents              # Create agent
GET    /api/agents/:id          # Get agent
PUT    /api/agents/:id          # Update agent
DELETE /api/agents/:id          # Delete agent
POST   /api/agents/:id/start    # Start agent
POST   /api/agents/:id/stop     # Stop agent

GET    /api/runs                # List runs
GET    /api/runs/:id            # Get run details
GET    /api/runs/:id/steps      # Get execution steps

GET    /api/tools               # List tools
POST   /api/tools/:id/test      # Test tool connection

GET    /api/tenants             # List tenants
GET    /api/tenants/:id/usage   # Get usage stats
```

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - UI components
- **Framer Motion** - Animations
- **Zustand** - State management
- **TanStack Query** - Data fetching

### Backend
- **Express.js** - API server
- **Prisma** - Database ORM
- **SQLite/PostgreSQL** - Database
- **Zod** - Validation

## Development Commands

### Frontend
```powershell
npm run dev      # Start dev server (port 3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run linter
```

### Backend
```powershell
npm run dev      # Start dev server (port 3001)
npm run build    # Compile TypeScript
npm run start    # Start production server

# Database
npx prisma generate   # Generate Prisma client
npx prisma db push    # Push schema to database
npx prisma studio     # Open database GUI
npx prisma migrate dev # Run migrations
```

## Troubleshooting

### Port already in use
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Node modules issues
```powershell
# Delete and reinstall
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Database issues
```powershell
# Reset database
del prisma\dev.db
npx prisma db push
```

## License

MIT
