import nodemailer from 'nodemailer';
import database from '../config/db'; // Adjusted import to use the unified database object

const transporter = nodemailer.createTransport({
  service: database.config.EMAIL_SERVICE,
  auth: {
    user: database.config.EMAIL_USER,
    pass: database.config.EMAIL_PASSWORD
  }
});

// Explicitly define parameter types
const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verificationLink = `${database.config.BASE_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: database.config.EMAIL_USER,
    to: email,
    subject: 'Email Verification',
    html: `
      <h1>Verify Your Email</h1>
      <p>Please click on the link below to verify your email address:</p>
      <a href="${verificationLink}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `
  };
  
  await transporter.sendMail(mailOptions);
};

export default {
  sendVerificationEmail
};
