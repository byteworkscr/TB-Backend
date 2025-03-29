import { NotificationType, TokenType } from "@prisma/client";



export interface IRecommendation {
  id: string;
  userId: string;
  recommendedUserId: string;
  recommendationText: string;
  user?: IUser;
  reason: string;
  createdAt: Date;
}



export interface IAuthInfo {
  message?: string;
  status?: number;
}

export interface IAuthUser {
  walletAddress: string;
}

export interface IDeviceInfo {
  device?: string | null; // Device type (mobile, desktop, etc.)
  deviceId?: string | null; // Unique identifier for the device
  userAgent?: string | null; // Browser/app user agent
  ipAddress?: string | null; // IP address of the request
}


export interface IEmailConfig {
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

export interface IEmailTemplate {
  subject: string;
  template: (userName: string, message: string) => string;
}


export interface IJWTPayload {
  walletAddress: string;
  type: "access" | "refresh";
  origin?: string; // Origin used when generating the token
}

export interface IUserSession {
  walletAddress: string;
}

export interface ILoan {
  id: string;
  userId: string;
  amount: number;
  interestRate: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user?: IUser;
  payments?: IPayment[];
}


export interface ICreditScore {
  id: string;
  userId: string;
  score: number;
  lastUpdated: Date;
  user?: IUser;
}


export interface IPayment {
  id: string;
  userId: string;
  loanId: string;
  amount: number;
  paymentDate: Date;
  status: string;
  user?: IUser;
  loan?: ILoan;
}

export interface IReputation {
  id: string;
  userId: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
  reputationScore: number;
  trend: string;
  lastUpdated: Date;
  user?: IUser;
}
export interface IAudit {
  id: string;
  userId: string;
  action: string;
  details: string;
  createdAt: Date;
}

export interface IRole {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  users?: IRoleUser[];
  permissions?: IRolePermission[];
}


export interface IUser {
  id: string;
  name: string;
  email: string;
  password: string;
  roles?: IRoleUser[];
  loans?: ILoan[];
  payments?: IPayment[];
  reputation?: IReputation;
  recommendations?: IRecommendation[];
  auditLogs?: IAuditLog[];
  notifications?: INotification[];
  resetToken?: string;
  walletAddress: string;
  nonce: string;
  createdAt: Date;
  lastLogin?: Date;
  refreshToken?: IRefreshToken[];
  updatedAt: Date;
  creditScore?: ICreditScore;
  isEmailVerified: boolean;
  otpCodes?: IOtpCode[];
}
export type CreateUserInput = IUser;

export type UpdateUserInput = IUser;


export interface IRoleUser {
  userId: string;
  roleId: string;
  user?: IUser;
  role?: IRole;
}

export interface IPermission {
  id: string;
  name: string;
  createdAt: Date;
  roles?: IRolePermission[];
}

export interface IRolePermission {
  roleId: string;
  permissionId: string;
  role?: IRole;
  permission?: IPermission;
}

export interface IAuditLog {
  id: string;
  userId?: string;
  action: string;
  timestamp: Date;
  details?: string;
  user?: IUser;
}

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: Date;
  user?: IUser;
}

export interface IRefreshToken {
  id: string;
  token: string;
  userId: string;
  type: TokenType;
  user?: IUser;
  expiresAt: Date;
  createdAt: Date;
  isRevoked: boolean;
  family?: string|null;
  replacedByToken?: string | null;
  device?: string | null;
  deviceId?: string |null;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface IOtpCode {
  id: string;
  user?: IUser;
  userId: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IRevokedToken {
  id: string;
  token: string;
  createdAt: Date;
}