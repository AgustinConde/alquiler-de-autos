const { formToEntity } = require('../mapper/rentalMapper');
const { RentalIdNotDefinedError } = require('../error/rentalError');
const { isAuthenticated, isAdmin } = require('../../../utilities/authUtilities');

module.exports = class RentalController {
  /**
   * @param {import('../service/RentalService')} RentalService
   */
  constructor(RentalService) {
    this.RentalService = RentalService;
    this.ROUTE_BASE = '/rental';
    this.RENTAL_VIEWS = 'rental/views';
  }

  /**
   * @param {import('express').Application} app
   */
  configureRoutes(app) {
    const ROUTE = this.ROUTE_BASE;
    app.get(`${ROUTE}/manage`, isAuthenticated, isAdmin, this.manage.bind(this));
    app.get(`${ROUTE}/view/:rentalId`, isAuthenticated, this.view.bind(this));
    app.get(`${ROUTE}/edit/:rentalId`, isAuthenticated, isAdmin, this.edit.bind(this));
    app.get(`${ROUTE}/add`, isAuthenticated, isAdmin, this.add.bind(this));
    app.post(`${ROUTE}/save`, isAuthenticated, isAdmin, this.save.bind(this));
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async manage(req, res) {
    const rentals = await this.RentalService.getAllRentals();
    res.render(`${this.RENTAL_VIEWS}/manage.njk`, {
      title: 'Rental List',
      rentals,
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

    const rental = await this.RentalService.getRentalById(rentalId);
    res.render(`${this.RENTAL_VIEWS}/view.njk`, {
      title: `Viewing Rental #${rental.id}`,
      rental,
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

    const rental = await this.RentalService.getRentalById(rentalId);
    res.render(`${this.RENTAL_VIEWS}/edit.njk`, {
      title: `Editing Rental #${rental.id}`,
      rental,
    });
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  add(req, res) {
    res.render(`${this.RENTAL_VIEWS}/add.njk`, {
      title: 'Add New Rental',
    });
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async save(req, res) {
    const rental = formToEntity(req.body);
    await this.RentalService.save(rental);
    res.redirect(`${this.ROUTE_BASE}/manage`);
  }
};
