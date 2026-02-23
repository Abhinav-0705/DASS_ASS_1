// Quick test to verify email credentials
require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Testing email configuration...\n');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('\nAttempting to create transporter...\n');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify connection
transporter.verify(function (error, success) {
  if (error) {
    console.log('❌ Email verification FAILED:');
    console.log(error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure 2-Factor Authentication is enabled on your Gmail account');
    console.log('2. Go to: https://myaccount.google.com/apppasswords');
    console.log('3. Generate a NEW app password');
    console.log('4. Copy it WITHOUT SPACES (e.g., abcdabcdabcdabcd)');
    console.log('5. Update EMAIL_PASSWORD in backend/.env');
    console.log('6. Restart the backend server\n');
  } else {
    console.log('✅ Email server is ready to send messages!');
    console.log('📧 You can now send emails successfully!\n');
  }
  process.exit(error ? 1 : 0);
});
