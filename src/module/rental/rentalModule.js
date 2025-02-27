const RentalController = require('./controller/rentalController');
const RentalService = require('./service/rentalService');
const RentalRepository = require('./repository/rentalRepository');
const RentalModel = require('./model/rentalModel');

function initRentalModule(app, container) {
      /**
   * @type {RentalController} controller
   */
    const controller = container.get('RentalController');
    controller.configureRoutes(app);
}

module.exports = {
    initRentalModule,
    RentalController,
    RentalService,
    RentalRepository,
    RentalModel
};