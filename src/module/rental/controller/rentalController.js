const { formToEntity } = require('../mapper/rentalMapper');
const { isPaid: RentalIsPaid } = require('../entity/RentalIsPaid');
const { RentalError, RentalIdNotDefinedError } = require('../error/RentalError');

module.exports = class rentalController {
  /**
   * @param {import('../service/rentalService')} rentalService
   * @param {import('../../car/service/carService')} carService
   * @param {import('../../user/service/clientService')} clientService
   */
  constructor(rentalService, carService, clientService) {
    this.rentalService = rentalService;
    this.carService = carService;
    this.clientService = clientService;
    this.ROUTE_BASE = '/rentals';
    this.RESERVATION_VIEWS = 'reservation/views';
  }

  /**
   * @param {import('express').Application} app
   */
  configureRoutes(app) {
    const ROUTE = this.ROUTE_BASE;
    app.get(`${ROUTE}/manage`, this.manage.bind(this));
    app.get(`${ROUTE}/view/:rentalId`, this.view.bind(this));
    app.get(`${ROUTE}/edit/:rentalId`, this.edit.bind(this));
    app.get(`${ROUTE}/add`, this.add.bind(this));
    app.post(`${ROUTE}/save`, this.save.bind(this));
    app.post(`${ROUTE}/pay/:rentalId`, this.pay.bind(this));
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async manage(req, res) {
    const rentals = await this.rentalService.getAllRentals();
    res.render(`${this.RESERVATION_VIEWS}/manage.njk`, {
      title: 'Rental List',
      rentals,
      isPaid
    });
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async view(req, res) {
    const { rentalId } = req.params;
    if (!Number(rentalId)) {
      throw new RentalIdNotDefinedError();
    }

    const rental = await this.rentalService.getRentalById(rentalId);
    res.render(`${this.RESERVATION_VIEWS}/view.njk`, {
      title: `Viewing Rental #${rental.id}`,
      rental
    });
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async edit(req, res) {
    const { rentalId } = req.params;
    if (!Number(rentalId)) {
      throw new RentalIdNotDefinedError();
    }
    const cars = await this.carService.getAllCars();
    const clients = await this.clientService.getAllClients();

    const rental = await this.rentalService.getRentalById(rentalId);
    res.render(`${this.RESERVATION_VIEWS}/edit.njk`, {
      title: `Editing Rental #${rental.id}`,
      rental,
      cars,
      clients,
    });
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async add(req, res, next) {
    try {
      const cars = await this.carService.getAllCars();
      const clients = await this.clientService.getAllClients();

      if (!cars.length) {
        throw new RentalError("No available cars for rent.");
      }

      if (!clients.length) {
        throw new RentalError("No available clients.");
      }

      res.render(`${this.RESERVATION_VIEWS}/add.njk`, {
        title: 'Add New Rental',
        cars,
        clients,
      });
    } catch (e) {
      next(e);
    }
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async save(req, res) {
    const formData = Object.assign({}, req.body);
    const { "car-id": carId, "client-id": clientId } = formData;
    formData.car = await this.carService.getById(carId);
    formData.client = await this.clientService.getById(clientId);
    formData.isPaid = formData.isPaid ? RentalIsPaid.PAID : RentalIsPaid.PENDING;

    const rental = formToEntity(formData);
    await this.rentalService.createRental(rental, formData.car);
    res.redirect(`${this.ROUTE_BASE}/manage`);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async pay(req, res) {
    const { rentalId } = req.params;
    if (!Number(rentalId)) {
      throw new RentalIdNotDefinedError();
    }

    const rental = await this.rentalService.getById(rentalId);
    await this.rentalService.pay(rental);
    res.redirect(`${this.ROUTE_BASE}/manage`);
  }
};
