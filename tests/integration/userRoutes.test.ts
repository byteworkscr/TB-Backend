import request from 'supertest';
import { ethers } from 'ethers';
import app from '../../src/app';
import { users } from '../../src/models/user';

describe('User Routes', () => {
  const TEST_PRIVATE_KEY = '0123456789012345678901234567890123456789012345678901234567890123';
  const wallet = new ethers.Wallet(TEST_PRIVATE_KEY);
  let authCookie: string;

  beforeEach(async () => {
    users.length = 0;

    // Get nonce and login
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

  describe('GET /api/auth/me', () => {
    it('should return user data for authenticated user', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.user).toHaveProperty('walletAddress', wallet.address);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    it('should return 401 for invalid session cookie', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'invalid-cookie')
        .expect(401);
    });
  });

  describe('Session Management', () => {
    it('should maintain user session across multiple requests', async () => {
      // First request
      await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie)
        .expect(200);

      // Second request with same session
      await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie)
        .expect(200);
    });

    it('should invalidate session after logout', async () => {
      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Cookie', authCookie)
        .expect(200);

      // Try to access protected route
      await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie)
        .expect(401);
    });
  });
});
