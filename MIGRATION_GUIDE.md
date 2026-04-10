# Migration Guide: Separated Backend and Frontend

## What Changed

Your Grepolis Next.js application has been successfully separated into two distinct projects:

### Before (Monolithic)
```
grepolis-nextjs/
├── src/
│   ├── app/
│   │   ├── api/        # Backend API routes
│   │   ├── game/       # Game pages
│   │   ├── login/      # Login page
│   │   └── registro/   # Registration page
│   ├── components/     # React components
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities (auth, db, etc.)
│   └── store/          # Zustand state
└── prisma/             # Database schema
```

### After (Separated)
```
grepolis-nextjs/
├── Backend/                          # API Server (Port 3001)
│   ├── src/
│   │   ├── app/
│   │   │   └── api/                 # All API routes
│   │   └── lib/                     # Backend utilities
│   ├── prisma/                      # Database
│   └── package.json
│
├── Frontend/                        # UI Application (Port 3000)
│   ├── src/
│   │   ├── app/
│   │   │   ├── game/               # Game pages
│   │   │   ├── login/              # Login page
│   │   │   └── registro/           # Registration page
│   │   ├── components/             # React components
│   │   ├── hooks/                  # Custom hooks
│   │   ├── store/                  # Zustand state
│   │   └── lib/                    # Frontend utilities
│   ├── public/                      # Static assets
│   └── package.json
│
└── package.json                     # Root monorepo manager
```

## Architecture

```
┌─────────────┐         ┌──────────────┐
│  Frontend   │  HTTP   │   Backend    │
│ :3000       │ ──────> │  :3001       │
│             │  <──────│              │
│  (Browser)  │  JSON   │  (API + DB)  │
└─────────────┘         └──────────────┘
```

## Communication Flow

1. **Frontend** makes requests to `/api/*`
2. **Next.js Rewrites** proxies these to `http://localhost:3001/api/*`
3. **Backend** processes the request and returns data
4. **Frontend** receives and displays the data

## How to Run

### Option 1: Run Both Together (Recommended)
```bash
npm run dev
```

### Option 2: Run Separately
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
```

### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Key Benefits

✅ **Separation of Concerns**: Backend handles API/DB, Frontend handles UI
✅ **Independent Scaling**: Can deploy and scale separately
✅ **Better Security**: Database only accessible through Backend
✅ **Cleaner Codebase**: Easier to maintain and understand
✅ **Future-Proof**: Can replace Frontend or Backend independently

## Migration Checklist

- [x] API routes moved to Backend
- [x] Database and Prisma in Backend
- [x] Authentication logic in Backend
- [x] UI components moved to Frontend
- [x] Pages and routes moved to Frontend
- [x] State management in Frontend
- [x] CORS configured in Backend
- [x] Proxy rewrites configured in Frontend
- [x] Package.json scripts updated
- [x] Environment variable templates created

## Testing the Setup

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Set up environment**:
   ```bash
   cd Backend && copy .env.example .env
   cd Frontend && copy .env.example .env
   ```

3. **Initialize database**:
   ```bash
   cd Backend && npm run db:push
   ```

4. **Start applications**:
   ```bash
   npm run dev
   ```

5. **Verify**:
   - Backend running at http://localhost:3001
   - Frontend running at http://localhost:3000
   - API calls from Frontend reach Backend successfully

## Troubleshooting

### Frontend can't reach Backend
- Check Backend is running on port 3001
- Verify `NEXT_PUBLIC_API_URL` in Frontend/.env
- Check firewall settings

### Database errors
- Ensure `DATABASE_URL` is correct in Backend/.env
- Run `npm run db:generate` after schema changes
- Run `npm run db:push` to sync database

### Authentication issues
- Verify `JWT_SECRET` is set in Backend/.env
- Check cookies are being sent with requests
- Ensure both apps use same domain (localhost)

## Next Steps

1. Install dependencies: `npm run install:all`
2. Configure environment variables
3. Initialize the database
4. Test the application
5. Deploy Backend and Frontend separately (optional)
