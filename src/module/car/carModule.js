const CarController = require('./controller/carController');
const CarService = require('./service/carService');
const CarRepository = require('./repository/carRepository');
const CarModel = require('./model/carModel');

function initCarModule(app, container) {
    /**
   * @type {CarController} controller
   */
    const controller = container.get('CarController');
    controller.configureRoutes(app);
}

module.exports = {
    initCarModule,
    CarController,
    CarService,
    CarRepository,
    CarModel
};
