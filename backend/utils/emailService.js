const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// Create transporter (using Gmail for development)
const createTransporter = () => {
  // Check if email is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured, skipping email send');
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    
    console.log('✅ Email transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('Error creating email transporter:', error);
    return null;
  }
};

// Generate QR code as data URL
const generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data), {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
};

// Generate unique ticket ID
const generateTicketId = () => {
  return `TKT-${uuidv4().slice(0, 8).toUpperCase()}`;
};

// Send event registration confirmation email
const sendRegistrationEmail = async (participant, event, registration) => {
  try {
    // For development, just log the email (skip actual sending)
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n=== EMAIL NOTIFICATION (DEV MODE) ===');
      console.log(`To: ${participant.email}`);
      console.log(`Subject: Registration Confirmed - ${event.eventName}`);
      console.log(`Ticket ID: ${registration.ticketId}`);
      console.log('====================================\n');
      return { success: true, message: 'Email logged (dev mode)' };
    }

    const transporter = createTransporter();
    
    // If transporter creation failed, log and return
    if (!transporter) {
      console.log('Email transporter not available, skipping email send');
      return { success: false, message: 'Email not configured' };
    }

    // Generate QR code with ticket data
    const qrData = {
      ticketId: registration.ticketId,
      eventId: event._id,
      participantId: participant._id,
      participantName: `${participant.firstName} ${participant.lastName}`,
      eventName: event.eventName,
      eventDate: event.eventStartDate,
    };

    const qrCodeDataURL = await generateQRCode(qrData);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Registration Confirmed!</h2>
        <p>Dear ${participant.firstName} ${participant.lastName},</p>
        <p>Your registration for <strong>${event.eventName}</strong> has been confirmed.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Event Details</h3>
          <p><strong>Event:</strong> ${event.eventName}</p>
          <p><strong>Type:</strong> ${event.eventType}</p>
          <p><strong>Date:</strong> ${new Date(event.eventStartDate).toLocaleString()}</p>
          <p><strong>Venue:</strong> ${event.venue || 'TBA'}</p>
          ${event.registrationFee > 0 ? `<p><strong>Fee:</strong> ₹${event.registrationFee}</p>` : ''}
        </div>

        <div style="background: #fff; padding: 20px; border: 2px solid #4CAF50; border-radius: 5px; text-align: center;">
          <h3>Your Ticket</h3>
          <p><strong>Ticket ID:</strong> <span style="font-size: 18px; color: #2196F3;">${registration.ticketId}</span></p>
          ${qrCodeDataURL ? `<img src="${qrCodeDataURL}" alt="QR Code" style="max-width: 200px; margin: 20px 0;">` : ''}
          <p style="font-size: 12px; color: #666;">Please present this QR code at the event venue</p>
        </div>

        ${event.eventType === 'merchandise' ? `
          <div style="margin: 20px 0;">
            <h3>Merchandise Order</h3>
            <p><strong>Item:</strong> ${event.merchandiseDetails?.itemName}</p>
            <p><strong>Size:</strong> ${registration.merchandiseOrder?.size}</p>
            <p><strong>Color:</strong> ${registration.merchandiseOrder?.color}</p>
            <p><strong>Quantity:</strong> ${registration.merchandiseOrder?.quantity}</p>
            <p><strong>Total:</strong> ₹${registration.merchandiseOrder?.totalPrice}</p>
          </div>
        ` : ''}

        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          If you have any questions, please contact the organizer.
        </p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@felicity.com',
      to: participant.email,
      subject: `Registration Confirmed - ${event.eventName}`,
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: error.message };
  }
};

// Send organizer credentials email
const sendOrganizerCredentials = async (organizerEmail, loginEmail, password, organizerName) => {
  try {
    // For development, just log
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n=== ORGANIZER CREDENTIALS (DEV MODE) ===');
      console.log(`To: ${organizerEmail}`);
      console.log(`Login Email: ${loginEmail}`);
      console.log(`Password: ${password}`);
      console.log('========================================\n');
      return { success: true, message: 'Credentials logged (dev mode)' };
    }

    const transporter = createTransporter();

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">Welcome to Felicity Event Management</h2>
        <p>Dear ${organizerName},</p>
        <p>Your organizer account has been created successfully. Here are your login credentials:</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Login Email:</strong> ${loginEmail}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>

        <p>Please log in and change your password immediately for security reasons.</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Login Now</a></p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@felicity.com',
      to: organizerEmail,
      subject: 'Your Organizer Account Credentials - Felicity',
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Credentials sent successfully' };
  } catch (error) {
    console.error('Error sending credentials email:', error);
    return { success: false, message: error.message };
  }
};

// Send password reset approved email
const sendPasswordResetApproved = async (organizerEmail, organizerName, newPassword) => {
  try {
    // For development, just log
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n=== PASSWORD RESET APPROVED (DEV MODE) ===');
      console.log(`To: ${organizerEmail}`);
      console.log(`New Password: ${newPassword}`);
      console.log('==========================================\n');
      return { success: true, message: 'Email logged (dev mode)' };
    }

    const transporter = createTransporter();

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Password Reset Approved</h2>
        <p>Dear ${organizerName},</p>
        <p>Your password reset request has been approved by the admin.</p>
        
        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #155724; margin-top: 0;">Your New Password</h3>
          <p style="font-size: 24px; font-family: monospace; color: #155724; font-weight: bold; letter-spacing: 2px;">
            ${newPassword}
          </p>
          <p style="color: #155724; font-size: 14px;">⚠️ Please save this password securely. You won't be able to see it again.</p>
        </div>

        <p><strong>Important:</strong> Please log in and change your password immediately.</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Login Now</a></p>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          If you did not request a password reset, please contact the admin immediately.
        </p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@felicity.com',
      to: organizerEmail,
      subject: '✅ Password Reset Approved - Felicity',
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending password reset approved email:', error);
    return { success: false, message: error.message };
  }
};

// Send password reset rejected email
const sendPasswordResetRejected = async (organizerEmail, organizerName, reason) => {
  try {
    // For development, just log
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n=== PASSWORD RESET REJECTED (DEV MODE) ===');
      console.log(`To: ${organizerEmail}`);
      console.log(`Reason: ${reason}`);
      console.log('==========================================\n');
      return { success: true, message: 'Email logged (dev mode)' };
    }

    const transporter = createTransporter();

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f44336;">Password Reset Request Rejected</h2>
        <p>Dear ${organizerName},</p>
        <p>Your password reset request has been reviewed and rejected by the admin.</p>
        
        <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #721c24; margin-top: 0;">Reason for Rejection</h3>
          <p style="color: #721c24;">
            ${reason || 'No specific reason provided.'}
          </p>
        </div>

        <p>If you believe this was an error or need further assistance, please contact the admin.</p>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          You can submit a new password reset request if needed.
        </p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@felicity.com',
      to: organizerEmail,
      subject: '❌ Password Reset Request Rejected - Felicity',
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending password reset rejected email:', error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  sendRegistrationEmail,
  sendOrganizerCredentials,
  sendPasswordResetApproved,
  sendPasswordResetRejected,
  generateTicketId,
  generateQRCode,
};
