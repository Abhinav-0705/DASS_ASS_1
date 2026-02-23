# Felicity Event Management System

A comprehensive MERN stack application for managing events, clubs, and participants for the Felicity fest at IIIT.

## 📋 Table of Contents
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [Security Features](#security-features)
- [User Roles](#user-roles)
- [Development](#development)

## ✨ Features

### Part 1: Core System Implementation (Completed)

#### Authentication & Security ✅
- **Participant Registration**
  - IIIT students must use IIIT-issued email (@iiit.ac.in or @students.iiit.ac.in)
  - Non-IIIT participants can register with any email
  - Email domain validation
  
- **Role-based Authentication**
  - Three user roles: Participant, Organizer, Admin
  - JWT-based authentication for all protected routes
  - Session persistence across browser restarts
  - Secure logout with token clearing

- **Security Measures**
  - Passwords hashed using bcrypt (10 salt rounds)
  - No plaintext password storage
  - JWT token expiration (7 days default)
  - Role-based access control on all routes
  - Protected frontend pages with route guards

- **Admin Privileges**
  - Create/remove organizer accounts
  - Reset organizer passwords
  - View all participants and organizers
  - Backend-provisioned admin account (no UI registration)

## 🛠 Technology Stack

- **MongoDB** - NoSQL Database with Atlas cloud hosting
- **Express.js** - Backend Framework
- **React** - Frontend Library
- **Node.js** - Runtime Environment (v23.10.0)

### Advanced Features Implemented (Part 2 - 30 Marks Total)

#### 🎯 Tier A Features (16 Marks)

**1. Merchandise Payment Approval Workflow (8 Marks)**
- Participants upload payment proof images (base64 encoding) for merchandise events
- Organizers view all payment proof submissions with image preview
- Approve/reject payments with reasons
- Stock decrement only on approval (not on registration)
- QR ticket generation only after payment approval
- Statistics dashboard: pending/approved/rejected counts
- Filter by payment status
- Payment proof upload component with image preview

**2. QR Scanner & Attendance Tracking (8 Marks)**
- Real-time ticket scanning by organizers
- Manual check-in override with reason
- Duplicate scan prevention (unique constraint on registration ID)
- Live attendance statistics: total/attended/not attended/attendance rate
- Full attendance report with participant details
- CSV export functionality for attendance data
- Scan methods tracking (QR camera/QR upload/manual)
- Undo check-in capability
- Complete attendance dashboard with search and filter

#### 🌟 Tier B Features (12 Marks)

**3. Organizer Password Reset Workflow (6 Marks)**
- Organizers submit password reset requests with reason (minimum 10 characters)
- Admin reviews all pending requests
- Admin can approve (auto-generates secure password) or reject (with comments)
- Request history with status tracking (pending/approved/rejected)
- One-time password display after approval
- Auto-generated passwords using crypto.randomBytes (16-character hex)
- Organizer can view their own request history
- Admin comments visible to organizers
- User password updated in database upon approval

**4. Real-Time Discussion Forum (6 Marks)**
- Event-specific discussion threads
- Message posting by participants (must be registered) and organizers
- Emoji reactions: 👍 (Like), ❤️ (Love), 👏 (Applause), 🎉 (Celebrate)
- Reply threading (nested messages)
- Pin important messages (organizer only)
- Delete messages (organizer or message author)
- Announcement posts (organizer only, highlighted)
- Role badges (ORGANIZER, ANNOUNCEMENT)
- Real-time updates via polling (5-second intervals)
- Soft deletion (isDeleted flag)
- Reaction counts with user tracking

#### 🎨 Tier C Feature (2 Marks)

**5. Anonymous Feedback System (2 Marks)**
- Participants submit anonymous feedback after event ends
- Text feedback with star rating (1-5)
- Multiple feedback dimensions: content quality, organization, venue
- Organizers view all feedback for their events
- Aggregate statistics: average rating, total submissions
- Only registered participants can submit feedback
- One feedback per participant per event

#### 📊 Feature Justification & Scoring

**Tier A - 16 Marks:**
- Merchandise Payment Approval (8): Complex workflow with image handling, approval process, stock management, and QR generation
- QR Scanner & Attendance (8): Real-time tracking, CSV export, duplicate prevention, manual override, and comprehensive dashboard

**Tier B - 12 Marks:**
- Password Reset Workflow (6): Admin approval flow, secure password generation, request tracking, and status management
- Discussion Forum (6): Real-time updates, threading, reactions, moderation, and role-based features

**Tier C - 2 Marks:**
- Anonymous Feedback (2): Simple feedback collection with ratings and aggregation

**Total: 30 Marks Exactly** ✅

## 🛠 Technology Stack

- **MongoDB** - NoSQL Database with Atlas cloud hosting
- **Express.js** - Backend Framework (v4.21.2)
- **React** - Frontend Library (v19.0.0)
- **Node.js** - Runtime Environment (v23.10.0)

### Key Dependencies

#### Backend
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `dotenv` - Environment variables
- `cors` - Cross-origin resource sharing
- `express-validator` - Input validation

#### Frontend
- `react` - UI library
- `react-router-dom` - Routing
- `axios` - HTTP client

## 📁 Project Structure

```
Assignment1/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Authentication logic
│   │   └── adminController.js     # Admin operations
│   ├── middleware/
│   │   └── auth.js                # JWT & role-based auth
│   ├── models/
│   │   └── User.js                # User schema
│   ├── routes/
│   │   ├── authRoutes.js          # Auth endpoints
│   │   └── adminRoutes.js         # Admin endpoints
│   ├── scripts/
│   │   └── seedAdmin.js           # Admin account seeder
│   ├── utils/
│   │   └── jwt.js                 # JWT utilities
│   ├── .env.example               # Environment variables template
│   ├── .gitignore
│   ├── package.json
│   └── server.js                  # Entry point
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js          # Navigation bar
│   │   │   └── PrivateRoute.js    # Route protection
│   │   ├── context/
│   │   │   └── AuthContext.js     # Global auth state
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── ParticipantDashboard.js
│   │   │   ├── OrganizerDashboard.js
│   │   │   └── AdminDashboard.js
│   │   ├── services/
│   │   │   ├── api.js             # Axios config
│   │   │   ├── authService.js     # Auth API calls
│   │   │   └── adminService.js    # Admin API calls
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── .gitignore
│   └── package.json
│
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** (`.env`)
   ```env
   PORT=5001
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/felicity
   JWT_SECRET=your_super_secure_jwt_secret_key_change_this_in_production
   JWT_EXPIRE=7d
   NODE_ENV=development
   
   # Admin Credentials
   ADMIN_EMAIL=admin@felicity.iiit.ac.in
   ADMIN_PASSWORD=Admin@123456
   
   # Email Configuration (for sending registration confirmations, password resets)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   FRONTEND_URL=http://localhost:3000
   ```
   
   **📧 To set up Gmail for sending emails:**
   1. Go to https://myaccount.google.com/apppasswords
   2. Create a new app password for "Mail"
   3. Use that 16-character password as `EMAIL_PASSWORD`
   4. Use your Gmail address as `EMAIL_USER`
   
   **Note:** In development mode (NODE_ENV=development), emails are logged to console instead of sent.

5. **Start MongoDB**
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Or start manually
   mongod --config /usr/local/etc/mongod.conf
   ```

6. **Seed admin account**
   ```bash
   npm run seed:admin
   ```
   
   This creates the admin user with credentials from `.env`

7. **Start the backend server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

   Server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

   Frontend will run on `http://localhost:3000`

### First Time Setup

1. **Login as Admin**
   - Email: `admin@felicity.iiit.ac.in`
   - Password: `Admin@123456` (or your custom password from `.env`)

2. **Create Organizers**
   - Go to Admin Dashboard
   - Click "Create Organizer"
   - Fill in details for clubs/councils/fest teams

3. **Test Participant Registration**
   - Logout from admin
   - Register as a new participant
   - Test both IIIT and Non-IIIT registration

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### 1. Register Participant
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@iiit.ac.in",
  "password": "password123",
  "participantType": "iiit"  // or "non-iiit"
}
```

**Response (201)**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@iiit.ac.in",
    "role": "participant",
    "participantType": "iiit"
  }
}
```

#### 2. Login (All Roles)
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200)**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "participant|organizer|admin"
  }
}
```

#### 3. Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "participant"
  }
}
```

