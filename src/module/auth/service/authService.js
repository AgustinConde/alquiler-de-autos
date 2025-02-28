const bcrypt = require('bcrypt');

module.exports = class AuthService {
  constructor(authRepository, clientRepository) {
    this.authRepository = authRepository;
    this.clientRepository = clientRepository;
  }

  /**
   * @param {String} email
   * @param {String} password
   */
  async login(email, password) {
    try {
      console.log('🔐 Authenticating user:', email);
      
      const auth = await this.authRepository.getByUsername(email);
      
      if (!auth) {
        console.log('❌ Auth not found for:', email);
        throw new Error('Invalid credentials');
      }
      
      const isValid = await bcrypt.compare(password, auth.passwordHash);
      if (!isValid) {
        console.log('❌ Invalid password for:', email);
        throw new Error('Invalid credentials');
      }

      let client;
      if (!auth.clientId) {
        console.log('⚠️ Auth record missing clientId, falling back to email search');
        client = await this.clientRepository.getByEmail(email);
      } else {
        client = await this.clientRepository.getClientById(auth.clientId);
      }
      
      if (!client) {
        console.log('❌ No client found for user:', email);
        throw new Error('User account not found');
      }
      
      console.log('✅ Login successful for:', email);
      return { auth, client };
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

    /**
   * @param {Object} clientData
   */
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

    /**
   * @param {Number} clientId
   */
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

  /**
   * @param {Number} clientId
   */
  async getAuthByClientId(clientId) {
    return this.authRepository.getAuthByClientId(clientId);
  }

  /**
   * @param {Number} clientId
   * @param {Object} updateData
   */
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

  /**
   * @param {Number} clientId
   * @param {String} role
   */ 
  async updateRole(clientId, role) {
    const client = await this.clientRepository.getClientById(clientId);
    
    if (!client) {
        throw new Error('Client not found');
    }
    
    await this.clientRepository.update(clientId, { role });
    return client;
}


  /**
    * @param {Number} clientId
    * @param {String} currentPassword
    * @param {String} newPassword
   */
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
