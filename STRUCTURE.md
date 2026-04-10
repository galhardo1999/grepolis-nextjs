# 🏛️ Grepolis Project Structure

## 📂 Final Architecture

```
grepolis-nextjs/
│
├── Backend/                          # 🔧 API Server (Port 3001)
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/                 # All REST API endpoints
│   │   │   │   ├── auth/           # Authentication routes
│   │   │   │   ├── game/           # Game logic routes
│   │   │   │   └── cron/           # Scheduled tasks
│   │   │   ├── layout.tsx          # Root layout
│   │   │   └── page.tsx            # API info page
│   │   └── lib/                     # Backend-only utilities
│   │       ├── auth.ts             # JWT & session management
│   │       ├── db.ts               # Prisma client
│   │       └── [game-logic].ts     # Server-side logic
│   ├── prisma/                      # Database layer
│   │   └── schema.prisma           # Database schema
│   ├── .env                         # Environment variables
│   ├── .env.example                 # Environment template
│   ├── next.config.ts               # Next.js config + CORS
│   ├── package.json                 # Backend dependencies
│   └── tsconfig.json               # TypeScript config
│
├── Frontend/                        # 🎨 UI Application (Port 3000)
│   ├── src/
│   │   ├── app/
│   │   │   ├── game/               # Game interface
│   │   │   ├── login/              # Login page
│   │   │   ├── registro/           # Registration page
│   │   │   ├── layout.tsx          # Root layout
│   │   │   └── page.tsx            # Home page
│   │   ├── components/             # React components
│   │   │   ├── BarraSuperior.tsx
│   │   │   ├── MapaMundo.tsx
│   │   │   ├── Modal*.tsx
│   │   │   └── Painel*.tsx
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── useMotorJogo.ts
│   │   │   └── useFilaProgresso.ts
│   │   ├── store/                  # Zustand state management
│   │   │   └── gameStore.ts
│   │   ├── lib/                    # Frontend utilities
│   │   │   └── api-config.ts       # API communication helpers
│   │   └── middleware.ts           # Route protection
│   ├── public/                      # Static assets
│   │   ├── aldeias/                # Village images
│   │   ├── deuses/                 # God images
│   │   ├── edificios/              # Building images
│   │   ├── unidades/               # Unit images
│   │   └── ...
│   ├── .env                         # Environment variables
│   ├── .env.example                 # Environment template
│   ├── next.config.ts               # Next.js config + proxy
│   ├── package.json                 # Frontend dependencies
│   └── tsconfig.json               # TypeScript config
│
├── packages/                        # 📦 Shared Code (Monorepo)
│   └── shared/
│       ├── src/
│       │   ├── types/              # TypeScript interfaces
│       │   │   └── index.ts        # AuthSession, EstadoJogo, etc.
│       │   ├── constants/          # Game constants
│       │   │   └── index.ts        # TAMANHO_MAXIMO_FILA, etc.
│       │   ├── validation/         # Zod validation schemas
│       │   │   └── index.ts        # LoginSchema, etc.
│       │   └── index.ts            # Main entry point
│       ├── package.json            # @grepolis/shared
│       └── tsconfig.json
│
├── .claude/                         # Claude Code settings
├── .qwen/                          # Qwen Code settings
├── .gitignore                       # Git ignore rules
├── package.json                     # Root orchestrator + workspaces
├── README.md                        # Project documentation
├── MIGRATION_GUIDE.md              # Migration guide
├── install.bat                      # Windows install script
└── install.sh                       # Unix install script
```

## 🔄 Data Flow

```
┌──────────────┐
│   Browser    │
└──────┬───────┘
       │ HTTP Requests
       ▼
┌──────────────────────┐         ┌──────────────────────┐
│    Frontend          │         │      Backend         │
│    (Port 3000)       │────────▶│   (Port 3001)        │
│                      │  JSON   │                      │
│  - React UI          │◀────────│  - API Routes        │
│  - Zustand Store     │         │  - Database          │
│  - Components        │         │  - Auth Logic        │
│  - Hooks             │         │  - Game Logic        │
└──────────────────────┘         └──────────────────────┘
                                         │
                                         ▼
                                 ┌───────────────┐
                                 │   Database    │
                                 │  (Prisma)     │
                                 └───────────────┘

Both use: @grepolis/shared (types, constants, validation)
```

## 🎯 Package Purposes

