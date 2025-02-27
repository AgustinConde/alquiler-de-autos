const ClientController = require('./controller/clientController');
const ClientService = require('./service/clientService');
const ClientRepository = require('./repository/clientRepository');
const ClientModel = require('./model/clientModel');

/**
 * @param {import('express').Application} app
 * @param {import('rsdi').IDIContainer} container
 */
function initClientModule(app, container) {
  /**
   * @type {ClientController} controller
   */
    const controller = container.get('ClientController');
    controller.configureRoutes(app);
}

module.exports = {
    initClientModule,
    ClientController,
    ClientService,
    ClientRepository,
    ClientModel
};