#### 4. Logout
```http
POST /auth/logout
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Admin Endpoints

All admin endpoints require `Authorization: Bearer <admin_token>`

#### 1. Create Organizer
```http
POST /admin/organizers
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Tech Club",
  "email": "tech@club.com",
  "password": "password123",
  "organizationType": "club",  // club|council|fest_team
  "organizationName": "Technical Club"
}
```

#### 2. Get All Organizers
```http
GET /admin/organizers
Authorization: Bearer <admin_token>
```

#### 3. Delete/Deactivate Organizer
```http
DELETE /admin/organizers/:id
Authorization: Bearer <admin_token>
```

#### 4. Reset Organizer Password
```http
PUT /admin/organizers/:id/reset-password
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "newPassword": "newpassword123"
}
```

#### 5. Get All Participants
```http
GET /admin/participants
Authorization: Bearer <admin_token>
```

## 🔒 Security Features

### Password Security
- All passwords hashed using bcrypt with 10 salt rounds
- No plaintext passwords stored in database
- Password field excluded from queries by default (`select: false`)
- Minimum 6 characters required

### JWT Authentication
- Token-based authentication
- Tokens include user ID and role
- 7-day expiration (configurable)
- Stored in localStorage on client
- Automatically added to requests via axios interceptor

### Role-Based Access Control
- Three distinct roles: participant, organizer, admin
- Middleware enforces role requirements
- Frontend route guards prevent unauthorized access
- Role switching prohibited (one role per user)

### Email Validation
- IIIT participants must use `@iiit.ac.in` or `@students.iiit.ac.in`
- Email format validation
- Unique email constraint

### Session Management
- Sessions persist across browser restarts (localStorage)
- Explicit logout clears all tokens
- Login redirects to role-appropriate dashboard
- Automatic redirect on token expiration

## 👥 User Roles

### Participant
- Register via public signup page
- Two types: IIIT Student, Non-IIIT
- IIIT students require IIIT email domain
- Access to participant dashboard
- Can view and register for events (future feature)

### Organizer
- Created only by Admin
- Represents clubs, councils, or fest teams
- Cannot self-register
- Access to organizer dashboard
- Can create and manage events (future feature)
- Password reset handled by Admin

### Admin
- Single admin account (backend provisioned)
- Full system access
- Can create/remove organizers
- Can reset organizer passwords
- View all users
- No UI registration (security measure)

## 🧪 Development

### Backend Development
```bash
cd backend
npm run dev  # Runs with nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm start  # Runs with hot reload
```

### Database Management

**Connect to MongoDB**
```bash
mongosh
use felicity
```

**View collections**
```javascript
show collections
db.users.find().pretty()
```

**Clear database** (development only)
```javascript
db.users.deleteMany({})
```

### Testing Authentication Flow

1. **Seed Admin**
   ```bash
   cd backend
   npm run seed:admin
   ```

2. **Test Admin Login**
   - Go to http://localhost:3000/login
   - Login with admin credentials
   - Should redirect to admin dashboard

3. **Create Test Organizer**
   - In admin dashboard, click "Create Organizer"
   - Create a test club

4. **Test Organizer Login**
   - Logout
   - Login with organizer credentials

5. **Test Participant Registration**
   - Logout
   - Go to register page
   - Try both IIIT and non-IIIT registration

### Environment Variables

**Required for Backend:**
- `PORT` - Server port (default: 5001)
- `MONGODB_URI` - MongoDB connection string (MongoDB Atlas)
- `JWT_SECRET` - Secret key for JWT (change in production!)
- `JWT_EXPIRE` - Token expiration time
- `ADMIN_EMAIL` - Admin email
- `ADMIN_PASSWORD` - Admin password

## 🧪 Testing Advanced Features

### Testing Merchandise Payment Approval (Tier A - 8 Marks)

1. **Create Merchandise Event** (as Organizer)
   - Login as organizer
   - Create event with type "merchandise"
   - Add variants (size, color, price, stock)

2. **Register & Upload Payment Proof** (as Participant)
   - Login as participant
   - Register for merchandise event (select variant)
   - Upload payment proof image (JPG/PNG)
   - Verify "Payment Pending" status

3. **Approve/Reject Payments** (as Organizer)
   - Go to event detail page
   - Click "Payment Approvals" button
   - View statistics (pending/approved/rejected)
   - Click on image to enlarge
   - Approve payment → Stock decrements, QR ticket generated
   - OR Reject with reason → Payment status updated

4. **Verify Ticket Generation** (as Participant)
   - Check event detail page
   - Ticket ID should appear after approval
   - Stock should be decremented

### Testing QR Scanner & Attendance (Tier A - 8 Marks)

1. **Access QR Scanner** (as Organizer)
   - Go to event detail page (organizer view)
   - Click "QR Scanner" button
   - View live statistics

2. **Scan Tickets**
   - Enter ticket ID in scanner
   - Click "Scan Ticket"
   - Verify attendance marked
   - Try duplicate scan → Should show error

3. **Manual Check-in**
   - Find participant in attendance list
   - Click "Manual Check-in"
   - Enter reason
   - Verify attendance updated with "manual" method

4. **Export Attendance**
   - Click "Export to CSV"
   - Verify CSV download with all data

5. **Undo Check-in**
   - Click "Undo" button on attended participant
   - Verify status changes back to "Not Attended"

### Testing Password Reset Workflow (Tier B - 6 Marks)

1. **Submit Request** (as Organizer)
   - Login as organizer
   - Go to dashboard
   - Click "Password Reset" button
   - Submit request with reason (min 10 chars)
   - Verify request appears in history

2. **Review Requests** (as Admin)
   - Login as admin
   - Click "Password Reset Requests" button
   - Filter by status (pending/approved/rejected)
   - View organizer details

3. **Approve Request** (as Admin)
   - Click "Approve" on pending request
   - View auto-generated password (one-time display)
   - Verify password is 16 characters

4. **Reject Request** (as Admin)
   - Click "Reject" on pending request
   - Enter admin comments
   - Verify status updated

5. **Login with New Password** (as Organizer)
   - Logout
   - Login with new password
   - Verify successful login

### Testing Discussion Forum (Tier B - 6 Marks)

1. **Access Forum** (as Participant/Organizer)
   - Go to event detail page
   - Scroll to "Discussion Forum" section
   - Must be registered to post

2. **Post Messages**
   - Type message and click "Post"
   - View message with role badge (if organizer)
   - Wait 5 seconds → New messages auto-refresh

3. **Add Reactions**
   - Click emoji buttons (👍❤️👏🎉)
   - View reaction counts
   - Click again to change reaction

4. **Reply to Messages**
   - Click "Reply" on any message
   - Type reply and post
   - Verify threaded display

5. **Organizer Actions**
   - Pin important messages (star icon)
   - Delete any message
   - Create announcement (ANNOUNCEMENT badge)

6. **Real-Time Updates**
   - Open forum in two browser windows
   - Post in one → Should appear in other after 5 seconds

### Testing Anonymous Feedback (Tier C - 2 Marks)

1. **Access Feedback Form** (as Participant)
   - Register for an event
   - Wait for event to end (or manually set end date)
   - Click "Give Feedback" on event detail page

2. **Submit Feedback**
   - Select star rating (1-5)
   - Write text feedback
   - Rate different dimensions
   - Submit

3. **View Feedback** (as Organizer)
   - Go to event detail page (organizer view)
   - Click "View Feedback" button
   - View all submissions
   - Check aggregate statistics (average rating)

## 🚨 Common Issues & Solutions

### Backend Issues
- **MongoDB Connection Failed**: Check MongoDB Atlas connection string in `.env`
- **Port Already in Use**: Change PORT in `.env` or kill process: `lsof -ti:5001 | xargs kill -9`
- **JWT Secret Error**: Ensure JWT_SECRET is set in `.env`

### Frontend Issues
- **Compilation Warnings**: React Hook dependency warnings are expected and don't affect functionality
- **CORS Errors**: Ensure backend CORS is configured to allow `http://localhost:3000`
- **Images Not Displaying**: Check base64 encoding in payment proof upload

