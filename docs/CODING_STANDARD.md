# TimeToMeal Enterprise Coding Standards

## 1. Clean Architecture & Layering
- **Frontend Layering**: Components (`src/components/`), Views/Pages (`src/pages/`), Domain Services (`src/services/`), API Abstraction (`src/api/`).
- **Strict No Ad-hoc Fetch**: All HTTP network calls MUST go through domain API modules (`AuthAPI`, `OrderAPI`, `PaymentAPI`).
- **Backend Layering**: Controllers -> Services -> Repositories -> Supabase Database.

## 2. Naming Conventions
- React Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utility Functions: `camelCase.ts`
- Constant Enums: `UPPER_SNAKE_CASE`
