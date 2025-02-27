const bcrypt = require('bcrypt');

module.exports = class AuthService {
  constructor(authRepository, clientRepository) {
    this.authRepository = authRepository;
    this.clientRepository = clientRepository;
  }

  async login(email, password) {
    try {
      const auth = await this.authRepository.getByEmail(email);
      
      if (!auth) {
        console.log('❌ No auth found with email:', email);
        throw new Error('Invalid credentials');
      }

      const isValid = await bcrypt.compare(password, auth.passwordHash);
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      return auth;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  async register(clientData) {
    try {
      const existingAuth = await this.authRepository.getByEmail(clientData.email);
      if (existingAuth) {
        throw new Error('Email already registered');
      }

      const client = await this.clientRepository.save({
        name: clientData.name,
        surname: clientData.surname,
        idType: clientData.idType,
        idNumber: clientData.idNumber,
        nationality: clientData.nationality,
        address: clientData.address,
        phone: clientData.phone,
        email: clientData.email,
        password: clientData.password,
        birthDate: clientData.birthDate
      });

      const passwordHash = await bcrypt.hash(clientData.password, 10);
      
      const savedAuth = await this.authRepository.save({
        username: clientData.email,
        passwordHash,
        role: 'client',
        clientId: client.id
      });
      
      console.log('✨ New auth saved:', savedAuth);
      return savedAuth;
    } catch (error) {
      console.error('❌ Error in register service:', error);
      throw error;
    }
  }

  async getClientProfile(clientId) {
    try {
      const client = await this.clientRepository.getClientById(clientId);
      
      if (!client) {
        console.log('❌ No client found with ID:', clientId);
        throw new Error('Client not found');
      }

      return client;
    } catch (error) {
      console.error('❌ Error getting client profile:', error);
      throw error;
    }
  }

  async updateProfile(clientId, updateData) {
    const client = await this.clientRepository.getClientById(clientId);
    
    if (!client) {
        throw new Error('Client not found');
    }

    if (!updateData.name || !updateData.surname || !updateData.phone || !updateData.address) {
        throw new Error('All fields are required');
    }

    const updatedClient = await this.clientRepository.update(clientId, updateData);
    return updatedClient;
  }

  async changePassword(clientId, currentPassword, newPassword) {
    const auth = await this.authRepository.getAuthByClientId(clientId);
    
    if (!auth) {
      throw new Error('Authentication not found');
    }
    
    const isValid = await auth.validatePassword(currentPassword);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }
    
    auth.password = newPassword;
    await this.authRepository.save(auth);
    return auth;
  }
}
