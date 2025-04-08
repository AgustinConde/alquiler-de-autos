const AuthService = require('../../service/authService');
const { compare } = require('bcrypt');

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockImplementation(() => Promise.resolve('hashed_password')),
  compare: jest.fn().mockImplementation((password, hash) => Promise.resolve(password === 'correct_password'))
}));

describe('AuthService', () => {
  const mockAuthRepository = {
    save: jest.fn(),
    getByUsername: jest.fn(),
    getById: jest.fn(),
    getByEmail: jest.fn(),
    getAuthByClientId: jest.fn()
  };
  
  const mockClientRepository = {
    save: jest.fn(),
    getClientById: jest.fn()
  };
  
  let authService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(mockAuthRepository, mockClientRepository);
  });
  
  describe('login', () => {
    test('should throw error when user is not found', async () => {
      mockAuthRepository.getByUsername.mockResolvedValue(null);
      
      await expect(authService.login('unknown@example.com', 'password'))
        .rejects
        .toThrow('Invalid credentials');
    });
    
    test('should throw error when password is incorrect', async () => {
      mockAuthRepository.getByUsername.mockResolvedValue({
        id: 1,
        username: 'test@example.com',
        password: 'hashed_password',
        clientId: 1
      });
      
      await expect(authService.login('test@example.com', 'wrong_password'))
        .rejects
        .toThrow('Invalid credentials');
    });
    
    test('should return auth and client info when credentials are valid', async () => {
      const mockAuth = {
        id: 1,
        username: 'test@example.com',
        password: 'hashed_password',
        clientId: 1
      };
      
      const mockClient = {
        id: 1,
        name: 'Test',
        surname: 'User',
        email: 'test@example.com',
        role: 'client'
      };
      
      mockAuthRepository.getByUsername.mockResolvedValue(mockAuth);
      mockClientRepository.getClientById.mockResolvedValue(mockClient);
      
      const result = await authService.login('test@example.com', 'correct_password');
      
      expect(result).toEqual({
        auth: mockAuth,
        client: mockClient
      });
    });
  });
  
  describe('register', () => {
    test('should register new user and return auth info', async () => {
      const clientData = {
        name: 'Test',
        surname: 'User',
        email: 'test@example.com',
        phone: '1234567890',
        idType: 'DNI',
        idNumber: '12345678',
        address: 'Test Address',
        birthDate: '1990-01-01',
        nationality: 'Test Country',
        password: 'Password123'
      };
      
      
      const savedClient = { id: 1, ...clientData };
      const savedAuth = { id: 1, username: clientData.email, passwordHash: 'hashed_password', clientId: 1 };
      
      mockClientRepository.save.mockResolvedValue(savedClient);
      mockAuthRepository.save.mockResolvedValue(savedAuth);
      
      const result = await authService.register(clientData);
      
      expect(mockClientRepository.save).toHaveBeenCalled();
      expect(mockAuthRepository.save).toHaveBeenCalled();
      expect(result).toEqual(savedAuth);
    });

    test('should throw error when password does not meet requirements', async () => {
      const clientData = {
        name: 'Test',
        surname: 'User',
        email: 'test@example.com',
        phone: '1234567890',
        idType: 'DNI',
        idNumber: '12345678',
        address: 'Test Address',
        birthDate: '1990-01-01',
        nationality: 'Test Country',
        password: 'weak'
      };
      
      await expect(authService.register(clientData))
        .rejects
        .toThrow('Password must be at least 8 characters long');
    });
    
    test('should throw error when email already exists', async () => {
      const clientData = {
        name: 'Test',
        surname: 'User',
        email: 'existing@example.com',
        phone: '1234567890',
        idType: 'DNI',
        idNumber: '12345678',
        address: 'Test Address',
        birthDate: '1990-01-01',
        nationality: 'Test Country',
        password: 'Password123'
      };
      
      mockAuthRepository.getByEmail.mockResolvedValue({ 
        id: 1, 
        email: clientData.email 
      });
      
      await expect(authService.register(clientData))
        .rejects
        .toThrow('Email already registered');
    });


  });

  describe('changePassword', () => {
    test('should change password successfully', async () => {
      const authId = 1;
      const clientId = 1;
      const currentPassword = 'oldPassword';
      const newPassword = 'NewPassword123';
      
      const mockAuth = { 
        id: authId, 
        username: 'test@example.com',
        passwordHash: 'hashed_old_password',
        validatePassword: jest.fn().mockResolvedValue(true)
      };

      mockAuthRepository.getAuthByClientId.mockResolvedValue(mockAuth);
      mockAuthRepository.save.mockResolvedValue({ ...mockAuth, passwordHash: 'hashed_new_password' });
    
      await authService.changePassword(clientId, currentPassword, newPassword);
      
      expect(mockAuthRepository.getAuthByClientId).toHaveBeenCalledWith(clientId);
      expect(mockAuth.validatePassword).toHaveBeenCalledWith(currentPassword);
      expect(mockAuthRepository.save).toHaveBeenCalled();
    });
    
    test('should throw error when current password is incorrect', async () => {
      const authId = 1;
      const clientId = 1;
      const currentPassword = 'wrongPassword';
      const newPassword = 'NewPassword123';
      
      const mockAuth = { 
        id: authId, 
        username: 'test@example.com',
        passwordHash: 'hashed_old_password',
        validatePassword: jest.fn().mockResolvedValue(false)
      };
      
      mockAuthRepository.getAuthByClientId.mockResolvedValue(mockAuth);
    
      await expect(authService.changePassword(clientId, currentPassword, newPassword))
        .rejects
        .toThrow('Current password is incorrect');
    });
  });
});