const { formToEntity } = require('../mapper/rentalMapper');
const { RentalIdNotDefinedError } = require('../error/RentalError');
const { isAuthenticated, isAdmin } = require('../../auth/middleware/authMiddleware');
const { isPaid } = require('../entity/RentalIsPaid');

module.exports = class RentalController {
  /**
   * @param {import('../service/rentalService')} RentalService
   * @param {import('../../car/service/carService')} CarService
   * @param {import('../../client/service/clientService')} ClientService
   * @param {import('../../audit/service/auditService')} AuditService
   */
  constructor(RentalService, CarService, ClientService, AuditService) {
    this.RentalService = RentalService;
    this.CarService = CarService;
    this.ClientService = ClientService;
    this.AuditService = AuditService;
    this.ROUTE_BASE = '/profile/rentals';
    this.RENTAL_VIEWS = '/pages/rental';
    this.ADMIN_ROUTE = '/manage/rentals';
  }

  /**
   * @param {import('express').Application} app
   */
  configureRoutes(app) {
    const ROUTE = this.ADMIN_ROUTE;
    
    // Public routes
    app.get(this.ROUTE_BASE, isAuthenticated, this.getClientRentals.bind(this));
    app.get(`${this.ROUTE_BASE}/view/:rentalId`, isAuthenticated, this.view.bind(this));
    app.get('/rent/:carId', isAuthenticated, this.new.bind(this));
    app.post('/rent/:carId', isAuthenticated, this.create.bind(this));
    app.post(`${this.ROUTE_BASE}/cancel/:id`, isAuthenticated, this.cancel.bind(this));
    app.get(`${this.ROUTE_BASE}/edit/:rentalId`, isAuthenticated, this.edit.bind(this));

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

      const viewPath = req.path.startsWith('/manage') ? 
      'pages/manage/rentals/view.njk' : 
      'pages/rental/view.njk';
  
      res.render(viewPath, {
        title: `Viewing Rental #${rental.id}`,
        rental,
        isAdmin: req.session.userRole === 'admin',
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
      
      const isAdminRoute = req.path.startsWith('/manage');
      const viewPath = isAdminRoute 
        ? 'pages/manage/rentals/edit.njk' 
        : `${this.RENTAL_VIEWS}/edit.njk`;
      
      res.render(viewPath, {
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
    async update(req, res) {
      try {
        console.log('📋 Form data received:', req.body);
        
        const rentalId = req.params.id;
        const existingRental = await this.RentalService.getRentalById(rentalId);
        const previousState = {
          id: existingRental.id,
          client: existingRental.client ? {
            id: existingRental.client.id,
            name: existingRental.client.name,
            surname: existingRental.client.surname || '',
            email: existingRental.client.email
          } : null,
          car: existingRental.car ? {
            id: existingRental.car.id,
            brand: existingRental.car.brand,
            model: existingRental.car.model,
            year: existingRental.car.year
          } : null,
          pricePerDay: existingRental.pricePerDay,
          rentalStart: existingRental.rentalStart,
          rentalEnd: existingRental.rentalEnd,
          totalPrice: existingRental.totalPrice,
          paymentProgress: {
            name: existingRental.paymentProgress.name,
            value: existingRental.paymentProgress.value
          }
        };
        
        await this.RentalService.update(rentalId, req.body);
        const updatedRental = await this.RentalService.getRentalById(rentalId);

        const currentState = {
          id: updatedRental.id,
          client: updatedRental.client ? {
            id: updatedRental.client.id,
            name: updatedRental.client.name,
            surname: updatedRental.client.surname || '',
            email: updatedRental.client.email
          } : null,
          car: updatedRental.car ? {
            id: updatedRental.car.id,
            brand: updatedRental.car.brand,
            model: updatedRental.car.model,
            year: updatedRental.car.year
          } : null,
          pricePerDay: updatedRental.pricePerDay,
          rentalStart: updatedRental.rentalStart,
          rentalEnd: updatedRental.rentalEnd,
          totalPrice: updatedRental.totalPrice,
          paymentProgress: {
            name: updatedRental.paymentProgress.name,
            value: updatedRental.paymentProgress.value
          }
        };        
        console.log('🔄 Rental updated successfully');
        console.log('📊 Previous state:', previousState.paymentProgress);
        console.log('📊 Current state:', updatedRental.paymentProgress);
        
        try {
          await this.AuditService.createAuditLog(
            'rental',
            rentalId,
            'update',
            {
              previous: previousState,
              current: currentState
            },
            {
              id: req.session.clientId,
              email: req.session.email || req.session.auth?.username
            }
          );
          console.log('✅ Audit log created for rental update');
        } catch (auditError) {
          console.error('❌ Error creating audit log:', auditError);
        }
    
        req.flash('success', 'Rental updated successfully');
        res.redirect(this.ADMIN_ROUTE);
      } catch (error) {
        console.error('❌ Error updating rental:', error);
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
    const rentalId = req.params.id;
    
    const rental = await this.RentalService.getRentalById(rentalId);
    if (!rental) {
      throw new Error('Rental not found');
    }
    
    try {
      await this.AuditService.createAuditLog(
        'rental',
        rentalId,
        'delete',
        rental,
        {
          id: req.session.clientId,
          email: req.session.email || req.session.auth?.username
        }
      );
      console.log('✅ Audit log created for rental deletion');
    } catch (auditError) {
      console.error('❌ Error creating audit log:', auditError);
    }

    await this.RentalService.delete(rentalId);
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
async getClientRentals(req, res) {
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
async cancel(req, res) {
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
