import request from 'supertest';
import app from '../app';
import prisma from '../config/prisma';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { createRefreshToken } from '../models/refreshToken';

describe('Authentication', () => {
  const testUser = {
    name: "Test User",
    email: "test@example.com",
    password: "securepassword",
    walletAddress: "0x1234567890123456789012345678901234567890",
    nonce: "123456"
  };

  beforeAll(async () => {
    // Clean up database and create test user
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.user.create({
      data: testUser
    });
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/auth/refresh', () => {
    let validRefreshToken: string;

    beforeEach(async () => {
      // Create a valid refresh token
      validRefreshToken = generateRefreshToken(testUser as any);
      await createRefreshToken(testUser as any, validRefreshToken);
    });

    it('should return new tokens when valid refresh token is provided', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: validRefreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.refreshToken).not.toBe(validRefreshToken);
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail when refresh token is missing', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Protected Routes', () => {
    let validAccessToken: string;

    beforeEach(() => {
      validAccessToken = generateAccessToken(testUser as any);
    });

    it('should allow access with valid JWT', async () => {
      const response = await request(app)
        .get('/api/loans')
        .set('Authorization', `Bearer ${validAccessToken}`);

      expect(response.status).not.toBe(401);
    });

    it('should deny access with invalid JWT', async () => {
      const response = await request(app)
        .get('/api/loans')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should deny access with missing JWT', async () => {
      const response = await request(app)
        .get('/api/loans');

      expect(response.status).toBe(401);
    });
  });
}); 