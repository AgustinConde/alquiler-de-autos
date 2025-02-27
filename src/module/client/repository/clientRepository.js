const { modelToEntity } = require('../mapper/clientMapper');
const { ClientNotDefinedError, ClientIdNotDefinedError, ClientNotFoundError } = require('../error/clientError');
const Client = require('../entity/Client');
const RentalModel = require('../../rental/model/rentalModel');


class ClientRepository {
  /**
   * @param {typeof import('../model/clientModel')} clientModel
   */
  constructor(clientModel) {
    this.clientModel = clientModel;
  }

  /**
   * @param {import('../entity/Client')} client
   */
  async save(client) {
    try {
      console.log('📦 Saving client data:', client);
      const clientInstance = await this.clientModel.create(client);
      console.log('✅ Client instance created:', clientInstance.toJSON());
      return clientInstance.toJSON();
    } catch (error) {
      console.error('❌ Error saving client:', error);
      throw error;
    }
  }

  async getAllClients() {
    const clients = await this.clientModel.findAll({
      include: [
          {
              association: 'Auth',
              attributes: ['role']
          }
      ],
      order: [['id', 'ASC']]
  });
    return clients.map(modelToEntity);
  }

  /**
   * @param {number} clientId
   */
  async getClientById(clientId) {
    if (!Number(clientId)) {
      throw new clientIdNotDefinedError();
    }
    const client = await this.clientModel.findByPk(clientId, { include: RentalModel });
    if (!client) {
      throw new ClientNotFoundError(`There is no existing client with ID ${clientId}`);
    }

    return modelToEntity(client);
  }

  /**
   * @param {import('../entity/Client')} client
   * @returns {Promise<Boolean>}
   */

  async delete(client) {
    if (!(client instanceof Client)) {
      throw new ClientNotDefinedError();
    }

    await BackupRepository.backupByClientId(client.id);

    const deleted = await this.clientModel.destroy({ where: { id: client.id } });

    return Boolean(deleted);
  }

  async getByEmail(email) {
    return this.clientModel.findOne({ 
      where: { 
        email,
        deletedAt: null 
      } 
    });
  }

  async getAll() {
    return this.clientModel.findAll();
  }

  /**
   * @param {number} clientId
   * @param {Object} updateData
   */
  async update(clientId, updateData) {
    if (!Number(clientId)) {
      throw new ClientIdNotDefinedError();
    }

    const client = await this.clientModel.findByPk(clientId);
    if (!client) {
      throw new ClientNotFoundError(`There is no existing client with ID ${clientId}`);
    }

    await client.update(updateData);
    return client.toJSON();
  }

  async getClientById(id) {
    return this.clientModel.findByPk(id);
  }
}

module.exports = ClientRepository;