# Campus Canteen SaaS - Master Production Documentation

## Overview
Campus Canteen SaaS is a cloud-based multi-college canteen management platform built for scaling to 1000+ students across multiple institutions.

### User Portals (V1 MVP)
1. **Student Portal** - Browse today's canteen menu, search meals, add to cart, checkout with Cashfree/UPI, track live order status, and present pickup tokens.
2. **Canteen Portal** - Manage live order pipeline (Pending → Preparing → Ready → Completed), update stock availability, perform Menu CRUD operations, and review daily revenue.
3. **Super Admin Portal** - Manage colleges, canteens, students, view institutional reports, configure payment gateways, manage help & support contacts, and edit terms & conditions.

---

## Tech Stack
- **Frontend**: React, TypeScript, TailwindCSS, Vite
- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, JWT, Zod
- **Database**: PostgreSQL
- **Payments**: Cashfree Payment Gateway, UPI QR
- **Media**: Cloudinary Secure Storage

---

## Folder Architecture

```
Campus-Canteen-SaaS/
├── apps/
│   └── backend/
│       └── src/
│           ├── config/
│           ├── constants/
│           ├── controllers/
│           ├── middlewares/
│           ├── repositories/
│           ├── routes/
│           ├── services/
│           └── validation/
├── components/          # Reusable UI Components & Portal Views
├── docs/                # Comprehensive Documentation
│   ├── API_DOCUMENTATION.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_ER.md
│   └── README.md
├── prisma/
│   └── schema.prisma    # Production PostgreSQL Schema
└── shared/
    └── types/           # Shared TypeScript Interfaces & Types
```

---

## Layered Backend Flow
```
Client Request → Route → Validation (Zod) → Authentication (JWT) → Authorization (RBAC) → Controller → Service → Repository → Database (Prisma)
```

## Quick Start
```bash
# Install dependencies
npm install

# Run database migrations
npx prisma db push

# Start Development Server
npm run dev

# Build for Production
npm run build
```
