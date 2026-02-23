# 🧪 Complete Testing Guide

## Quick Start Testing (5 Minutes)

### Step 1: Start the Application

**Terminal 1 - Start MongoDB:**
```bash
# Check if MongoDB is running
mongosh --eval "db.version()"

# If not running, start it (macOS)
brew services start mongodb-community
```

**Terminal 2 - Start Backend:**
```bash
cd /Users/abhinavchatrathi/Documents/Sem4/DASS/Assignment1/backend
npm install   # First time only
npm run seed:admin   # First time only
npm run dev
```

Expected output:
```
Server is running on port 5000
MongoDB Connected: localhost
```

**Terminal 3 - Start Frontend:**
```bash
cd /Users/abhinavchatrathi/Documents/Sem4/DASS/Assignment1/frontend
npm install   # First time only
npm start
```

Browser should open at `http://localhost:3000`

---

## ✅ Test Scenario 1: Admin Workflow (5 min)

### 1.1 Login as Admin
1. Go to `http://localhost:3000/login`
2. Enter credentials:
   - Email: `admin@felicity.iiit.ac.in`
   - Password: `Admin@123456`
3. Click "Login"

**Expected Result:**
- ✅ Redirects to `/admin/dashboard`
- ✅ Shows "Welcome, System Admin!"
- ✅ Shows Organizers section (0 organizers initially)
- ✅ Shows Participants section (0 participants initially)
- ✅ Navbar shows "Logout" button

### 1.2 Create an Organizer
1. Click "Create Organizer" button
2. Fill in the form:
   - Name: `Technical Club`
   - Email: `tech@club.iiit.ac.in`
   - Password: `techclub123`
   - Organization Name: `Technical Club IIIT`
   - Organization Type: `club`
3. Click "Create"

**Expected Result:**
- ✅ Success message appears
- ✅ Modal closes
- ✅ New organizer appears in the table
- ✅ Organizers count increases to 1

### 1.3 Create More Organizers (Optional)
Create a few more for testing:
- Cultural Club (`cultural@club.iiit.ac.in`)
- Sports Council (`sports@council.iiit.ac.in`)
- Fest Team (`fest@team.iiit.ac.in`)

### 1.4 Test Password Reset
1. Find an organizer in the list
2. Click "Reset Password" button
3. Enter new password: `newpassword123`
4. Confirm password: `newpassword123`
5. Click "Reset Password"

**Expected Result:**
- ✅ Success message appears
- ✅ Modal closes
- ✅ Can now login with new password (test in incognito)

### 1.5 Test Deactivate Organizer
1. Click "Deactivate" button on an organizer
2. Confirm the action

**Expected Result:**
- ✅ Status changes to "Inactive"
- ✅ Deactivate button becomes disabled

---

## ✅ Test Scenario 2: Participant Registration (5 min)

### 2.1 Logout from Admin
1. Click "Logout" button in navbar

**Expected Result:**
- ✅ Redirects to `/login`
- ✅ Navbar no longer shows user info

### 2.2 Register as IIIT Participant
1. Click "Register as Participant" link
2. Fill in the form:
   - Name: `Abhinav Chatrathi`
   - Participant Type: `IIIT Student`
   - Email: `abhinav@iiit.ac.in`
   - Password: `abhinav123`
   - Confirm Password: `abhinav123`
3. Click "Register"

**Expected Result:**
- ✅ Registration successful
- ✅ Automatically logged in
- ✅ Redirects to `/participant/dashboard`
- ✅ Shows "Welcome, Abhinav Chatrathi!"
- ✅ Shows participant type: "IIIT Student"

### 2.3 Test IIIT Email Validation (Error Case)
1. Logout
2. Go to `/register`
3. Try to register with:
   - Participant Type: `IIIT Student`
   - Email: `test@gmail.com` (invalid for IIIT)
4. Click "Register"

**Expected Result:**
- ❌ Error message: "IIIT participants must use IIIT-issued email ID"
- ❌ Registration fails

### 2.4 Register as Non-IIIT Participant
1. Fill in the form:
   - Name: `John Doe`
   - Participant Type: `Non-IIIT Participant`
   - Email: `john@gmail.com`
   - Password: `john123`
   - Confirm Password: `john123`
2. Click "Register"

**Expected Result:**
- ✅ Registration successful
- ✅ Redirects to `/participant/dashboard`
- ✅ Shows participant type: "Non-IIIT"

### 2.5 Test Duplicate Email (Error Case)
1. Logout
2. Try to register again with `abhinav@iiit.ac.in`

**Expected Result:**
- ❌ Error message: "User already exists with this email"

