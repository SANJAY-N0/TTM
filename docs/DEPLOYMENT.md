# TimeToMeal Production Deployment Guide

## Overview
This document outlines production deployment strategies for **Vercel** (Frontend), **Render / Railway** (Backend), and **Supabase** (Database).

## Environment Configuration
Ensure the following variables are present in production:

```env
PORT=3000
NODE_ENV=production
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-key>
CASHFREE_APP_ID=<your-cashfree-app-id>
CASHFREE_SECRET_KEY=<your-cashfree-secret>
CASHFREE_ENV=PRODUCTION
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

## Docker Deployment Steps
```bash
# Build and run production containers
docker-compose -f docker/docker-compose.yml up --build -d
```
