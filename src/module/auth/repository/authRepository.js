const AuthModel = require('../model/authModel');
const Auth = require('../entity/Auth');

module.exports = class AuthRepository {
  /**
   * @param {typeof AuthModel} authModel
   */
  constructor(authModel) {
    this.authModel = authModel;
  }

  /**
   * @param {Auth} auth
   * @returns {Promise<Auth>}
   */
  async save(auth) {
    return this.authModel.create(auth);
  }

  /**
   * @param {string} username
   * @returns {Promise<Auth | null>}
   */
  async getByUsername(username) {
    try {
      const authData = await this.authModel.findOne({ where: { username } });
      if (!authData) return null;

      return new Auth(authData.id, authData.username, authData.passwordHash, authData.role);
    } catch (error) {
      throw new Error('Error retrieving authentication data.');
    }
  }

  /**
   * @param {string} email
   * @returns {Promise<Auth | null>}
   */
  async getByEmail(email) {
    return this.authModel.findOne({ 
      where: { 
        username: email,
        deletedAt: null 
      } 
    });
  }
};
