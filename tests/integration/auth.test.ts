import request from 'supertest';
import { ethers } from 'ethers';
import app from '../../src/app';
import { users } from '../../src/models/user';

describe('Authentication Routes', () => {
  const TEST_PRIVATE_KEY = '0123456789012345678901234567890123456789012345678901234567890123';
  const wallet = new ethers.Wallet(TEST_PRIVATE_KEY);
  let sessionCookie: string;
  const testWalletAddress = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    users.length = 0;
  });

  describe('GET /api/auth/nonce/:walletAddress', () => {
    it('should return different nonce for same wallet address', async () => {
      const response1 = await request(app)
        .get(`/api/auth/nonce/${testWalletAddress}`)
        .expect(200);

      await new Promise(resolve => setTimeout(resolve, 2));

      const response2 = await request(app)
        .get(`/api/auth/nonce/${testWalletAddress}`)
        .expect(200);

      expect(response1.body.nonce).not.toBe(response2.body.nonce);
    });

    it('should create a new user if wallet address does not exist', async () => {
      const response = await request(app)
        .get(`/api/auth/nonce/${testWalletAddress}`)
        .expect(200);

      expect(response.body.nonce).toBeDefined();
      const user = users.find(u => u.walletAddress === testWalletAddress);
      expect(user).toBeDefined();
      expect(user?.nonce).toBe(response.body.nonce);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if nonce is not found', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          walletAddress: testWalletAddress,
          signature: 'invalid-signature'
        })
        .expect(400);
    });

    it('should return 401 if signature is invalid', async () => {
      // First get a nonce
      await request(app)
        .get(`/api/auth/nonce/${testWalletAddress}`)
        .expect(200);

      await request(app)
        .post('/api/auth/login')
        .send({
          walletAddress: testWalletAddress,
          signature: 'invalid-signature'
        })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 if not authenticated', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return 401 if not authenticated', async () => {
      await request(app)
        .post('/api/auth/logout')
        .expect(401);
    });

    it('should successfully logout authenticated user', async () => {
      // First login
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

      const cookie = loginResponse.header['set-cookie'][0];

      // Then logout
      await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookie)
        .expect(200);

      // Verify session is cleared
      await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookie)
        .expect(401);
    });
  });
}); 