### Feature-Specific Issues
- **Payment Approval Not Working**: Ensure event type is "merchandise"
- **QR Scanner Not Finding Ticket**: Check ticket ID format and registration approval status
- **Discussion Forum Not Updating**: Polling interval is 5 seconds, wait for auto-refresh
- **Password Reset Not Working**: Ensure admin approves request and organizer uses new password

### Environment Variables

**Required for Backend:**
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT (change in production!)
- `JWT_EXPIRE` - Token expiration time
- `ADMIN_EMAIL` - Admin email
- `ADMIN_PASSWORD` - Admin password

## 🎯 Implemented Features Summary

### ✅ Part 1: Core System (Completed)
- Authentication & Security (JWT, bcrypt, role-based access)
- User Management (Participant, Organizer, Admin roles)
- Admin Dashboard (Create/remove organizers, reset passwords)

### ✅ Part 2: Advanced Features (Completed - 30 Marks)
- **Tier A (16 marks):**
  - Merchandise Payment Approval Workflow (8 marks)
  - QR Scanner & Attendance Tracking (8 marks)
  
- **Tier B (12 marks):**
  - Organizer Password Reset Workflow (6 marks)
  - Real-Time Discussion Forum (6 marks)
  
- **Tier C (2 marks):**
  - Anonymous Feedback System (2 marks)

### 🔄 Future Enhancements
- WebSocket integration for true real-time updates (currently using polling)
- Advanced analytics and reporting
- Mobile app integration
- Notification system (email/SMS)
- Certificate generation with QR verification

## 📝 Notes

- Change `JWT_SECRET` and admin password in production
- Use environment-specific `.env` files
- MongoDB must be running before starting backend
- Frontend proxies API requests to backend in development
- For production, build frontend and serve via backend or CDN

## 🤝 Contributing

This is a course assignment project. For questions or issues, contact the development team.

---

**Built for DASS Assignment 1 - February 2026**
