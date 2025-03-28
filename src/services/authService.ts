import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { LoginDto, RefreshTokenDto, RegisterDto } from "../../src/dtos/auth.dto";

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;
const MAX_REFRESH_TOKENS = 5; 

class AuthService {
  /**
   * Registers a new user and generates tokens.
   */
  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name, 
        walletAddress: '', 
        nonce: '',
      },
    });
    
    return { user, tokens: await this.generateTokens(user.id) };
  }

  /**
   * Logs in a user and returns tokens.
   */
  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new Error("Invalid credentials");
    }

    return { user, tokens: await this.generateTokens(user.id) };
  }

  /**
   * Generates access and refresh tokens, ensuring a max of 5 active refresh tokens per user.
   */
  async generateTokens(userId: string) {
    const jwtSecret = process.env.JWT_SECRET as string;
    const refreshSecret = process.env.JWT_REFRESH_SECRET as string;

    if (!jwtSecret || !refreshSecret) {
      throw new Error("JWT secrets are missing in environment variables");
    }

    const accessToken = jwt.sign({ userId }, jwtSecret, {
      algorithm: "HS256",
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ userId }, refreshSecret, {
      algorithm: "HS256",
      expiresIn: "7d",
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, SALT_ROUNDS);

    const refreshTokensCount = await prisma.refreshToken.count({
      where: { userId, type: "REFRESH" },
    });

    if (refreshTokensCount >= MAX_REFRESH_TOKENS) {
      const oldestToken = await prisma.refreshToken.findFirst({
        where: {
          userId,
          type: "REFRESH",
        },
        orderBy: { expiresAt: "asc" },
      });
    
      if (oldestToken) {
        await prisma.refreshToken.delete({
          where: { id: oldestToken.id }, 
        });
      }
    }
    
    await prisma.refreshToken.createMany({
      data: [
        {
          userId,
          token: accessToken,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), 
          type: "ACCESS",
        },
        {
          userId,
          token: hashedRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
          type: "REFRESH",
        },
      ],
    });

    return { accessToken, refreshToken };
  }

  /**
   * Refreshes a user's access token using the refresh token.
   */
  async refreshToken(dto: RefreshTokenDto) {
    const refreshSecret = process.env.JWT_REFRESH_SECRET as string;
    if (!refreshSecret) {
      throw new Error("JWT refresh secret is missing in environment variables");
    }

    try {
      const payload = jwt.verify(dto.refreshToken, refreshSecret) as { userId: string };

      const storedToken = await prisma.refreshToken.findFirst({
        where: { userId: payload.userId, type: "REFRESH" },
        orderBy: { expiresAt: "desc" }, 
      });

      if (!storedToken || !(await bcrypt.compare(dto.refreshToken, storedToken.token))) {
        throw new Error("Invalid refresh token");
      }

      await prisma.refreshToken.delete({ where: { id: storedToken.id } });

      return { tokens: await this.generateTokens(payload.userId) };
    } catch (error) {
      throw new Error("Invalid or expired refresh token");
    }
  }
}

export default new AuthService();
