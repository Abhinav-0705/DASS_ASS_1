# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

**Terminal 1 - Backend:**
```bash
cd backend
npm install
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Setup Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` if needed (default values work for local development)

### Step 3: Start MongoDB

```bash
# macOS with Homebrew
brew services start mongodb-community

# Or check if MongoDB is already running
mongosh --eval "db.version()"
```

### Step 4: Seed Admin Account

```bash
cd backend
npm run seed:admin
```

**Default Admin Credentials:**
- Email: `admin@felicity.iiit.ac.in`
- Password: `Admin@123456`

### Step 5: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Step 6: Access the Application

Open your browser and go to: **http://localhost:3000**

---

## 📋 Quick Test Checklist

### ✅ Test Admin Functions
1. Login with admin credentials
2. Create a test organizer (e.g., "Tech Club")
3. View participants list
4. Test password reset for organizer

### ✅ Test Organizer Functions
1. Logout from admin
2. Login with organizer credentials
3. Access organizer dashboard

### ✅ Test Participant Registration
1. Logout
2. Register as IIIT participant (use @iiit.ac.in email)
3. Register as Non-IIIT participant
4. Login and access participant dashboard

---

## 🐛 Troubleshooting

**Backend won't start:**
- Check if MongoDB is running: `mongosh`
- Check port 5000 is free: `lsof -i :5000`

**Frontend won't start:**
- Check port 3000 is free: `lsof -i :3000`
- Clear node_modules: `rm -rf node_modules && npm install`

**IIIT email validation failing:**
- Email must end with @iiit.ac.in or @students.iiit.ac.in
- Check for extra spaces in email input

**JWT token errors:**
- Clear browser localStorage
- Logout and login again
- Check JWT_SECRET in .env matches between restarts

---

## 📱 API Testing with cURL

**Register Participant:**
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

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@felicity.iiit.ac.in",
    "password": "Admin@123456"
  }'
```

---

## 🎯 What's Implemented (Part 1)

✅ User Authentication (Register, Login, Logout)  
✅ Role-based Access Control (Participant, Organizer, Admin)  
✅ JWT Token Authentication  
✅ Password Hashing with bcrypt  
✅ IIIT Email Domain Validation  
✅ Session Persistence  
✅ Protected Routes  
✅ Admin Dashboard (Create/Manage Organizers)  
✅ Participant Dashboard  
✅ Organizer Dashboard  
✅ Password Reset (Admin → Organizer)  

---

**Ready to build the next part? All authentication foundations are in place! 🎉**
