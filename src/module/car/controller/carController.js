const { formToEntity } = require('../mapper/carMapper');
const { CarIdNotDefinedError } = require('../error/carError');
const { isAdmin, isAuthenticated } = require('../../auth/middleware/authMiddleware');

module.exports = class CarController {
  /**
   * @param {import('../service/carService')} carService
   */
  constructor(carService, uploadMiddleware) {
    this.carService = carService;
    this.uploadMiddleware = uploadMiddleware;
    this.ROUTE_BASE = '/car';
    this.CAR_VIEWS = 'car/views';
  }

  /**
   * @param {import('express').Application} app
   */
  configureRoutes(app) {
    const ROUTE = this.ROUTE_BASE;
    app.get(`${ROUTE}`, this.index.bind(this));
    app.get(`${ROUTE}/manage`, isAdmin, this.manage.bind(this));
    app.get(`${ROUTE}/:carId`, isAuthenticated, this.viewInfo.bind(this));
    app.get(`${ROUTE}/edit/:carId`, isAdmin, this.edit.bind(this));
    app.get(`${ROUTE}/add`, isAdmin, this.addCar.bind(this));
    app.post(`${ROUTE}/save`, isAdmin, this.uploadMiddleware.single('car-photo'), this.save.bind(this));
    app.post(`${ROUTE}/delete/:carId`, isAdmin, this.delete.bind(this));
  }

  async index(req, res) {
    const carsLength = await this.carService.getCarsLength();
    let lastCar;
    try {
      lastCar = await this.carService.getLastCar();
    } catch (e) {
      lastCar = null;
    } finally {
      res.render(`${this.CAR_VIEWS}/index.njk`, {
        title: 'Rent a Car',
        carsLength,
        lastCar,
      });
    }
  }

  async manage(req, res) {
    const cars = await this.carService.getAllCars();
    res.render(`${this.CAR_VIEWS}/manage.njk`, {
      title: 'Car List',
      cars,
    });
  }

  async viewInfo(req, res, next) {
    try {
      const { carId } = req.params;
      if (!Number(carId)) {
        throw new CarIdNotDefinedError();
      }

      const car = await this.carService.getById(carId);
      res.render(`${this.CAR_VIEWS}/view.njk`, {
        title: `${car.brand} ${car.model} ${car.year} info`,
        car,
        rentals: car.rentals,
      });
    } catch (e) {
      next(e)
    }
  }

  async edit(req, res) {
    const { carId } = req.params;
    if (!Number(carId)) {
      throw new CarIdNotDefinedError();
    }

    const car = await this.carService.getCarById(carId);
    res.render(`${this.CAR_VIEWS}/edit.njk`, {
      title: `Editing ${car.brand} ${car.model} #${car.id}`,
      car,
    });
  }

  addCar(req, res) {
    res.render(`${this.CAR_VIEWS}/add.njk`, {
      title: 'Add New Car',
    });
  }

  async save(req, res) {
    const car = formToEntity(req.body);
    if (req.file) {
      const path = req.file.path.split('public')[1];
      car.img = path;
    }
    await this.carService.save(car);
    res.redirect(this.ROUTE_BASE);
  }

  async delete(req, res) {
    const { carId } = req.params;
    const car = await this.carService.getCarById(carId);
    this.carService.delete(car);
    res.redirect(this.ROUTE_BASE);
  }
};
