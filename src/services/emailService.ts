import nodemailer, { Transporter } from "nodemailer";
import { NotificationType } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    type: string;
    user: string;
    // OAuth2 properties
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
    accessToken?: string;
    expires?: number;
    // Password fallback (only used if OAuth2 is not configured)
    pass?: string;
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
    const useOAuth2 =
      process.env.EMAIL_USE_OAUTH === "true" &&
      process.env.EMAIL_CLIENT_ID &&
      process.env.EMAIL_CLIENT_SECRET &&
      process.env.EMAIL_REFRESH_TOKEN;

    const auth: any = {
      user: process.env.EMAIL_USER || "",
    };

    if (useOAuth2) {
      auth.type = "OAuth2";
      auth.clientId = process.env.EMAIL_CLIENT_ID;
      auth.clientSecret = process.env.EMAIL_CLIENT_SECRET;
      auth.refreshToken = process.env.EMAIL_REFRESH_TOKEN;

      if (process.env.EMAIL_ACCESS_TOKEN) {
        auth.accessToken = process.env.EMAIL_ACCESS_TOKEN;
      }

      if (process.env.EMAIL_TOKEN_EXPIRES) {
        auth.expires = parseInt(process.env.EMAIL_TOKEN_EXPIRES, 10);
      }
    } else {
      // Only use password fallback if OAuth2 is not configured
      if (process.env.EMAIL_PASS) {
        auth.pass = process.env.EMAIL_PASS;
      }
    }

    // const emailConfig: EmailConfig = {
    //   host: process.env.EMAIL_HOST || '',
    //   port: parseInt(process.env.EMAIL_PORT || '587', 10),
    //   secure: process.env.EMAIL_SECURE === 'true',
    //   auth,
    // };

    // this.fromEmail = process.env.EMAIL_FROM || 'noreply@yourdomain.com';
    // this.transporter = nodemailer.createTransport(emailConfig);

    const emailConfig = {
      host: process.env.EMAIL_HOST || "",
      port: parseInt(process.env.EMAIL_PORT || "587", 10),
      secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASS || "",
      },
    };

    this.fromEmail = process.env.EMAIL_FROM || "noreply@yourdomain.com";
    this.transporter = nodemailer.createTransport(emailConfig);

    // Define email templates for each notification type
    this.emailTemplates = {
      LOAN_UPDATE: {
        subject: "Loan Update",
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
        subject: "Escrow Update",
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
        subject: "Payment Received",
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
        subject: "System Alert",
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
      // Safe error logging without exposing credentials
      console.error(
        "Error sending email:",
        error instanceof Error ? error.message : "Unknown error"
      );
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
      // Safe error logging without exposing credentials
      console.error(
        "Email service connection error:",
        error instanceof Error ? error.message : "Unknown error"
      );
      return false;
    }
  }
}

export default new EmailNotificationService();
