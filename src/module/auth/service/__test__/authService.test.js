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
    test('should throw error when auth exists but client profile is not found', async () => {
      const mockAuth = {
        id: 1,
        username: 'test@example.com',
        passwordHash: 'hashed_password',
        clientId: 1
      };
      
      mockAuthRepository.getByUsername.mockResolvedValue(mockAuth);
      mockClientRepository.getClientById.mockResolvedValue(null);
      
      await expect(authService.login('test@example.com', 'correct_password'))
        .rejects
        .toThrow('User account not found');
    });

    test('should throw error when auth record is not found', async () => {
      mockAuthRepository.getByUsername.mockResolvedValue(null);
      
      await expect(authService.login('nonexistent@example.com', 'any-password'))
        .rejects
        .toThrow('Invalid credentials');
        
      expect(mockAuthRepository.getByUsername).toHaveBeenCalledWith('nonexistent@example.com');
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

    test('should fall back to email search when auth has no clientId', async () => {
      const mockAuth = {
        id: 1,
        username: 'test@example.com',
        passwordHash: 'hashed_password',
        clientId: null  // No clientId
      };
      
      const mockClient = {
        id: 2,
        name: 'Test',
        surname: 'User',
        email: 'test@example.com'
      };
      
      mockAuthRepository.getByUsername.mockResolvedValue(mockAuth);
      mockClientRepository.getByEmail = jest.fn().mockResolvedValue(mockClient);
      
      const result = await authService.login('test@example.com', 'correct_password');
      
      expect(mockClientRepository.getByEmail).toHaveBeenCalledWith('test@example.com');
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

  describe('getClientProfile', () => {
    test('should return client profile', async () => {
      const clientId = 1;
      const mockClient = {
        id: clientId,
        name: 'Test',
        email: 'test@example.com'
      };
      
      mockClientRepository.getClientById.mockResolvedValue(mockClient);
      
      const result = await authService.getClientProfile(clientId);
      
      expect(result).toEqual(mockClient);
    });
    
    test('should throw error when client is not found', async () => {
      const clientId = 999;
      
      mockClientRepository.getClientById.mockResolvedValue(null);
      
      await expect(authService.getClientProfile(clientId))
        .rejects
        .toThrow('Client not found');
    });
  });

  describe('updateProfile', () => {
    beforeEach(() => {
      mockClientRepository.update = jest.fn();
    });
    
    test('should update client profile', async () => {
      const clientId = 1;
      const updateData = {
        name: 'Updated Name',
        surname: 'Updated Surname',
        phone: '9876543210',
        address: 'Updated Address'
      };
      
      const existingClient = {
        id: clientId,
        name: 'Original Name',
        surname: 'Original Surname'
      };
      
      const updatedClient = {
        ...existingClient,
        ...updateData
      };
      
      mockClientRepository.getClientById.mockResolvedValue(existingClient);
      mockClientRepository.update.mockResolvedValue(updatedClient);
      
      const result = await authService.updateProfile(clientId, updateData);
      
      expect(result).toEqual(updatedClient);
    });
    
    test('should throw error when required fields are missing', async () => {
      const clientId = 1;
      const updateData = {
        name: 'Updated Name',
        // Missing surname, phone, and address
      };
      
      const existingClient = {
        id: clientId,
        name: 'Original Name',
        surname: 'Original Surname'
      };
      
      mockClientRepository.getClientById.mockResolvedValue(existingClient);
      
      await expect(authService.updateProfile(clientId, updateData))
        .rejects
        .toThrow('All fields are required');
    });

    test('should throw error when client does not exist for updateProfile', async () => {
      const clientId = 999;
      const updateData = {
        name: 'Updated Name',
        surname: 'Updated Surname',
        phone: '9876543210',
        address: 'Updated Address'
      };
      
      mockClientRepository.getClientById.mockResolvedValue(null);
      
      await expect(authService.updateProfile(clientId, updateData))
        .rejects
        .toThrow('Client not found');
        
      expect(mockClientRepository.getClientById).toHaveBeenCalledWith(clientId);
      expect(mockClientRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('updateRole', () => {
    beforeEach(() => {
      mockClientRepository.update = jest.fn();
    });
    
    test('should update user role', async () => {
      const clientId = 1;
      const role = 'admin';
      
      const existingClient = {
        id: clientId,
        name: 'Test User',
        role: 'client'
      };
      
      mockClientRepository.getClientById.mockResolvedValue(existingClient);
      mockClientRepository.update.mockResolvedValue({...existingClient, role});
      
      const result = await authService.updateRole(clientId, role);
      
      expect(result).toEqual(existingClient);
    });

    test('should throw error when client does not exist for updateRole', async () => {
      const clientId = 999;
      const role = 'admin';
      
      mockClientRepository.getClientById.mockResolvedValue(null);
      
      await expect(authService.updateRole(clientId, role))
        .rejects
        .toThrow('Client not found');
        
      expect(mockClientRepository.getClientById).toHaveBeenCalledWith(clientId);
      expect(mockClientRepository.update).not.toHaveBeenCalled();
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

    test('should throw error when auth record is not found', async () => {
      const clientId = 999;
      const currentPassword = 'oldPassword';
      const newPassword = 'NewPassword123';
      
      mockAuthRepository.getAuthByClientId.mockResolvedValue(null);
      
      await expect(authService.changePassword(clientId, currentPassword, newPassword))
        .rejects
        .toThrow('Authentication not found');
    });
  });

  describe('getAuthByClientId', () => {
    test('should return auth by client id', async () => {
      const clientId = 1;
      const mockAuth = {
        id: 1,
        clientId: clientId
      };
      
      mockAuthRepository.getAuthByClientId.mockResolvedValue(mockAuth);
      
      const result = await authService.getAuthByClientId(clientId);
      
      expect(result).toEqual(mockAuth);
    });
  });
});