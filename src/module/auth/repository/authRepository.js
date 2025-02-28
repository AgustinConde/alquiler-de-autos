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


    /**
   * @param {number} id
   * @param {Object} data
   */
    async update(id, data) {
      try {
        const auth = await this.authModel.findByPk(id);
        if (!auth) {
          throw new Error(`Auth record with ID ${id} not found`);
        }
        
        await auth.update(data);
        
        return new Auth(
          auth.id, 
          auth.username, 
          auth.passwordHash, 
          auth.role
        );
      } catch (error) {
        console.error('❌ Error updating auth:', error);
        throw error;
      }
    }
};
