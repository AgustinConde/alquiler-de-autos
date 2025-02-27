const { formToEntity } = require('../mapper/rentalMapper');
const { RentalIdNotDefinedError } = require('../error/RentalError');
const { isAuthenticated, isAdmin } = require('../../auth/middleware/authMiddleware');

module.exports = class RentalController {
  /**
   * @param {import('../service/rentalService')} RentalService
   */
  constructor(RentalService) {
    this.RentalService = RentalService;
    this.ROUTE_BASE = '/profile/rentals';
    this.RENTAL_VIEWS = 'pages/rental/views';
    this.ADMIN_ROUTE = '/manage/rentals';
  }

  /**
   * @param {import('express').Application} app
   */
  configureRoutes(app) {
    const ROUTE = this.ADMIN_ROUTE;
    // Public routes
    app.get(this.ROUTE_BASE, isAuthenticated, this.manage.bind(this));
    app.get(`${this.ROUTE_BASE}/view/:rentalId`, isAuthenticated, this.view.bind(this));
    app.get(`${this.ROUTE_BASE}/edit/:rentalId`, isAuthenticated, this.edit.bind(this));
    app.get(`${this.ROUTE_BASE}/add`, isAuthenticated, this.add.bind(this));
    app.post(`${this.ROUTE_BASE}/save`, isAuthenticated, this.save.bind(this));

    // Admin routes
    app.get(`${ROUTE}`, isAdmin, this.adminIndex.bind(this));
    app.get(`${ROUTE}/:id/edit`, isAdmin, this.edit.bind(this));
    app.post(`${ROUTE}/:id/edit`, isAdmin, this.update.bind(this));
    app.post(`${ROUTE}/:id/delete`, isAdmin, this.delete.bind(this));
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async manage(req, res) {
    try {
      const rentals = await this.RentalService.getRentalById(req.user.id);
      res.render(`${this.RENTAL_VIEWS}/view.njk`, {
        title: 'My Rentals',
        rentals
      });
    } catch (error) {
      req.flash('error', 'Error loading rentals');
      res.redirect('/');
    }
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
    async adminIndex(req, res) {
      try {
        const rentals = await this.RentalService.getAll();
        res.render('pages/manage/rentals/index.njk', {
          title: 'Manage Rentals',
          rentals
        });
      } catch (error) {
        req.flash('error', 'Error loading rentals');
        res.redirect('/');
      }
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
  async add(req, res) {
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


  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async update(req, res) {
    try {
      await this.RentalService.update(req.params.id, req.body);
      req.flash('success', 'Rental updated successfully');
      res.redirect(this.ADMIN_ROUTE);
    } catch (error) {
      req.flash('error', error.message);
      res.redirect(`${this.ADMIN_ROUTE}/${req.params.id}/edit`);
    }
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async delete(req, res) {
    try {
      await this.RentalService.delete(req.params.id);
      req.flash('success', 'Rental deleted successfully');
      res.redirect(this.ADMIN_ROUTE);
    } catch (error) {
      req.flash('error', 'Error deleting rental');
      res.redirect(this.ADMIN_ROUTE);
    }
  }
};
