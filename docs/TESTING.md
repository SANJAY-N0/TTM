# TimeToMeal Enterprise Testing Strategy

## 1. Testing Pyramid
- **Unit Tests (`tests/unit/`)**: Vitest for pure utility functions, domain services, and DTO validators.
- **Integration Tests (`tests/integration/`)**: Supertest for Express controllers, repository database queries, and middleware authentication.
- **End-to-End Tests (`tests/e2e/`)**: Playwright for student checkout flows, walk-in canteen billing, and admin role permissions.

## 2. Test Execution Commands
```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```
