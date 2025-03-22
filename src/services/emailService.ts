import nodemailer, { Transporter } from 'nodemailer';
import { NotificationType } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailTemplate {
  subject: string;
  template: (userName: string, message: string) => string;
}

export class EmailNotificationService {
  private transporter: Transporter;
  private emailTemplates: Record<NotificationType, EmailTemplate>;
  private fromEmail: string;

  constructor() {
    const emailConfig: EmailConfig = {
      host: process.env.EMAIL_HOST || '',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
    };

    this.fromEmail = process.env.EMAIL_FROM || 'noreply@yourdomain.com';
    this.transporter = nodemailer.createTransport(emailConfig);

    // Define email templates for each notification type
    this.emailTemplates = {
      LOAN_UPDATE: {
        subject: 'Loan Update',
        template: (userName, message) => `
          <html>
            <body>
              <h1>Loan Update</h1>
              <p>Hello ${userName},</p>
              <p>${message}</p>
              <p>Please log in to your account to view more details.</p>
              <p>Thank you,<br>TrustBridge</p>
            </body>
          </html>
        `,
      },
      ESCROW_UPDATE: {
        subject: 'Escrow Update',
        template: (userName, message) => `
          <html>
            <body>
              <h1>Escrow Update</h1>
              <p>Hello ${userName},</p>
              <p>${message}</p>
              <p>Please log in to your account to view more details.</p>
              <p>Thank you,<br>TrustBridge</p>
            </body>
          </html>
        `,
      },
      PAYMENT_RECEIVED: {
        subject: 'Payment Received',
        template: (userName, message) => `
          <html>
            <body>
              <h1>Payment Received</h1>
              <p>Hello ${userName},</p>
              <p>${message}</p>
              <p>Please log in to your account to view more details.</p>
              <p>Thank you,<br>TrustBridge</p>
            </body>
          </html>
        `,
      },
      SYSTEM_ALERT: {
        subject: 'System Alert',
        template: (userName, message) => `
          <html>
            <body>
              <h1>System Alert</h1>
              <p>Hello ${userName},</p>
              <p>${message}</p>
              <p>Please log in to your account to view more details.</p>
              <p>Thank you,<br>TrustBridge</p>
            </body>
          </html>
        `,
      },

      EMAIL_VERIFICATION: {
        subject: 'Verify Your Email Address',
        template: (userName, message) => `
          <html>
            <body>
              <h1>Email Verification</h1>
              <p>Hello ${userName},</p>
              <p>Please verify your email address by clicking the link below:</p>
              <p>${message}</p>
              <p>If you did not request this change, please ignore this email.</p>
              <p>Thank you,<br>TrustBridge</p>
            </body>
          </html>
        `,
      },
    };
  }

  /**
   * Send an email notification
   */
  async sendEmail(
    userEmail: string,
    userName: string,
    type: NotificationType,
    message: string
  ): Promise<boolean> {
    try {
      const template = this.emailTemplates[type];

      if (!template) {
        console.error(`No email template found for notification type: ${type}`);
        return false;
      }

      const mailOptions = {
        from: this.fromEmail,
        to: userEmail,
        subject: template.subject,
        html: template.template(userName, message),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Verify email configuration by sending a test email
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection error:', error);
      return false;
    }
  }
}

export default new EmailNotificationService();