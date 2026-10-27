# TimeToMeal (TTM) — Authentication and Role-Based Access Update (Prompt for Tag 26-10.9.00)

Update the existing TimeToMeal application using the uploaded Student Profile Setup screenshot as the reference for the student registration UI.

## 1. Three Separate Login Portals

Create the following routes:

- `/login` — Student login only.
- `/login/student` — Student authentication and registration.
- `/login/canteen` — Canteen owner login.
- `/login/admin` — Admin login.

The main `/login` page must display only the Student Login option. Do not display Canteen Login or Admin Login on the main student login page.

### Student Login
- Use Google OAuth.
- Allow only approved college email domains.
- After successful authentication, redirect new students to profile setup.
- Redirect registered students to the student dashboard.

### Canteen Login
- Use username and password.
- Do not provide public canteen registration.
- Admins create canteen accounts.
- Display a Forgot Password link with instructions to contact the TimeToMeal Support Team.

### Admin Login
- Use secure administrator authentication.
- Do not provide public admin registration.
- Provision the initial administrator securely.
- Allow only authorized administrators to manage platform accounts.

## 2. Student Profile Setup

Use the uploaded screenshot as the visual reference. Preserve its clean, rounded-card design, white background, green primary button, compact form fields, and responsive layout.

### Required Fields

1. Full Name
2. College Email — read-only after verified Google authentication
3. Roll Number / Register Number
4. Gender
5. Mobile Number
6. College
7. Department
8. Year of Study
9. Section — optional
10. Terms and Conditions acceptance — required

Keep the existing Stay Classification selector shown in the screenshot, with Hosteller and Day options, if it is part of the application's requirements.

### Registration Behavior

- Automatically identify the student's college from a verified, approved email domain where possible.
- Display the detected college name.
- Allow department and year selection from database records associated with that college.
- Validate all required fields.
- Validate the mobile number.
- Prevent duplicate roll numbers within the same college.
- Require acceptance of the Terms and Conditions.
- Store the acceptance timestamp and terms version.
- Save the profile to the database.
- Redirect to the Student Dashboard after successful registration.

Do not trust frontend-only validation. Repeat all important validations on the backend.

## 3. Role-Based Access Control

Implement three roles:

- `STUDENT`
- `CANTEEN_OWNER`
- `ADMIN`

Enforce authorization on the backend and database, not just by hiding frontend components.

### Student Permissions
- View available canteens and menus.
- Place orders.
- View personal order history.
- Track order status and tokens.
- View payment status.
- Manage permitted profile fields.

### Canteen Owner Permissions
- Access only the assigned canteen.
- Manage menu items, prices, food images, and availability.
- View and process orders for the assigned canteen.
- Manage authorized inventory and canteen settings.
- View permitted payment and sales information.
- Update canteen logo, banner, contact information, and operating hours.

Canteen owners must not access another canteen's private records or administrative functions.

### Admin Permissions
- Manage students.
- Create and manage colleges.
- Manage departments and academic years.
- Create canteens and canteen accounts.
- Update canteen information.
- Enable or disable accounts.
- Review orders, payments, and analytics according to permissions.
- Access authorized audit logs.
- Manage roles and permissions through secure administrative operations.

Prevent users from changing their own roles or granting themselves additional permissions.

## 4. Canteen Account Creation

Provide a form in the Admin Dashboard for creating a canteen and its login account.

### Account Details
- Username
- Initial password or secure account activation method
- Assigned college
- Canteen name
- Account status

### Canteen Profile Details
- Canteen logo image
- Banner image
- Canteen description
- Contact person
- Contact number
- Contact email
- Location
- Operating hours

Use the existing Cloudinary integration for image uploads if it is already configured.

Store image URLs and metadata in the database.

### Security
- Never store plaintext passwords.
- Never expose passwords or password hashes to the frontend.
- Use the existing authentication provider where possible.
- Require a password change when using an initial password.
- Provide secure account recovery through the support team.
- Record important administrative actions in audit logs.

## 5. Admin Dashboard Updates

Preserve the existing dashboard design and functionality.

Add or update these sections:

- Dashboard
- Students
- Colleges
- Departments
- Academic Years
- Canteens
- Canteen Accounts
- Orders
- Payments
- Analytics
- Settings
- Audit Logs

The admin must be able to create, update, activate, and deactivate colleges, departments, academic years, students, and canteens according to the assigned permissions.

## 6. Database Integration

Inspect the existing database before creating new tables.

Reuse compatible tables and add migrations only where required.

Implement or adapt the following logical entities:

- `profiles`
- `students`
- `colleges`
- `departments`
- `academic_years`
- `canteens`
- `canteen_accounts`
- `terms_acceptances`
- `audit_logs`

Use the existing authentication identity as the source of truth for authenticated users.

### Important Constraints
- Each student must have one profile associated with their authenticated identity.
- Each department must belong to a valid college.
- Each academic year must belong to the appropriate college.
- Student department and academic-year selections must match their college.
- Roll numbers must be unique within the appropriate college scope.
- Each canteen must belong to the correct college.
- Canteen accounts must be associated with authorized canteens.
- Role assignments must be controlled by trusted backend operations.
- Preserve existing orders, payments, menu items, and relationships.

If Supabase is used, configure appropriate Row Level Security policies. Never expose the Supabase service-role key in frontend code.

## 7. API and Validation

Reuse the current API architecture and naming conventions.

Implement or adapt APIs for:

- Retrieving the current authenticated user.
- Creating and updating student profiles.
- Listing colleges, departments, and academic years.
- Creating and managing canteens.
- Provisioning canteen accounts.
- Managing student and canteen account status.
- Retrieving authorized audit logs.

Validate requests using the existing validation framework, such as Zod.

Enforce authorization for every protected endpoint and resource.

## 8. Implementation Phases

### Phase 1 — Inspect
Inspect the repository, routes, authentication system, database schema, RLS policies, and existing UI. Document the required changes without modifying unrelated functionality.

### Phase 2 — Authentication
Implement the three login portals, secure sessions, role-based authorization, protected routes, and logout.

### Phase 3 — Student Registration
Implement the profile setup UI based on the screenshot, form validation, college selection, department/year selection, Terms and Conditions acceptance, and database persistence.

### Phase 4 — Canteen Management
Implement admin-managed canteen accounts, secure credential provisioning, canteen profile management, and image uploads.

### Phase 5 — Admin Dashboard
Implement college, department, academic-year, student, canteen, and account management.

### Phase 6 — Security and Testing
Test authentication, role restrictions, tenant isolation, database policies, registration validation, image uploads, and existing ordering/payment functionality.

## 9. Acceptance Criteria

The update is complete only when:

- The main login page shows only Student Login.
- All three login portals work independently.
- Students can register and save their profiles.
- The student setup UI matches the uploaded screenshot's design.
- Canteen accounts can only be provisioned by authorized admins.
- Admins can manage colleges, departments, academic years, and canteens.
- Each role has the correct permissions.
- Canteen owners cannot access other canteens' private data.
- Passwords are handled securely.
- Database constraints and authorization policies are enforced.
- Existing ordering, menu, payment, and token functionality continues working.
- Relevant tests pass and deployment instructions are documented.
