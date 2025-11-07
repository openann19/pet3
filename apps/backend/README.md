# PetSpark Backend API

Production-ready backend API server for PetSpark application.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- pnpm >= 8

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database (development)
# OR
pnpm db:migrate   # Run migrations (production)
```

### Development

```bash
# Start development server with hot reload
pnpm dev

# Server will run on http://localhost:3000
```

### Production

```bash
# Build
pnpm build

# Start
pnpm start
```

## 📁 Project Structure

```
apps/backend/
├── src/
│   ├── server.ts           # Main server entry point
│   ├── routes/             # API route handlers
│   │   ├── health.ts       # Health check routes
│   │   ├── api.ts          # Main API router
│   │   ├── auth.ts         # Authentication routes
│   │   └── users.ts        # User management routes
│   ├── controllers/        # Route controllers
│   │   └── health.ts       # Health check controllers
│   ├── services/           # Business logic
│   ├── middleware/        # Express middleware
│   │   ├── error-handler.ts
│   │   ├── request-logger.ts
│   │   └── auth.ts         # JWT authentication
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript types
├── prisma/
│   └── schema.prisma       # Database schema
└── package.json
```

## 🔌 API Endpoints

### Health Checks

- `GET /healthz` - Liveness probe
- `GET /readyz` - Readiness probe (checks database)
- `GET /api/version` - Version information

### API Routes

All API routes are prefixed with `/api/v1`:

- `/api/v1/auth/*` - Authentication endpoints
- `/api/v1/users/*` - User management
- `/api/v1/pets/*` - Pet management
- `/api/v1/matching/*` - Matching algorithm
- `/api/v1/chat/*` - Chat & messaging
- `/api/v1/adoption/*` - Adoption marketplace
- `/api/v1/community/*` - Community features
- And more...

## 🗄️ Database

This project uses **Prisma** as the ORM with **PostgreSQL** as the database.

### Database Commands

```bash
# Generate Prisma client
pnpm db:generate

# Push schema changes (development)
pnpm db:push

# Create and run migrations (production)
pnpm db:migrate

# Open Prisma Studio (database GUI)
pnpm db:studio
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

- **Access Token**: Short-lived (15 minutes), stored in memory (web) or secure storage (mobile)
- **Refresh Token**: Long-lived (30 days), stored in httpOnly cookie (web) or secure storage (mobile)

### Token Flow

1. User logs in → Receives `accessToken` and `refreshToken`
2. Access token expires → Client calls `/auth/refresh` with refresh token
3. Server validates refresh token → Returns new access token
4. Refresh token rotation on each refresh

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## 📝 Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing (min 32 chars)
- `PORT` - Server port (default: 3000)
- `CORS_ORIGIN` - Allowed CORS origins (comma-separated)

## 🚧 Implementation Status

✅ **Production-Ready Backend - 120+ Endpoints Implemented**

- ✅ Core infrastructure (Express, TypeScript, Prisma)
- ✅ Health check endpoints
- ✅ Error handling middleware
- ✅ Request logging
- ✅ Authentication endpoints (JWT with refresh tokens)
- ✅ User management endpoints
- ✅ Pet management endpoints
- ✅ Matching algorithm
- ✅ Chat & messaging
- ✅ File uploads (AWS S3)
- ✅ Payments (Stripe)
- ✅ Admin dashboard
- ✅ All other features

See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for complete details.

## 📚 Documentation

- [Backend Analysis](../../BACKEND_ANALYSIS.md) - Comprehensive backend requirements
- [API Endpoints](./API_ENDPOINTS.md) - Complete API reference (120+ endpoints)
- [Setup Guide](./SETUP.md) - Installation and configuration
- [Implementation Status](./IMPLEMENTATION_STATUS.md) - Feature completion tracking
- [Production Checklist](./PRODUCTION_CHECKLIST.md) - Production deployment guide

## 🔗 Related

- Frontend Web App: `apps/web`
- Mobile App: `apps/mobile`
- Shared Packages: `packages/*`

