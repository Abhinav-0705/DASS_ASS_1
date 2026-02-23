# System Architecture Diagrams

## 🏗️ Overall System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                        │
│                     (http://localhost:3000)                  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      REACT FRONTEND                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Components: Navbar, PrivateRoute                      │ │
│  │  Pages: Login, Register, Dashboards (x3)              │ │
│  │  Context: AuthContext (Global State)                   │ │
│  │  Services: API, AuthService, AdminService             │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ REST API (Axios)
                             │ JWT Token in Headers
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    EXPRESS.JS BACKEND                        │
│                  (http://localhost:5000)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Middleware: CORS, JSON Parser, Auth, Authorize       │ │
│  │  Routes: /api/auth/*, /api/admin/*                    │ │
│  │  Controllers: authController, adminController         │ │
│  │  Models: User (Mongoose Schema)                       │ │
│  │  Utils: JWT generation/verification                    │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ MongoDB Driver
                             │ (Mongoose ODM)
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      MONGODB DATABASE                        │
│                (mongodb://localhost:27017/felicity)          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Collections:                                          │ │
│  │  - users (participants, organizers, admin)            │ │
│  │  - (future: events, registrations, payments)          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
┌──────────┐                                            ┌──────────┐
│  Client  │                                            │  Backend │
└────┬─────┘                                            └────┬─────┘
     │                                                       │
     │ 1. POST /api/auth/login                              │
     │    {email, password}                                  │
     ├──────────────────────────────────────────────────────>│
     │                                                       │
     │                                      2. Find user     │
     │                                         in database   │
     │                                      3. Compare hash  │
     │                                         with bcrypt   │
     │                                      4. Generate JWT  │
     │                                                       │
     │ 5. {success, token, user}                            │
     │<──────────────────────────────────────────────────────┤
     │                                                       │
     │ 6. Store token in localStorage                       │
     │    Store user in localStorage                        │
     │                                                       │
     │ 7. Redirect to role dashboard                        │
     │    - /participant/dashboard                          │
     │    - /organizer/dashboard                            │
     │    - /admin/dashboard                                │
     │                                                       │
     │ 8. GET /api/auth/me                                  │
     │    Headers: Authorization: Bearer <token>            │
     ├──────────────────────────────────────────────────────>│
     │                                                       │
     │                                      9. Verify JWT    │
     │                                      10. Find user    │
     │                                                       │
     │ 11. {success, user}                                  │
     │<──────────────────────────────────────────────────────┤
     │                                                       │
```

---

## 🎭 Role-Based Access Control

```
                    ┌──────────────┐
                    │   Request    │
                    └──────┬───────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  protect middleware  │
                │  (Verify JWT Token)  │
                └──────┬───────────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
         ✓ Valid              ✗ Invalid
            │                     │
            ▼                     ▼
    ┌──────────────┐      ┌──────────────┐
    │  Get User    │      │  401 Error   │
    │  from Token  │      │ Unauthorized │
    └──────┬───────┘      └──────────────┘
           │
           ▼
    ┌─────────────────────┐
    │ authorize(['role']) │
    │ (Check User Role)   │
    └──────┬──────────────┘
           │
    ┌──────┴───────┐
    │              │
 ✓ Match      ✗ Mismatch
    │              │
    ▼              ▼
┌────────┐   ┌────────────┐
│ Allow  │   │ 403 Error  │
│ Access │   │ Forbidden  │
└────────┘   └────────────┘
```

---

## 👥 User Role Hierarchy

```
                    ┌─────────────┐
                    │    ADMIN    │
                    │  (1 account)│
                    └──────┬──────┘
                           │
                           │ Creates & Manages
                           │
                           ▼
                    ┌─────────────┐
                    │  ORGANIZER  │
                    │ (Clubs/Teams)│
                    └──────┬──────┘
                           │
                           │ Creates & Manages
                           │
                           ▼
                    ┌─────────────┐
                    │    EVENT    │
                    │  (Future)   │
                    └──────┬──────┘
                           │
                           │ Register for
                           │
                           ▼
                    ┌─────────────┐
                    │ PARTICIPANT │
                    │ (IIIT/Others)│
                    └─────────────┘

Permissions:
┌────────────┬──────────┬───────────┬─────────────┐
│   Action   │  Admin   │ Organizer │ Participant │
├────────────┼──────────┼───────────┼─────────────┤
│ Register   │    ✗     │     ✗     │      ✓      │
│ Login      │    ✓     │     ✓     │      ✓      │
│ View Self  │    ✓     │     ✓     │      ✓      │
│ Create Org │    ✓     │     ✗     │      ✗      │
│ Reset Pass │    ✓     │     ✗     │      ✗      │
│ View All   │    ✓     │     ✗     │      ✗      │
└────────────┴──────────┴───────────┴─────────────┘
```

---

## 📊 Data Flow: User Registration

```
┌────────────┐
│  Register  │
│    Page    │
└─────┬──────┘
      │
      │ 1. Fill form
      │    {name, email, password, participantType}
      │
      ▼
┌───────────────────┐
│  Validation       │
│  - IIIT email?    │
│  - Password len?  │
└─────┬─────────────┘
      │
      │ 2. POST /api/auth/register
      │
      ▼
┌───────────────────────┐
│  Backend Controller   │
│  - Validate input     │
│  - Check email domain │
│  - Hash password      │
└─────┬─────────────────┘
      │
      ▼
┌───────────────┐
│   MongoDB     │
│   Insert User │
└─────┬─────────┘
      │
      ▼
┌───────────────┐
│  Generate JWT │
└─────┬─────────┘
      │
      │ 3. Return {success, token, user}
      │
      ▼
┌───────────────────┐
│  Frontend         │
│  - Store token    │
│  - Store user     │
│  - Redirect       │
└───────────────────┘
```

---

## 🔒 Password Hashing Flow

```
Plain Password                    Hashed Password
"password123"                    "$2a$10$AbC..."
      │                                 ▲
      │                                 │
      ▼                                 │
┌──────────────┐                        │
│  bcrypt.js   │                        │
│  genSalt(10) │                        │
└──────┬───────┘                        │
       │                                │
       ▼                                │
┌──────────────┐                        │
│  Salt: 10    │                        │
│  rounds      │                        │
└──────┬───────┘                        │
       │                                │
       ▼                                │
┌──────────────┐                        │
│  bcrypt.hash │────────────────────────┘
│ (pass, salt) │
└──────────────┘

Stored in DB: 
{
  password: "$2a$10$AbC...",  // Hashed
  select: false               // Hidden by default
}

Login Comparison:
Input Password → bcrypt.compare(input, stored) → Boolean
```

---

## 🎪 Frontend Route Structure

```
App.js (Router)
│
├─ PUBLIC ROUTES
│  ├─ /login → Login.js
│  └─ /register → Register.js
│
├─ PROTECTED ROUTES (PrivateRoute wrapper)
│  │
│  ├─ allowedRoles: ['participant']
│  │  └─ /participant/dashboard → ParticipantDashboard.js
│  │
│  ├─ allowedRoles: ['organizer']
│  │  └─ /organizer/dashboard → OrganizerDashboard.js
│  │
│  └─ allowedRoles: ['admin']
│     └─ /admin/dashboard → AdminDashboard.js
│
└─ DEFAULT
   └─ / → Navigate to /login
```

---

## 🔄 Session Management

```
┌─────────────────────────────────────────────────────┐
│                  Browser Storage                     │
│                                                      │
│  localStorage.setItem('token', 'eyJ...')            │
│  localStorage.setItem('user', JSON.stringify(user)) │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ Persists across
                       │ browser restarts
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────┐            ┌────────────────┐
│   New Visit   │            │    Refresh     │
└───────┬───────┘            └────────┬───────┘
        │                             │
        │                             │
        └──────────────┬──────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  AuthContext         │
            │  useEffect()         │
            │  - Check localStorage│
            │  - Restore session   │
            └──────┬───────────────┘
                   │
                   ▼
            ┌──────────────┐
            │   Redirect   │
            │ to Dashboard │
            └──────────────┘

Logout Flow:
┌────────┐    ┌─────────────────┐    ┌──────────┐
│ Logout │───>│ Clear localStorage│───>│ Redirect │
│ Button │    │ - remove token   │    │ to Login │
└────────┘    │ - remove user    │    └──────────┘
              └──────────────────┘
```

---

## 📱 Component Hierarchy

```
App
├── AuthProvider (Context)
│   └── Router
│       ├── Navbar
│       │   ├── Logo
│       │   └── User Info + Logout
│       │
│       └── Routes
│           ├── Login
│           │   ├── Form
│           │   └── Link to Register
│           │
│           ├── Register
│           │   ├── Form
│           │   │   ├── Participant Type Select
│           │   │   └── Email Validation
│           │   └── Link to Login
│           │
│           ├── PrivateRoute (HOC)
│           │   │
│           │   ├── ParticipantDashboard
│           │   │   ├── Welcome Card
│           │   │   ├── My Registrations
│           │   │   ├── Available Events
│           │   │   └── Profile
│           │   │
│           │   ├── OrganizerDashboard
│           │   │   ├── Welcome Card
│           │   │   ├── My Events
│           │   │   ├── Event Management
│           │   │   └── Organization Info
│           │   │
│           │   └── AdminDashboard
│           │       ├── Welcome Card
│           │       ├── Organizers List
│           │       │   ├── Create Modal
│           │       │   └── Reset Password Modal
│           │       └── Participants List
│           │
│           └── Navigate (Default)
```

---

## 🗄️ Database Schema Diagram

```
┌────────────────────────────────────────────────────┐
│                  users Collection                  │
├────────────────────────────────────────────────────┤
│ _id: ObjectId (auto)                               │
│ name: String ✓                                     │
│ email: String ✓ (unique, lowercase)                │
│ password: String ✓ (hashed, select: false)         │
│ role: String ✓ (enum: participant/organizer/admin)│
│                                                    │
│ ┌─ Participant Fields ──────────────┐            │
│ │ participantType: String            │            │
│ │   enum: ['iiit', 'non-iiit']       │            │
│ │   required if role='participant'   │            │
│ └────────────────────────────────────┘            │
│                                                    │
│ ┌─ Organizer Fields ────────────────┐            │
│ │ organizationType: String           │            │
│ │   enum: ['club','council','fest']  │            │
│ │ organizationName: String           │            │
│ │ createdBy: ObjectId (ref: User)    │            │
│ │   required if role='organizer'     │            │
│ └────────────────────────────────────┘            │
│                                                    │
│ isActive: Boolean (default: true)                 │
│ createdAt: Date (auto)                            │
│ updatedAt: Date (auto)                            │
└────────────────────────────────────────────────────┘

Indexes:
- email: unique
- role: non-unique
- isActive: non-unique

Middleware:
- pre('save'): Hash password with bcrypt
- methods.matchPassword(): Compare password
- methods.isIIITEmail(): Validate email domain
```

---

## 🚦 API Request/Response Flow

```
Client Request:
POST /api/auth/login
Headers: {
  Content-Type: application/json
}
Body: {
  email: "user@example.com",
  password: "password123"
}

         │
         ▼
    ┌────────┐
    │ CORS   │ Allow cross-origin
    └───┬────┘
        │
        ▼
    ┌─────────┐
    │ Parser  │ Parse JSON body
    └───┬─────┘
        │
        ▼
    ┌─────────────┐
    │   Router    │ Match /api/auth/login
    └───┬─────────┘
        │
        ▼
    ┌──────────────┐
    │  Controller  │ authController.login()
    └───┬──────────┘
        │
        ├─ 1. Validate input
        ├─ 2. Find user
        ├─ 3. Compare password
        ├─ 4. Generate JWT
        │
        ▼
Server Response:
Status: 200 OK
Headers: {
  Content-Type: application/json
}
Body: {
  success: true,
  token: "eyJhbGc...",
  user: {
    id: "...",
    name: "...",
    email: "...",
    role: "..."
  }
}
```

---

**These diagrams provide a visual understanding of the system architecture!** 📊
