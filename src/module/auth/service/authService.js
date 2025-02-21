const bcrypt = require('bcrypt');
const Auth = require('../entity/authEntity');

module.exports = class AuthService {
  /**
   * @param {import('../repository/authRepository')} authRepository
   */
  constructor(authRepository) {
    this.authRepository = authRepository;
  }

  /**
   * @param {string} username
   * @param {string} password
   * @returns {Promise<Auth>}
   */
  async registerClient(username, password) {
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const newAuth = new Auth(null, username, passwordHash, 'client');
      return await this.authRepository.save(newAuth);
    } catch (error) {
      throw new Error('Error registering client.');
    }
  }

  /**
   * @param {string} username
   * @param {string} password
   * @returns {Promise<Auth | null>}
   */
  async authenticate(username, password) {
    try {
      const authData = await this.authRepository.getByUsername(username);
      if (!authData) return null;

      const isPasswordValid = await bcrypt.compare(password, authData.passwordHash);
      return isPasswordValid ? authData : null;
    } catch (error) {
      throw new Error('Error during authentication.');
    }
  }
};
