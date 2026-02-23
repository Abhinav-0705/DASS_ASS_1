# API Testing Guide

## Test Collection for Felicity Event Management API

Use these examples to test the API with tools like Postman, Insomnia, or cURL.

---

## 🔐 Authentication Endpoints

### 1. Register IIIT Participant

**Endpoint:** `POST /api/auth/register`

```json
{
  "name": "Abhinav Chatrathi",
  "email": "abhinav@iiit.ac.in",
  "password": "password123",
  "participantType": "iiit"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65abc123...",
    "name": "Abhinav Chatrathi",
    "email": "abhinav@iiit.ac.in",
    "role": "participant",
    "participantType": "iiit"
  }
}
```

### 2. Register Non-IIIT Participant

**Endpoint:** `POST /api/auth/register`

```json
{
  "name": "John Doe",
  "email": "john@gmail.com",
  "password": "password123",
  "participantType": "non-iiit"
}
```

### 3. Login

**Endpoint:** `POST /api/auth/login`

```json
{
  "email": "admin@felicity.iiit.ac.in",
  "password": "Admin@123456"
}
```

**Response includes JWT token - save it for authenticated requests!**

### 4. Get Current User

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

### 5. Logout

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

---

## 👑 Admin Endpoints

**Note:** All admin endpoints require admin authentication token!

### 1. Create Organizer

**Endpoint:** `POST /api/admin/organizers`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Technical Club IIIT",
  "email": "tech@club.iiit.ac.in",
  "password": "techclub123",
  "organizationType": "club",
  "organizationName": "Technical Club"
}
```

**Organization Types:**
- `club` - Student clubs
- `council` - Student councils
- `fest_team` - Fest organizing teams

### 2. Get All Organizers

**Endpoint:** `GET /api/admin/organizers`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

### 3. Get All Participants

**Endpoint:** `GET /api/admin/participants`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

### 4. Deactivate Organizer

**Endpoint:** `DELETE /api/admin/organizers/:organizerId`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Example:**
```
DELETE /api/admin/organizers/65abc123def456789
```

### 5. Reset Organizer Password

**Endpoint:** `PUT /api/admin/organizers/:organizerId/reset-password`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "newPassword": "newSecurePassword123"
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: Complete Admin Flow

1. **Login as Admin**
   ```bash
   POST /api/auth/login
   Body: {"email": "admin@felicity.iiit.ac.in", "password": "Admin@123456"}
   ```

2. **Create Organizer**
   ```bash
   POST /api/admin/organizers
   Headers: Authorization: Bearer <admin_token>
   Body: {"name": "Tech Club", "email": "tech@club.com", ...}
   ```

3. **View All Organizers**
   ```bash
   GET /api/admin/organizers
   Headers: Authorization: Bearer <admin_token>
   ```

### Scenario 2: Participant Registration & Login

1. **Register IIIT Participant**
   ```bash
   POST /api/auth/register
   Body: {"name": "Student", "email": "student@iiit.ac.in", ...}
   ```

2. **Login**
   ```bash
   POST /api/auth/login
   Body: {"email": "student@iiit.ac.in", "password": "..."}
   ```

3. **Get Profile**
   ```bash
   GET /api/auth/me
   Headers: Authorization: Bearer <participant_token>
   ```

### Scenario 3: Organizer Login

1. **Create Organizer** (as Admin)
2. **Login as Organizer**
   ```bash
   POST /api/auth/login
   Body: {"email": "tech@club.com", "password": "techclub123"}
   ```

3. **Access Organizer Dashboard**

---

## ❌ Error Testing

### Test IIIT Email Validation

**Should FAIL:**
```json
POST /api/auth/register
{
  "name": "Test User",
  "email": "test@gmail.com",
  "password": "password123",
  "participantType": "iiit"
}
```

**Expected Error (400):**
```json
{
  "message": "IIIT participants must register with IIIT-issued email ID"
}
```

### Test Duplicate Email

1. Register a user
2. Try registering again with same email

**Expected Error (400):**
```json
{
  "message": "User already exists with this email"
}
```

### Test Invalid Credentials

```json
POST /api/auth/login
{
  "email": "admin@felicity.iiit.ac.in",
  "password": "wrongpassword"
}
```

**Expected Error (401):**
```json
{
  "message": "Invalid credentials"
}
```

### Test Unauthorized Access

**Try accessing admin endpoint without token:**
```bash
GET /api/admin/organizers
# No Authorization header
```

**Expected Error (401):**
```json
{
  "message": "Not authorized, no token"
}
```

### Test Role-based Access

**Try accessing admin endpoint with participant token:**
```bash
GET /api/admin/organizers
Headers: Authorization: Bearer <participant_token>
```

**Expected Error (403):**
```json
{
  "message": "User role 'participant' is not authorized to access this route"
}
```

---

## 📊 Response Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET/POST/PUT request |
| 201 | Created | User registered successfully |
| 400 | Bad Request | Validation error, missing fields |
| 401 | Unauthorized | Invalid/missing token, wrong credentials |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Database error, server crash |

---

## 🔧 cURL Examples

### Register Participant
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@iiit.ac.in",
    "password": "password123",
    "participantType": "iiit"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@felicity.iiit.ac.in",
    "password": "Admin@123456"
  }'
```

### Get Current User (replace TOKEN)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Organizer (as Admin)
```bash
curl -X POST http://localhost:5000/api/admin/organizers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Tech Club",
    "email": "tech@club.com",
    "password": "techclub123",
    "organizationType": "club",
    "organizationName": "Technical Club"
  }'
```

### Get All Organizers
```bash
curl -X GET http://localhost:5000/api/admin/organizers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 💡 Pro Tips

1. **Save tokens:** After login, save the JWT token for subsequent requests
2. **Use environment variables:** In Postman/Insomnia, store BASE_URL and tokens as variables
3. **Test validation:** Try sending incomplete data to test validation
4. **Check response times:** All endpoints should respond within 200-500ms
5. **Test session persistence:** Logout and login to verify token clearing works

---

## 📝 Postman Collection

To import these tests into Postman:

1. Create a new Collection named "Felicity API"
2. Create folders: "Auth", "Admin"
3. Add requests from above with their respective bodies and headers
4. Create environment variables:
   - `base_url`: http://localhost:5000/api
   - `admin_token`: (save after admin login)
   - `participant_token`: (save after participant login)
   - `organizer_token`: (save after organizer login)

Use `{{base_url}}` and `{{admin_token}}` in your requests!

---

**Happy Testing! 🧪**
