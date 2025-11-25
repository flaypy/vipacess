# Vip Acess - Backend

Express.js API server with PostgreSQL database.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure `.env` file (see `.env.example`)

3. Run database migrations:
```bash
npm run prisma:migrate
npm run prisma:generate
```

4. Start development server:
```bash
npm run dev
```

## API Documentation

### Authentication
All protected routes require JWT token in Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Geolocation
The API automatically detects user location from IP address and filters products accordingly.

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## Directory Structure

```
backend/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── middleware/        # Express middleware
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic
│   └── server.ts         # Main application file
└── package.json
```
