const { ClientNotDefinedError, ClientIdNotDefinedError } = require('../error/clientError');
const Client = require('../entity/Client');

class ClientService {
  /**
   * @param {import('../repository/clientRepository')} clientRepository
   * @param {import('../../audit/service/auditService')} auditService
   */
  constructor(clientRepository, auditService) {
    this.clientRepository = clientRepository;
    this.auditService = auditService;
  }

  /**
   * @param {import('../entity/Client')} client
   */
  async save(client) {
    if (!(client instanceof Client)) {
      throw new ClientNotDefinedError();
    }
    return this.clientRepository.save(client);
  }

  async getAll() {
    return this.clientRepository.getAll();
  }

  async update(clientId, updateData) {
    if (!Number(clientId)) {
        throw new ClientIdNotDefinedError();
    }
    
    return this.clientRepository.update(clientId, updateData);
}

  /**
   * @param {number} clientId
   */
  async getClientById(clientId) {
    if (!Number(clientId)) {
      throw new ClientIdNotDefinedError();
    }
    return this.clientRepository.getClientById(clientId);
  }

  async delete(id) {
    const client = await Client.findByPk(id, {
      include: [{ model: Rental }]
    });

    if (!client) throw new Error('Client not found');

    if (client.Rentals.length > 0) {
      await this.auditService.createAuditLog(
        'client',
        id,
        'delete',
        client.toJSON()
      );
    }

    await client.destroy();
  }

  async restore(clientId) {
    if (!Number(clientId)) {
      throw new ClientIdNotDefinedError();
    }
    return this.clientRepository.restore(clientId);
  }
}

module.exports = ClientService;