---

## ✅ Test Scenario 3: Organizer Workflow (3 min)

### 3.1 Login as Organizer
1. Logout (if logged in)
2. Go to `/login`
3. Enter organizer credentials:
   - Email: `tech@club.iiit.ac.in`
   - Password: `techclub123`
4. Click "Login"

**Expected Result:**
- ✅ Redirects to `/organizer/dashboard`
- ✅ Shows "Welcome, Technical Club!"
- ✅ Shows organization info
- ✅ Shows organization type

### 3.2 Test Organizer Access Control
1. While logged in as organizer
2. Try to manually navigate to `/admin/dashboard`

**Expected Result:**
- ❌ Automatically redirects to `/organizer/dashboard`
- ❌ Cannot access admin routes

---

## ✅ Test Scenario 4: Session Persistence (2 min)

### 4.1 Test Browser Restart
1. Login as any user
2. Close the browser completely
3. Reopen browser
4. Go to `http://localhost:3000`

**Expected Result:**
- ✅ Still logged in
- ✅ Redirects to appropriate dashboard
- ✅ User info shows in navbar

### 4.2 Test Logout
1. Click "Logout" button
2. Check localStorage (F12 → Application → Local Storage)

**Expected Result:**
- ✅ Token removed from localStorage
- ✅ User removed from localStorage
- ✅ Redirects to `/login`

### 4.3 Test Protected Routes Without Login
1. Make sure you're logged out
2. Try to access: `http://localhost:3000/participant/dashboard`

**Expected Result:**
- ❌ Redirects to `/login`
- ❌ Cannot access without authentication

---

## 🔧 Test with API Tools (Postman/cURL)

### Test 1: Register Participant
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

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@iiit.ac.in",
    "role": "participant",
    "participantType": "iiit"
  }
}
```

### Test 2: Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@felicity.iiit.ac.in",
    "password": "Admin@123456"
  }'
```

Save the token from response!

### Test 3: Get Current User (with token)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test 4: Create Organizer (admin only)
```bash
curl -X POST http://localhost:5000/api/admin/organizers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Sports Club",
    "email": "sports@club.com",
    "password": "sports123",
    "organizationType": "club",
    "organizationName": "Sports Club"
  }'
```

### Test 5: Try Admin Endpoint Without Token (Should Fail)
```bash
curl -X GET http://localhost:5000/api/admin/organizers
```

**Expected Response:**
```json
{
  "message": "Not authorized, no token"
}
```

---

## 🔍 Test Security Features

### Test 1: Password Hashing
1. Login to MongoDB:
   ```bash
   mongosh
   use felicity
   db.users.find().pretty()
   ```

2. Check password field

**Expected Result:**
- ✅ Password is hashed: `$2a$10$...`
- ✅ NOT plaintext

### Test 2: JWT Token Structure
1. Login and copy the token
2. Go to https://jwt.io
3. Paste the token

**Expected Result:**
- ✅ Payload contains: `id`, `role`, `iat`, `exp`
- ✅ Signature is verified (if you paste the JWT_SECRET)

### Test 3: Email Domain Validation
Try these registrations (should fail for IIIT type):
- `test@gmail.com` with IIIT type → ❌
- `test@yahoo.com` with IIIT type → ❌
- `test@students.iiit.ac.in` with IIIT type → ✅
- `test@iiit.ac.in` with IIIT type → ✅

### Test 4: Role-Based Access
| User Type | Can Access Participant Dashboard | Can Access Organizer Dashboard | Can Access Admin Dashboard |
|-----------|--------------------------------|-------------------------------|---------------------------|
| Participant | ✅ | ❌ → Redirects | ❌ → Redirects |
| Organizer | ❌ → Redirects | ✅ | ❌ → Redirects |
| Admin | ❌ → Redirects | ❌ → Redirects | ✅ |

---

## 🐛 Common Issues & Solutions

### Issue 1: Backend won't start
**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`
**Solution:**
```bash
# Check if MongoDB is running
mongosh

# If not, start it
brew services start mongodb-community
```

### Issue 2: Frontend won't start
**Error:** `Port 3000 is already in use`
**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm start
```

### Issue 3: CORS errors
**Error:** `Access to XMLHttpRequest has been blocked by CORS`
**Solution:**
- Check backend is running on port 5000
- Check CORS is enabled in `server.js`
- Clear browser cache

### Issue 4: Token expired
**Error:** `jwt expired`
**Solution:**
```bash
# Clear localStorage in browser
localStorage.clear()

# Or logout and login again
```