### **Backend/**
- **Purpose**: API server, database access, authentication, game logic
- **Key Dependencies**: Prisma, bcrypt, jose, Zod
- **Port**: 3001
- **Endpoints**: `/api/auth/*`, `/api/game/*`, `/api/cron/*`

### **Frontend/**
- **Purpose**: User interface, game client, state management
- **Key Dependencies**: React, Zustand, Zod
- **Port**: 3000
- **Features**: Real-time updates, game state, UI components

### **packages/shared/**
- **Purpose**: Shared code between Backend and Frontend
- **Key Dependencies**: Zod
- **Exports**:
  - `@grepolis/shared/types` - TypeScript interfaces
  - `@grepolis/shared/constants` - Game constants
  - `@grepolis/shared/validation` - Zod schemas

## 📋 Workspace Configuration

The project uses **npm workspaces** for monorepo management:

```json
{
  "workspaces": [
    "Backend",
    "Frontend",
    "packages/*"
  ]
}
```

### Benefits of Workspaces:
✅ Single `npm install` for all packages
✅ Automatic symlink between packages
✅ Consistent dependency versions
✅ Easy to manage shared code

## 🔧 Communication Pattern

### Frontend → Backend API Calls

```typescript
// Frontend/src/lib/api-config.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Using Next.js proxy rewrites (next.config.ts)
// Frontend calls: /api/game/sync
// Proxied to: http://localhost:3001/api/game/sync
```

### Shared Types Usage

```typescript
// Both Backend and Frontend can use:
import { EstadoJogo, AuthSession } from '@grepolis/shared/types';
import { TAMANHO_MAXIMO_FILA_OBRAS } from '@grepolis/shared/constants';
import { LoginSchema } from '@grepolis/shared/validation';
```

## 🚀 Development Workflow

1. **Install dependencies** (once):
   ```bash
   npm run install:all
   ```

2. **Start development** (both servers):
   ```bash
   npm run dev
   ```
   - Backend: http://localhost:3001
   - Frontend: http://localhost:3000

3. **Make changes**:
   - **API changes** → Edit `Backend/src/app/api/`
   - **UI changes** → Edit `Frontend/src/`
   - **Shared types** → Edit `packages/shared/src/`

4. **Database changes**:
   ```bash
   cd Backend
   # Edit prisma/schema.prisma
   npm run db:push
   ```

## 📦 Dependency Flow

```
@grepolis/shared (types, constants, validation)
       ▲
       │ Used by
       ├── Backend
       │   ├── prisma (database)
       │   ├── bcrypt (passwords)
       │   └── jose (JWT)
       │
       └── Frontend
           ├── zustand (state)
           └── react (UI)
```

## ✨ Best Practices

### When to use `packages/shared/`:
- ✅ TypeScript interfaces used in both apps
- ✅ Validation schemas (Zod)
- ✅ Game constants and configuration
- ✅ Utility functions used by both

### When to keep code separate:
- ❌ Database queries (Backend only)
- ❌ UI components (Frontend only)
- ❌ React hooks (Frontend only)
- ❌ Authentication logic (Backend only)

### File Location Guidelines:

| Code Type | Location |
|-----------|----------|
| API Routes | `Backend/src/app/api/` |
| Database Schema | `Backend/prisma/` |
| React Pages | `Frontend/src/app/` |
| UI Components | `Frontend/src/components/` |
| Shared Types | `packages/shared/src/types/` |
| Game Constants | `packages/shared/src/constants/` |
| Validation | `packages/shared/src/validation/` |

## 🔐 Security Notes

- **Backend** handles all database operations
- **Frontend** never has direct DB access
- **Authentication** validated on Backend
- **CORS** configured to allow only Frontend origin
- **Environment variables** kept separate per app
- **JWT secrets** only in Backend

## 📈 Scaling Benefits

This architecture allows:
- ✅ Independent deployment of Backend/Frontend
- ✅ Different scaling strategies per component
- ✅ Team collaboration on separate parts
- ✅ Easy to add more services (e.g., websocket server)
- ✅ Can replace Frontend framework without touching Backend
- ✅ Can add mobile app using same Backend

## 🎮 Game-Specific Structure

For Grepolis game, the separation is ideal because:
- **Game logic** (combat, production) → Backend
- **UI rendering** (buildings, units) → Frontend
- **Game rules** (costs, times) → Shared
- **Types** (Unit, Building, Village) → Shared

This keeps the codebase maintainable and the game logic consistent!
