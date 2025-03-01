const { formToEntity } = require('../mapper/rentalMapper');
const { RentalIdNotDefinedError } = require('../error/RentalError');
const { isAuthenticated, isAdmin } = require('../../auth/middleware/authMiddleware');
const { isPaid } = require('../entity/RentalIsPaid');

module.exports = class RentalController {
  /**
   * @param {import('../service/rentalService')} RentalService
   * @param {import('../../car/service/carService')} CarService
   * @param {import('../../client/service/clientService')} ClientService
   */
  constructor(RentalService, CarService, ClientService) {
    this.RentalService = RentalService;
    this.CarService = CarService;
    this.ClientService = ClientService;
    this.ROUTE_BASE = '/profile/rentals';
    this.RENTAL_VIEWS = 'pages/rental/';
    this.ADMIN_ROUTE = '/manage/rentals';
  }

  /**
   * @param {import('express').Application} app
   */
  configureRoutes(app) {
    const ROUTE = this.ADMIN_ROUTE;
    
    // Public routes
    app.get(this.ROUTE_BASE, isAuthenticated, this.clientRentals.bind(this));
    app.get(`${this.ROUTE_BASE}/view/:rentalId`, isAuthenticated, this.view.bind(this));
    app.get('/rent/:carId', isAuthenticated, this.new.bind(this));
    app.post('/rent/:carId', isAuthenticated, this.create.bind(this));
    app.post(`${this.ROUTE_BASE}/cancel/:id`, isAuthenticated, this.cancelRental.bind(this));
    

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
    try {
      const { rentalId } = req.params;
      if (!Number(rentalId)) {
        throw new RentalIdNotDefinedError();
      }
  
      const rental = await this.RentalService.getRentalById(rentalId);
      
      const from = req.query.from || 'profile';
      console.log(`📍 Vista de alquiler accedida desde: ${from}`);
  
      res.render(`${this.RENTAL_VIEWS}view.njk`, {
        title: `Viewing Rental #${rental.id}`,
        rental,
        isAdmin: req.session.role === 'admin',
        from: from
      });
    } catch (error) {
      console.error('❌ Error viewing rental:', error);
      req.flash('error', error.message);
      res.redirect(this.ROUTE_BASE);
    }
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async edit(req, res) {
    try {
      const rentalId = req.params.id || req.params.rentalId;
      
      if (!Number(rentalId)) {
        throw new RentalIdNotDefinedError();
      }
  
      const rental = await this.RentalService.getRentalById(rentalId);
      res.render(`${this.RENTAL_VIEWS}edit.njk`, {
        title: `Editing Rental #${rental.id}`,
        rental,
      });
    } catch (error) {
      console.error('❌ Error editing rental:', error);
      req.flash('error', error.message);
      res.redirect(this.ADMIN_ROUTE);
    }
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
async new(req, res) {
  try {
    const carId = req.params.carId;
    
    const car = await this.CarService.getCarById(carId);
    if (!car) {
      req.flash('error', 'Car not found');
      return res.redirect('/');
    }
    
    const client = await this.ClientService.getClientById(req.session.clientId);
    

    const currentDate = new Date().toISOString().split('T')[0];
    
    res.render('pages/rental/create.njk', {
      title: 'Rent a Car',
      car,
      client,
      currentDate
    });
  } catch (error) {
    console.error('❌ Error loading rental form:', error);
    req.flash('error', error.message);
    res.redirect('/');
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async create(req, res) {
  try {
    const carId = req.params.carId;
    const clientId = req.session.clientId;
    
    const car = await this.CarService.getCarById(carId);
    if (!car) {
      req.flash('error', 'Car not found');
      return res.redirect('/');
    }
    
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      req.flash('error', 'Invalid dates');
      return res.redirect(`/rent/${carId}`);
    }
    
    if (end <= start) {
      req.flash('error', 'End date must be after start date');
      return res.redirect(`/rent/${carId}`);
    }
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalPrice = car.pricePerDay * diffDays;
    
    const rentalData = {
      rentedCar: carId,
      rentedTo: clientId,
      pricePerDay: car.pricePerDay,
      rentalStart: startDate,
      rentalEnd: endDate,
      totalPrice,
      paymentMethod: req.body.paymentMethod,
      paymentProgress: isPaid.PENDING,
    };
    
    const rental = await this.RentalService.saveRental(rentalData);
    
    req.flash('success', 'Car rented successfully');
    res.redirect(`${this.ROUTE_BASE}/view/${rental.id}`);
  } catch (error) {
    console.error('❌ Error creating rental:', error);
    req.flash('error', error.message);
    res.redirect(`/rent/${req.params.carId}`);
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
    console.error('❌ Error deleting rental:', error);
    req.flash('error', `Error deleting rental: ${error.message}`);
    res.redirect(this.ADMIN_ROUTE);
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async clientRentals(req, res) {
  try {
    const clientId = req.session.clientId;
    if (!clientId) {
      req.flash('error', 'You must be logged in to view your rentals');
      return res.redirect('/auth/login');
    }

    const rentals = await this.RentalService.getRentalsByClientId(clientId);
    
    res.render('pages/rental/client-rentals.njk', {
      title: 'My Rentals',
      rentals
    });
  } catch (error) {
    console.error('❌ Error loading client rentals:', error);
    req.flash('error', error.message);
    res.redirect('/');
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async cancelRental(req, res) {
  try {
    const rentalId = req.params.id;
    const clientId = req.session.clientId;
    
    if (!clientId) {
      req.flash('error', 'You must be logged in to cancel a rental');
      return res.redirect('/auth/login');
    }

    const result = await this.RentalService.cancelRental(rentalId, clientId);
    
    req.flash('success', result.message);
    res.redirect('/profile/rentals');
  } catch (error) {
    console.error('❌ Error cancelling rental:', error);
    req.flash('error', error.message);
    res.redirect('/profile/rentals');
  }
}
};
