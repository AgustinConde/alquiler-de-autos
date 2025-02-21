const AuthModel = require('../model/authModel');
const Auth = require('../entity/authEntity');

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
    try {
      const createdAuth = await this.authModel.create(auth);
      return new Auth(
        createdAuth.id,
        createdAuth.username,
        createdAuth.passwordHash,
        createdAuth.role
      );
    } catch (error) {
      throw new Error('Error saving authentication data.');
    }
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
};
