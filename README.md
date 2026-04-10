# Grepolis Game - Separated Architecture

This project has been separated into two distinct applications: **Backend** and **Frontend**.

## 📁 Project Structure

```
grepolis-nextjs/
├── Backend/              # Next.js API server (backend)
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/     # All API routes
│   │   │   └── ...      # Basic Next.js files
│   │   └── lib/         # Backend utilities (auth, db, etc.)
│   ├── prisma/          # Database schema and migrations
│   └── package.json
├── Frontend/            # Next.js UI application (frontend)
│   ├── src/
│   │   ├── app/        # Pages and routes
│   │   ├── components/ # React components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── store/      # Zustand state management
│   │   └── lib/        # Frontend utilities
│   └── package.json
└── package.json         # Root monorepo package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm or yarn

### Installation

1. **Install dependencies for both:**
   ```bash
   npm run install:all
   ```

2. **Set up environment variables:**
   ```bash
   # Backend
   cd Backend
   cp .env.example .env
   # Edit .env with your database URL and JWT secret
   
   # Frontend
   cd Frontend
   cp .env.example .env
   # Edit .env with your backend API URL
   ```

3. **Set up the database (Backend only):**
   ```bash
   npm run db:generate
   npm run db:push
   ```

### Running the Applications

**Run both Backend and Frontend together:**
```bash
npm run dev
```

**Run Backend only:**
```bash
npm run dev:backend
```
Backend runs on `http://localhost:3001`

**Run Frontend only:**
```bash
npm run dev:frontend
```
Frontend runs on `http://localhost:3000`

## 🔧 Available Scripts

### Root Level
- `npm run dev` - Run both backend and frontend concurrently
- `npm run build` - Build both applications
- `npm run start` - Start both production servers
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push database schema
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Backend (`Backend/`)
- `npm run dev` - Start development server on port 3001
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:*` - Database management commands

### Frontend (`Frontend/`)
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run start` - Start production server

## 🔄 How They Communicate

- **Frontend** calls **Backend** APIs using the `api-config.ts` helper
- Backend runs on port `3001`
- Frontend runs on port `3000`
- All API calls from frontend go to `http://localhost:3001/api/*`
- Session cookies are automatically included in requests

## 📝 API Endpoints

All API endpoints are in the `Backend/src/app/api/` directory:
- `/api/auth/login` - User login
- `/api/auth/register` - User registration
- `/api/auth/logout` - User logout
- `/api/game/*` - Game-related operations

## 🔑 Key Changes After Separation

1. **Frontend** no longer has direct database access
2. All data operations go through Backend API
3. Backend handles authentication and session management
4. Frontend uses `api-config.ts` for all backend communication
5. Each project has its own dependencies

## ⚠️ Important Notes

- Always run Backend before Frontend
- Backend must be accessible at the URL specified in `Frontend/.env`
- Session cookies are shared between frontend and backend
- Database operations only happen in the Backend

## 🐛 Troubleshooting

**Frontend can't connect to Backend:**
- Ensure Backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` in Frontend's `.env`
- Check CORS settings if applicable

**Database errors:**
- Run `npm run db:generate` after schema changes
- Run `npm run db:push` to sync schema
- Ensure `DATABASE_URL` is correct in Backend's `.env`

**Authentication issues:**
- Verify `JWT_SECRET` is set in Backend's `.env`
- Check that cookies are being sent with requests
- Ensure credentials: 'include' is set in fetch calls
