const { ClientNotDefinedError, ClientIdNotDefinedError } = require('../error/clientError');
const Client = require('../entity/Client');

module.exports = class ClientService {
  /**
   * @param {import('../repository/clientRepository')} clientRepository
   */
  constructor(clientRepository) {
    this.ClientRepository = clientRepository;
  }

  /**
   * @param {import('../entity/Client')} client
   */
  async save(client) {
    if (!(client instanceof Client)) {
      throw new ClientNotDefinedError();
    }
    return this.ClientRepository.save(client);
  }

  async getAll() {
    return this.ClientRepository.getAllClients();
  }

  /**
   * @param {number} clientId
   */
  async getClientById(clientId) {
    if (!Number(clientId)) {
      throw new ClientIdNotDefinedError();
    }
    return this.ClientRepository.getClientById(clientId);
  }
};
