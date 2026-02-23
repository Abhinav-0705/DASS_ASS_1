# Email Setup Guide

This application sends emails for various notifications. Here's how to configure it:

## 🚀 Quick Setup (Gmail)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Click on "Security"
3. Enable "2-Step Verification"

### Step 2: Generate App Password
1. After enabling 2FA, go back to Security
2. Scroll to "Signing in to Google"
3. Click "App passwords"
4. Select "Mail" and your device
5. Click "Generate"
6. Copy the 16-character password (no spaces)

### Step 3: Update .env File
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # Your app password
EMAIL_FROM=Felicity IIIT <noreply@felicity.iiit.ac.in>
```

## 📧 Emails Sent by the Application

### 1. **Registration Confirmation**
- **Trigger**: When a participant registers for an event
- **Recipients**: Participant's email
- **Content**: 
  - Event details
  - Ticket ID (QR code attached)
  - Event date, time, venue
  - Registration details

### 2. **Password Reset Approved**
- **Trigger**: When admin approves organizer password reset request
- **Recipients**: Organizer's email
- **Content**:
  - Notification of approval
  - New auto-generated password
  - Instructions to login

### 3. **Password Reset Rejected**
- **Trigger**: When admin rejects organizer password reset request
- **Recipients**: Organizer's email
- **Content**:
  - Notification of rejection
  - Admin's comments/reason
  - Next steps

### 4. **New Organizer Account Created**
- **Trigger**: When admin creates a new organizer account
- **Recipients**: Organizer's contact email
- **Content**:
  - Welcome message
  - Login credentials (email and password)
  - Portal link
  - Getting started guide

## 🧪 Testing Emails (Development Mode)

In development mode (`NODE_ENV=development`), emails are **NOT sent** but are **logged to console** instead. You'll see:

```
=== EMAIL NOTIFICATION (DEV MODE) ===
To: participant@example.com
Subject: Registration Confirmed - Event Name
Ticket ID: TKT-ABC123XY
====================================
```

## 🔐 Using Real Email (Production)

To actually send emails:

1. Set `NODE_ENV=production` in `.env`
2. Configure valid Gmail credentials
3. Restart the backend server
4. Emails will be sent for real!

## 📝 Alternative Email Providers

### Using Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Using SendGrid (Recommended for Production)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

### Using Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your-mailgun-password
```

## 🐛 Troubleshooting

### Emails not sending?
1. ✅ Check `.env` file has correct EMAIL_USER and EMAIL_PASSWORD
2. ✅ Verify app password is correct (no spaces)
3. ✅ Check Gmail "Less secure app access" is ON (if not using app password)
4. ✅ Check server console for error messages
5. ✅ Try NODE_ENV=development to see if email logic is working

### Gmail blocking emails?
- Use App Passwords (not regular password)
- Check Gmail security settings
- Verify 2FA is enabled

### Want to test without real emails?
- Keep `NODE_ENV=development`
- Check console output for email content
- Use tools like [Mailtrap](https://mailtrap.io/) for email testing

## 📌 Current Status

Your app is currently in **DEVELOPMENT MODE**:
- ✅ Emails are logged to console
- ❌ Emails are NOT actually sent
- 🔧 This is safe for testing

To enable real emails:
```bash
# In backend/.env
NODE_ENV=production
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password
```

Then restart backend:
```bash
cd backend
npm run dev
```

## 🎯 Testing Checklist

- [ ] Register for an event → Check console for email log
- [ ] Admin creates organizer → Check console for credentials email
- [ ] Organizer requests password reset → Admin approves → Check console
- [ ] Admin rejects password reset → Check console

---

**Need help?** Check the server console for detailed email logs!
