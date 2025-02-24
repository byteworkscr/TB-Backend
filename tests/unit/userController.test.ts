import { findUserByWalletAddress, createUser, updateUserNonce, updateLastLogin, users } from '../../src/models/user';

describe('User Controller', () => {
  beforeEach(() => {
    // Clear users array before each test
    users.length = 0;
  });

  describe('findUserByWalletAddress', () => {
    it('should return undefined for non-existent wallet address', () => {
      const result = findUserByWalletAddress('0x123');
      expect(result).toBeUndefined();
    });

    it('should find user by wallet address', async () => {
      const walletAddress = '0x123';
      const user = await createUser(walletAddress);
      const result = findUserByWalletAddress(walletAddress);
      expect(result).toBe(user);
    });
  });

  describe('createUser', () => {
    it('should create a new user with correct properties', async () => {
      const walletAddress = '0x123';
      const user = await createUser(walletAddress);

      expect(user).toHaveProperty('walletAddress', walletAddress);
      expect(user).toHaveProperty('nonce');
      expect(user).toHaveProperty('createdAt');
      expect(user.lastLogin).toBeUndefined();
      expect(users).toContain(user);
    });

    it('should generate unique nonce for each user', async () => {
      const user1 = await createUser('0x123');
      const user2 = await createUser('0x456');
      expect(user1.nonce).not.toBe(user2.nonce);
    });
  });

  describe('updateUserNonce', () => {
    it('should update user nonce to a new value', async () => {
      const user = await createUser('0x123');
      const oldNonce = user.nonce;
      
      const newNonce = await updateUserNonce(user);
      
      expect(newNonce).not.toBe(oldNonce);
      expect(user.nonce).toBe(newNonce);
    });

    it('should generate unique nonces on consecutive updates', async () => {
      const user = await createUser('0x123');
      const nonce1 = await updateUserNonce(user);
      const nonce2 = await updateUserNonce(user);
      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe('updateLastLogin', () => {
    it('should update lastLogin timestamp', async () => {
      const user = await createUser('0x123');
      expect(user.lastLogin).toBeUndefined();
      
      updateLastLogin(user);
      
      expect(user.lastLogin).toBeInstanceOf(Date);
    });

    it('should update lastLogin to a more recent time', async () => {
      const user = await createUser('0x123');
      updateLastLogin(user);
      const firstLogin = user.lastLogin;
      
      // Wait a small amount of time
      await new Promise(resolve => setTimeout(resolve, 1));
      
      updateLastLogin(user);
      expect(user.lastLogin!.getTime()).toBeGreaterThan(firstLogin!.getTime());
    });
  });
});
