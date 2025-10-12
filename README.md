# Telegram Secrets 🔐

A sophisticated, exclusive e-commerce boutique for high-quality digital adult content. Built with modern web technologies featuring geolocation-based content filtering and multi-language support.

## 📖 Documentation

- 🛠️ **[Development Guide](./README.development.md)** - Setup local para desenvolvimento
- 🚀 **[Production Guide](./README.production.md)** - Deploy em produção
- 📚 **[Deployment Guide](./DEPLOYMENT.md)** - Guia técnico completo de deploy

## Project Structure

```
telegram_secrets/
├── backend/          # Node.js + Express API
└── frontend/         # Next.js 14 Application
```

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Geolocation**: geoip-lite

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Internationalization**: next-intl (English, Portuguese, Spanish)
- **HTTP Client**: Axios

## Features

### Core Features
- ✅ Geolocation-based product filtering
- ✅ Multi-language support (EN, PT, ES)
- ✅ JWT Authentication
- ✅ Admin panel for product and order management
- ✅ Payment gateway integration (PushinPay placeholder)
- ✅ Elegant noir-themed UI design

### Backend API Routes

#### Public Routes
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/products` - Get products (filtered by geolocation)
- `GET /api/products/:id` - Get single product

#### Protected Routes (Require JWT)
- `POST /api/payments/initiate-payment` - Initiate payment
- `GET /api/payments/order/:orderId` - Get order status

#### Admin Routes (Require Admin Role)
- `GET /api/admin/products` - Get all products
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `POST /api/admin/products/regions` - Add product region
- `GET /api/admin/orders` - Get all orders

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Git

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/telegram_secrets?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

5. Run Prisma migrations:
```bash
npm run prisma:migrate
npm run prisma:generate
```

6. Start the development server:
```bash
npm run dev
```

Backend will be running at `http://localhost:3001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

4. Configure environment variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

5. Start the development server:
```bash
npm run dev
```

Frontend will be running at `http://localhost:3000`

## Database Schema

### User
- User authentication and role management
- Roles: ADMIN, CUSTOMER

### Product
- Digital products with name, description, image
- Active/inactive status

### Price
- Multiple pricing tiers per product
- Support for different currencies and categories (HD, 4K, etc.)

### Order
- Track customer purchases
- Status: PENDING, COMPLETED, FAILED
- Includes download link when completed

### ProductRegion
- Geolocation-based product visibility
- ISO 2-letter country codes

## Development

### Creating an Admin User

After setting up the backend, you can register an admin user by making a POST request to `/api/auth/register` with `role: "ADMIN"`:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "securepassword123",
    "role": "ADMIN"
  }'
```

### Adding Products

Use the admin panel at `/admin/products` or make API calls to create products:

```bash
curl -X POST http://localhost:3001/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Premium Collection",
    "description": "Exclusive high-quality content",
    "imageUrl": "https://example.com/image.jpg",
    "isActive": true,
    "prices": [
      {
        "amount": 29.99,
        "currency": "USD",
        "category": "HD"
      },
      {
        "amount": 49.99,
        "currency": "USD",
        "category": "4K"
      }
    ]
  }'
```

## Payment Integration

The project includes placeholder code for PushinPay integration. To implement:

1. Sign up for PushinPay account
2. Add API credentials to `.env`:
```env
PUSHINPAY_API_KEY="your-api-key"
PUSHINPAY_MERCHANT_ID="your-merchant-id"
PUSHINPAY_WEBHOOK_SECRET="your-webhook-secret"
```

3. Update `backend/src/services/pushinpay.ts` with actual SDK implementation
4. Configure webhook URL in PushinPay dashboard: `https://yourdomain.com/api/payments/webhook`

## Deployment

### Backend Deployment

1. Set up PostgreSQL database (Railway, Supabase, AWS RDS, etc.)
2. Set environment variables on hosting platform
3. Run migrations: `npm run prisma:migrate`
4. Build: `npm run build`
5. Start: `npm start`

### Frontend Deployment

1. Update `NEXT_PUBLIC_API_URL` to production API URL
2. Build: `npm run build`
3. Deploy to Vercel, Netlify, or similar platform

## Security Considerations

- Never commit `.env` files
- Use strong JWT secrets in production
- Enable HTTPS in production
- Implement rate limiting
- Add input validation and sanitization
- Configure CORS properly
- Use environment-specific configurations

## License

Private - All rights reserved

## Support

For issues or questions, contact the development team.
