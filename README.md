# Project & Task Management System - Backend

Full-stack backend API built with Node.js, Express, TypeScript, PostgreSQL, and Redis.

## Tech Stack

- **Runtime:** Node.js v22+
- **Framework:** Express 4.18
- **Language:** TypeScript 5.3 (strict mode)
- **Database:** PostgreSQL 14+
- **ORM:** Prisma 5.22
- **Cache:** Redis (optional)
- **Queue:** Bull 4.12
- **Authentication:** JWT with bcryptjs
- **Validation:** Zod

## Features

- ✅ JWT-based authentication with secure password hashing
- ✅ Project CRUD operations with caching
- ✅ Task management with status tracking
- ✅ Background export processing (works with/without Redis)
- ✅ Redis caching with graceful fallback
- ✅ Database indexes for optimal performance
- ✅ gzip compression for API responses
- ✅ Comprehensive error handling
- ✅ TypeScript strict mode

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Redis (optional - application works without it)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens (use a strong random string)

Optional variables:
- `REDIS_HOST` - Redis host (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)
- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5173)

### 3. Database Setup

Create PostgreSQL database:

```sql
CREATE DATABASE project_management;
```

Run Prisma migrations:

```bash
npx prisma migrate dev
```

Generate Prisma client:

```bash
npx prisma generate
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start at `http://localhost:5000`

### 5. Optional: Start Redis (for caching and queue)

**Windows:**
```bash
# If not installed, install via Chocolatey as Administrator:
choco install redis-64

# Start Redis
redis-server
```

**Mac/Linux:**
```bash
redis-server
```

**Note:** Application works without Redis - it will fallback to direct database queries and synchronous exports.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Projects (Protected)
- `GET /api/projects` - List user's projects (cached)
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details (cached)
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks (Protected)
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Exports (Protected)
- `POST /api/projects/:id/export` - Trigger export job
- `GET /api/exports/:id` - Get export status
- `GET /api/exports` - List user's exports
- `GET /api/exports/:id/download` - Download export file

## Project Structure

```
backend/
├── prisma/
│   ├── migrations/          # Database migrations
│   └── schema.prisma        # Database schema
├── src/
│   ├── config/              # Configuration files
│   │   ├── index.ts         # Environment config
│   │   ├── database.ts      # Prisma client
│   │   └── redis.ts         # Redis client
│   ├── controllers/         # Route controllers
│   ├── middlewares/         # Express middlewares
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── jobs/                # Background jobs
│   │   ├── exportQueue.ts   # Bull queue setup
│   │   └── exportWorker.ts  # Export processor
│   ├── utils/               # Utilities & types
│   └── index.ts             # App entry point
├── exports/                 # Generated export files
├── .env.example             # Environment template
├── package.json
└── tsconfig.json
```

## Database Schema

### Models
- **User** - User accounts with authentication
- **Project** - Projects owned by users
- **Task** - Tasks within projects
- **Export** - Export job tracking

### Indexes
- `projects(owner_id, created_at)` - Fast project listing
- `tasks(project_id, status)` - Efficient task filtering
- `tasks(assigned_to, created_at, due_date)` - Task queries
- `exports(user_id, created_at, status)` - Export history

## Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run Prisma Studio (database GUI)
npm run prisma:studio

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Testing API

Health check:
```bash
curl http://localhost:5000/health
```

Register user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

## Performance Optimizations

1. **Database Indexes:** 8 strategic indexes for fast queries
2. **Redis Caching:** 30s-5min TTL with cache invalidation
3. **gzip Compression:** Reduces response size by 70-80%
4. **Optimistic Queries:** Explicit field selection
5. **Connection Pooling:** Prisma connection management

## Error Handling

All errors follow consistent format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

Error codes:
- `VALIDATION_ERROR` - Invalid input data
- `AUTHENTICATION_ERROR` - Invalid/missing JWT token
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found

## Security Features

- Password hashing with bcryptjs (10 rounds)
- JWT tokens with configurable expiration
- Protected routes with authentication middleware
- Input validation with Zod schemas
- SQL injection prevention via Prisma
- CORS configuration
- Request size limits (10MB)

## Production Deployment Notes

1. Use strong `JWT_SECRET` (32+ random characters)
2. Set `NODE_ENV=production`
3. Use connection pooling for PostgreSQL
4. Configure Redis persistence
5. Set up proper logging
6. Enable HTTPS
7. Configure rate limiting
8. Set up monitoring (PM2, New Relic, etc.)

## Troubleshooting

### Database Connection Fails
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists

### Redis Connection Fails
- Application works without Redis
- Check REDIS_HOST and REDIS_PORT
- Verify Redis is running (optional)

### Migration Errors
- Reset database: `npx prisma migrate reset`
- Check schema.prisma syntax
- Ensure no manual database changes

## License

MIT

## Contact

For questions or issues, contact the development team.
