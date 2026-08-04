# System Architecture Blueprint - Campus Canteen SaaS

## Design Principles
1. **SOLID & Single Responsibility**: Strict separation between Routes, Controllers, Business Services, and Database Repositories.
2. **Scalability for 1000+ Students**: Standardized JSON responses, indexed database lookups, stateless JWT authentication, and modular code layout.
3. **Security Standards**:
   - Helmet HTTP headers
   - CORS policy configuration
   - Zod request body validation
   - Parameterized database queries via Prisma ORM
   - No stack traces or SQL internal errors exposed to clients

---

## Cashfree Payment Integration Flow

```
Student Portal           Backend Controller          Cashfree PG          Webhook Handler
      │                        │                          │                      │
      │ 1. Initiate Order      │                          │                      │
      ├───────────────────────►│                          │                      │
      │                        │ 2. Create Payment Session│                      │
      │                        ├─────────────────────────►│                      │
      │                        │ 3. Return Session Token  │                      │
      │                        │◄─────────────────────────┤                      │
      │ 4. Launch Checkout SDK │                          │                      │
      │◄───────────────────────┴──────────────────────────┤                      │
      │                                                   │                      │
      │ 5. Complete Payment                               │                      │
      ├──────────────────────────────────────────────────►│                      │
      │                                                   │ 6. Send Webhook      │
      │                                                   ├─────────────────────►│
      │                                                   │                      │ 7. Verify Signature
      │                                                   │                      │    & Update Status
```
