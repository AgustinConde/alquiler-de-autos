const { modelToEntity } = require('../mapper/clientMapper');
const { ClientNotDefinedError, ClientIdNotDefinedError, ClientNotFoundError } = require('../error/clientError');
const Client = require('../entity/Client');
const RentalModel = require('../../rental/model/rentalModel');


module.exports = class ClientRepository {
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
    if (!(client instanceof Client)) {
      throw new ClientNotDefinedError();
    }

    const clientInstance = this.clientModel.build(client, {
      isNewRecord: !client.id,
    });
    await clientInstance.save();
    return modelToEntity(clientInstance);
  }

  async getAllClients() {
    const clients = await this.clientModel.findAll();
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
};
