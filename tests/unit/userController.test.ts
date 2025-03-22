import { findUserByWalletAddress, createUser, updateUserNonce, updateLastLogin, users } from '../../src/models/user';
import { updateProfile } from '../../src/controllers/userController';
import userService from '../../src/services/userService';

// Mock dependencies
jest.mock('../../src/services/userService', () => ({
  updateUserProfile: jest.fn()
}));

describe('User Controller', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: any;

  beforeEach(() => {
    // Clear users array before each test
    users.length = 0;

    // Setup mocks for the new updateProfile test
    mockRequest = {
      user: { id: 'user-123' },
      body: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    // Clear mock calls
    jest.clearAllMocks();
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

  // New tests for the updateProfile controller method
  describe('updateProfile', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      
      // Act
      await updateProfile(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
      expect(userService.updateUserProfile).not.toHaveBeenCalled();
    });

    it('should return 400 if request body fails validation', async () => {
      // Arrange
      mockRequest.body = {
        name: '', // Invalid empty name
        email: 'not-an-email', // Invalid email format
        monthlyIncome: -100 // Invalid negative income
      };
      
      // Act
      await updateProfile(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ 
          error: 'Invalid request data',
          details: expect.any(Array)
        })
      );
    });

    it('should return 404 if user is not found', async () => {
      // Arrange
      mockRequest.body = {
        name: 'New Name'
      };
      
      const error: any = new Error('User not found');
      error.code = 'NOT_FOUND';
      (userService.updateUserProfile as jest.Mock).mockRejectedValue(error);
      
      // Act
      await updateProfile(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User not found'
      });
    });

    it('should successfully update user profile', async () => {
      // Arrange
      mockRequest.body = {
        name: 'Updated Name',
        monthlyIncome: 6000
      };
      
      const updatedUser = {
        id: 'user-123',
        name: 'Updated Name',
        email: 'test@example.com',
        monthlyIncome: 6000,
        emailVerified: true
      };
      
      (userService.updateUserProfile as jest.Mock).mockResolvedValue({
        user: updatedUser
      });
      
      // Act
      await updateProfile(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(userService.updateUserProfile).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          name: 'Updated Name',
          monthlyIncome: 6000
        })
      );
      
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    });

    it('should handle errors and pass them to the next middleware', async () => {
      // Arrange
      mockRequest.body = {
        name: 'Updated Name'
      };
      
      const error = new Error('Database error');
      (userService.updateUserProfile as jest.Mock).mockRejectedValue(error);
      
      // Act
      await updateProfile(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should update email and mark it as unverified', async () => {
      // Arrange
      mockRequest.body = {
        email: 'new@example.com'
      };
      
      const updatedUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'new@example.com',
        monthlyIncome: 5000,
        emailVerified: false
      };
      
      (userService.updateUserProfile as jest.Mock).mockResolvedValue({
        user: updatedUser
      });
      
      // Act
      await updateProfile(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(userService.updateUserProfile).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          email: 'new@example.com'
        })
      );
      
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            email: 'new@example.com',
            emailVerified: false
          })
        })
      );
    });

    it('should update multiple profile fields at once', async () => {
      // Arrange
      mockRequest.body = {
        name: 'New Name',
        email: 'new@example.com',
        monthlyIncome: 7500
      };
      
      const updatedUser = {
        id: 'user-123',
        name: 'New Name',
        email: 'new@example.com',
        monthlyIncome: 7500,
        emailVerified: false
      };
      
      (userService.updateUserProfile as jest.Mock).mockResolvedValue({
        user: updatedUser
      });
      
      // Act
      await updateProfile(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(userService.updateUserProfile).toHaveBeenCalledWith(
        'user-123',
        {
          name: 'New Name',
          email: 'new@example.com',
          monthlyIncome: 7500
        }
      );
    });
  });
});