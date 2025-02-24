import { createUser, findUserByWalletAddress, updateUserNonce, updateLastLogin, users } from '../../src/models/user';

describe('User Model', () => {
  beforeEach(() => {
    // Clear the users array
    users.length = 0;
  });

  describe('createUser', () => {
    it('should create a new user with correct properties', async () => {
      const walletAddress = '0x123';
      const user = await createUser(walletAddress);

      expect(user.walletAddress).toBe(walletAddress);
      expect(user.nonce).toBeDefined();
      expect(typeof user.nonce).toBe('string');
      expect(user.lastLogin).toBeUndefined();
    });
  });

  describe('findUserByWalletAddress', () => {
    it('should find an existing user', async () => {
      const walletAddress = '0x123';
      const createdUser = await createUser(walletAddress);
      const foundUser = findUserByWalletAddress(walletAddress);

      expect(foundUser).toBe(createdUser);
    });

    it('should return undefined for non-existent user', () => {
      const foundUser = findUserByWalletAddress('0x999');
      expect(foundUser).toBeUndefined();
    });
  });

  describe('updateUserNonce', () => {
    it('should update user nonce', async () => {
      const walletAddress = '0x123';
      const user = await createUser(walletAddress);
      const oldNonce = user.nonce;

      const newNonce = await updateUserNonce(user);

      expect(newNonce).not.toBe(oldNonce);
      expect(user.nonce).toBe(newNonce);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      const walletAddress = '0x123';
      const user = await createUser(walletAddress);
      expect(user.lastLogin).toBeUndefined();

      updateLastLogin(user);

      expect(user.lastLogin).toBeInstanceOf(Date);
    });
  });
}); 