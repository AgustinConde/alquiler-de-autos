module.exports = class Auth {
    /**
     * @param {number} id
     * @param {string} username
     * @param {string} passwordHash
     * @param {string} role
     */
    constructor(
      id, 
      username, 
      passwordHash, 
      role = 'client'
    ) {
      this.id = id;
      this.username = username;
      this.passwordHash = passwordHash;
      this.role = role;
    }
  };
