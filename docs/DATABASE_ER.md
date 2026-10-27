# Database ER Diagram & Schema Specification

## Multi-College Multi-Canteen SaaS Schema

```mermaid
erDiagram
    College ||--o{ Canteen : operates
    College ||--o{ User : enrolls
    Canteen ||--o{ User : employs
    Canteen ||--o{ FoodItem : offers
    Canteen ||--o{ Category : organizes
    Canteen ||--o{ Order : processes
    Canteen ||--o{ WalkInOrder : "counter sales"
    Canteen ||--o{ CanteenSettings : configures
    Canteen ||--o{ DailySales : reports
    Category ||--o{ FoodItem : contains
    FoodItem ||--o{ FoodImage : "has images"
    FoodItem ||--o{ OrderItem : included_in
    User ||--o{ Order : places
    User ||--o{ UserProfile : "has profile"
    User ||--o{ Notification : receives
    Order ||--|{ OrderItem : contains
    Order ||--o{ Payment : generates
    Order ||--o{ Token : "assigned token"
    Order ||--o{ OrderStatusHistory : tracks
    Order ||--o{ SplitPayment : "split into"
    Order ||--o{ CashfreeTransaction : "gateway ref"

    College {
        uuid id PK
        string name
        string code UK
        string address
        string city
        string state
        string status
        timestamptz deleted_at
        timestamptz created_at
    }

    Canteen {
        uuid id PK
        uuid college_id FK
        string name
        string location
        boolean is_online
        string status
        timestamptz deleted_at
    }

    User {
        uuid id PK
        uuid college_id FK
        uuid canteen_id FK
        string email UK
        string password_hash
        string role
        string status
        timestamptz deleted_at
    }

    UserProfile {
        uuid id PK
        uuid user_id FK UK
        string full_name
        string avatar_url
        string avatar_public_id
        string hostel_name
    }

    Category {
        uuid id PK
        uuid canteen_id FK
        string name
        enum meal_period
        boolean is_active
    }

    FoodItem {
        uuid id PK
        uuid canteen_id FK
        uuid category_id FK
        string name
        numeric price
        enum food_type
        boolean is_available
        integer stock_online
        integer stock_offline
        timestamptz deleted_at
    }

    FoodImage {
        uuid id PK
        uuid food_id FK
        string image_url
        string public_id
        string secure_url
        integer width
        integer height
        string format
        string folder
        boolean is_primary
    }

    Order {
        uuid id PK
        string order_code
        uuid student_id FK
        uuid canteen_id FK
        enum order_type
        numeric total_amount
        numeric paid_amount
        string payment_method
        string payment_status
        string order_status
        string cashfree_order_id
        timestamptz deleted_at
    }

    OrderItem {
        uuid id PK
        uuid order_id FK
        uuid food_id FK
        string item_name
        integer quantity
        numeric price_per_unit
        numeric total_price
    }

    Token {
        uuid id PK
        uuid order_id FK
        uuid canteen_id FK
        integer token_number
        date token_date
    }

    Payment {
        uuid id PK
        uuid order_id FK
        numeric amount
        string payment_method
        string payment_status
        string transaction_id
    }

    CashfreeTransaction {
        uuid id PK
        uuid order_id FK
        string cf_order_id UK
        string cf_payment_id
        string payment_session_id
        numeric payment_amount
    }

    WalkInOrder {
        uuid id PK
        uuid canteen_id FK
        string order_code
        numeric total_amount
        string payment_method
    }
```

## Table Summary

| Domain | Tables | Description |
|--------|--------|-------------|
| **Core** | colleges, canteens, users, user_profiles, roles, permissions, role_permissions | Multi-tenant identity & access |
| **Food** | categories, food_items, food_images, inventory, inventory_transactions | Menu & stock management |
| **Orders** | carts, cart_items, orders, order_items, tokens, order_status_history | Order lifecycle |
| **Payments** | payments, payment_methods, split_payments, cashfree_transactions | Payment processing |
| **Counter** | walk_in_orders, walk_in_order_items, receipts | Walk-in billing |
| **Notifications** | notifications, notification_preferences | User alerts |
| **Reports** | daily_sales | Analytics aggregation |
| **Settings** | canteen_settings, system_settings | Configuration |
| **Audit** | audit_logs | Change tracking |

## Database: Supabase PostgreSQL
- **ORM**: None (Supabase JS Client direct queries)
- **Image Storage**: Cloudinary (metadata in `food_images` table)
- **Auth**: JWT + bcrypt (via Express middleware)
- **RLS**: Enabled on all tables with role-based policies
