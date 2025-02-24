import request from 'supertest';
import { ethers } from 'ethers';
import app from '../../src/app';
import { users } from '../../src/models/user';

describe('Protected Routes', () => {
  const TEST_PRIVATE_KEY = '0123456789012345678901234567890123456789012345678901234567890123';
  const wallet = new ethers.Wallet(TEST_PRIVATE_KEY);
  let authCookie: string;

  beforeEach(async () => {
    users.length = 0;

    // Login before each test
    const nonceResponse = await request(app)
      .get(`/api/auth/nonce/${wallet.address}`)
      .expect(200);

    const nonce = nonceResponse.body.nonce;
    const message = `Sign this message to authenticate with TrustBridge: ${nonce}`;
    const signature = await wallet.signMessage(message);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        walletAddress: wallet.address,
        signature
      })
      .expect(200);

    authCookie = loginResponse.header['set-cookie'][0];
  });

  describe('GET /api/loans/available', () => {
    it('should return 401 if not authenticated', async () => {
      await request(app)
        .get('/api/loans/available')
        .expect(401);
    });

    it('should return loans for authenticated user', async () => {
      const response = await request(app)
        .get('/api/loans/available')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Check loan object structure
      const loan = response.body.data[0];
      expect(loan).toHaveProperty('id');
      expect(loan).toHaveProperty('amount');
      expect(loan).toHaveProperty('interest');
      expect(loan).toHaveProperty('duration');
    });

    it('should reject with invalid session cookie', async () => {
      await request(app)
        .get('/api/loans/available')
        .set('Cookie', 'invalid-cookie')
        .expect(401);
    });
  });

  describe('GET /api/loans/:id', () => {
    it('should return 401 if not authenticated', async () => {
      await request(app)
        .get('/api/loans/123')
        .expect(401);
    });

    it('should return loan details for authenticated user', async () => {
      const response = await request(app)
        .get('/api/loans/1')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', '1');
      expect(response.body.data).toHaveProperty('amount');
      expect(response.body.data).toHaveProperty('interest');
      expect(response.body.data).toHaveProperty('duration');
      expect(response.body.data).toHaveProperty('borrower');
      expect(response.body.data).toHaveProperty('status');
    });

    it('should include user wallet address as borrower', async () => {
      const response = await request(app)
        .get('/api/loans/1')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.data.borrower.toLowerCase()).toBe(wallet.address.toLowerCase());
    });
  });

  describe('Session Management', () => {
    it('should maintain session across multiple requests', async () => {
      // First request
      await request(app)
        .get('/api/loans/available')
        .set('Cookie', authCookie)
        .expect(200);

      // Second request with same session
      await request(app)
        .get('/api/loans/1')
        .set('Cookie', authCookie)
        .expect(200);
    });

    it('should reject requests after logout', async () => {
      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Cookie', authCookie)
        .expect(200);

      // Try to access protected route
      await request(app)
        .get('/api/loans/available')
        .set('Cookie', authCookie)
        .expect(401);
    });
  });
}); 