### Issue 5: Admin already exists
**Error:** `Admin user already exists`
**Solution:**
```bash
# This is normal! Admin already seeded
# Just use existing credentials to login
```

---

## 📊 Testing Checklist

Print this and check off as you test:

### Setup ✅
- [ ] MongoDB running
- [ ] Backend started (port 5000)
- [ ] Frontend started (port 3000)
- [ ] Admin account seeded
- [ ] No console errors

### Authentication ✅
- [ ] Admin login works
- [ ] Participant IIIT registration works
- [ ] Participant Non-IIIT registration works
- [ ] IIIT email validation works
- [ ] Duplicate email rejected
- [ ] Invalid credentials rejected
- [ ] Logout works

### Admin Functions ✅
- [ ] Create organizer (club)
- [ ] Create organizer (council)
- [ ] Create organizer (fest_team)
- [ ] View all organizers
- [ ] View all participants
- [ ] Reset organizer password
- [ ] Deactivate organizer

### Organizer Functions ✅
- [ ] Organizer login works
- [ ] Organizer dashboard accessible
- [ ] Cannot access admin routes

### Session Management ✅
- [ ] Session persists after refresh
- [ ] Session persists after browser close
- [ ] Logout clears session
- [ ] Cannot access protected routes when logged out

### Security ✅
- [ ] Passwords are hashed in DB
- [ ] JWT token contains correct data
- [ ] Protected routes require token
- [ ] Role-based access enforced
- [ ] Email validation works

### UI/UX ✅
- [ ] Login page renders correctly
- [ ] Register page renders correctly
- [ ] All dashboards render correctly
- [ ] Navbar shows user info
- [ ] Forms validate properly
- [ ] Error messages display
- [ ] Success messages display
- [ ] Modals open/close properly

---

## 🎯 Advanced Testing

### Test 1: Multiple User Sessions
1. Open browser in normal mode → Login as Admin
2. Open incognito window → Login as Participant
3. Open another incognito → Login as Organizer
4. All three should work simultaneously

### Test 2: Invalid Token
1. Login and get token
2. Modify token manually in localStorage
3. Try to access protected route

**Expected:** Automatically logged out and redirected to login

### Test 3: Network Failure
1. Login successfully
2. Stop backend server
3. Try to create organizer

**Expected:** Error message displayed, no crash

### Test 4: Large Data
1. Create 20+ organizers
2. Register 50+ participants
3. Check if tables render properly
4. Check if there's pagination (future feature)

---

## 📱 Browser Compatibility Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

Check:
- [ ] All pages render correctly
- [ ] Forms work
- [ ] Buttons clickable
- [ ] Modals display properly
- [ ] Responsive design (resize window)

---

## 🚀 Performance Testing

### Check Load Times
- Login page: < 1 second
- Dashboard load: < 2 seconds
- API responses: < 500ms
- Form submissions: < 1 second

### Memory Leaks
1. Open Chrome DevTools → Performance
2. Record while navigating
3. Check memory usage
4. Should not increase significantly

---

## 📝 Test Report Template

After testing, document your results:

```
Test Date: [Date]
Tester: [Your Name]

Setup:
- MongoDB Version: [version]
- Node Version: [version]
- Browser: [browser + version]

Test Results:
✅ All authentication tests passed
✅ All admin functions working
✅ All security features verified
✅ Session management working
❌ [Any failed tests]

Issues Found:
1. [Issue description]
2. [Issue description]

Notes:
[Any additional observations]
```

---

## 🎓 What You Should See

### After Complete Testing:

**MongoDB Database:**
```javascript
db.users.find().count()
// Should show: 1 admin + X organizers + Y participants
```

**Backend Console:**
```
Server is running on port 5000
MongoDB Connected: localhost
[Successful login logs]
[Successful registration logs]
```

**Frontend:**
- Login page with form
- Register page with participant type selection
- Admin dashboard with organizers and participants tables
- Organizer dashboard with organization info
- Participant dashboard with user info
- Navbar with logout button
- No console errors in browser DevTools

---

## 🎉 Success Criteria

Your implementation is working correctly if:

1. ✅ All test scenarios pass
2. ✅ No errors in browser console
3. ✅ No errors in backend console
4. ✅ Passwords are hashed in database
5. ✅ JWT tokens are generated and verified
6. ✅ Role-based access is enforced
7. ✅ Sessions persist across restarts
8. ✅ Email validation works correctly
9. ✅ All dashboards are accessible to correct roles
10. ✅ Admin can manage organizers

---

**Happy Testing! 🧪 If you encounter any issues, check the troubleshooting section or the SETUP.md file.**
