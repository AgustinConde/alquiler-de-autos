const { formToEntity } = require('../mapper/carMapper');
const { CarIdNotDefinedError } = require('../error/carError');
const { isAuthenticated, isAdmin } = require('../../auth/middleware/authMiddleware');
const upload = require('../../../middleware/uploadMiddleware');

module.exports = class CarController {
  /**
   * @param {import('../service/carService')} carService 
   * @param {import('../../audit/service/auditService')} auditService
   */
  constructor(carService, auditService) {
    this.carService = carService;
    this.auditService = auditService;
    this.ROUTE_BASE = '/cars';
    this.ADMIN_ROUTE = '/manage/cars';
    this.CAR_VIEWS = 'car/views';
  }

  /**
   * @param {import('express').Application} app
   */
  configureRoutes(app) {
    // Public routes
    app.get(this.ROUTE_BASE, this.index.bind(this));
    app.get(`${this.ROUTE_BASE}/:id`, this.show.bind(this));
    
    // Admin routes
    app.get(this.ADMIN_ROUTE, isAdmin, this.adminIndex.bind(this));
    app.get(`${this.ADMIN_ROUTE}/create`, isAdmin, this.create.bind(this));
    app.post(`${this.ADMIN_ROUTE}/create`, isAdmin, upload.single('image'), this.store.bind(this));
    app.get(`${this.ADMIN_ROUTE}/:id/edit`, isAdmin, this.edit.bind(this));
    app.post(`${this.ADMIN_ROUTE}/:id/edit`, isAdmin, upload.single('image'), this.update.bind(this));
    app.post(`${this.ADMIN_ROUTE}/:id/delete`, isAdmin, this.delete.bind(this));
    app.post(`${this.ADMIN_ROUTE}/:id/restore`, isAdmin, this.restore.bind(this));
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

  async show(req, res, next) {
    try {
      const id = req.params.id;
      if (!Number(id)) {
        throw new CarIdNotDefinedError();
      }

      const car = await this.carService.getById(id);
      res.render(`${this.CAR_VIEWS}/view.njk`, {
        title: `${car.brand} ${car.model} ${car.year} info`,
        car,
        rentals: car.rentals,
      });
    } catch (e) {
      next(e);
    }
  }

  async adminIndex(req, res) {
    try {
      const showDeleted = req.query.showDeleted === 'true';

      const cars = showDeleted
      ? await this.carService.getUnfilteredCars() 
      : await this.carService.getAllCars();

      res.render('pages/manage/cars/index.njk', {
        title: 'Manage Cars',
        cars,
        showDeleted
      });
    } catch (error) {
      console.error('❌ Error loading cars:', error);
      req.flash('error', 'Error loading cars');
      res.redirect('/');
    }
  }

  async create(req, res) {
    res.render('pages/manage/cars/create.njk', {
      title: 'Add New Car'
    });
  }

  async store(req, res) {
    try {
      console.log('📝 Creating new car');
      console.log('📂 File:', req.file);
      
      let imageUrl = null;
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
        console.log('✅ Image uploaded, URL:', imageUrl);
      } else {
        imageUrl = '/uploads/default_car.jpg';
      }
      
      const carData = {
        ...req.body,
        color: req.body.color,
        image: imageUrl
      };
      
      const car = formToEntity(carData);
      const savedCar = await this.carService.save(car);

      await this.auditService.createAuditLog(
        'car', 
        savedCar.id, 
        'create', 
        savedCar, 
        {
          id: req.session.clientId,
          email: req.session.auth?.username || req.session.email
        }
      );
      
      req.flash('success', 'Car added successfully');
      res.redirect(this.ADMIN_ROUTE);
    } catch (error) {
      console.error('❌ Error creating car:', error);
      req.flash('error', error.message || 'Error creating car');
      res.redirect(`${this.ADMIN_ROUTE}/create`);
    }
  }

  async edit(req, res) {
    try {
      const { id } = req.params;
      const car = await this.carService.getCarById(id);
      
      res.render('pages/manage/cars/edit.njk', {
        title: 'Edit Car',
        car
      });
    } catch (error) {
      req.flash('error', error.message);
      res.redirect(this.ADMIN_ROUTE);
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const existingCar = await this.carService.getCarById(id);
      
      const previousState = { ...existingCar };

      const carData = {
        ...req.body,
        id,
        color: req.body.color,
        image: existingCar.image
      };
      
      if (req.file) {
        carData.image = `/uploads/${req.file.filename}`;
      } else if (!existingCar.image) {
        carData.image = '/uploads/default_car.jpg';
      }
      
      const car = formToEntity(carData);
      await this.carService.save(car);

      const auditService = req.app.get('container').get('AuditService');
      await auditService.createAuditLog(
        'car',
        car.id,
        'update',
        {
          previous: previousState,
          current: car
        },
        {
          id: req.session.clientId,
          email: req.session.auth?.username || req.session.email
        }
      );
      
      req.flash('success', 'Car updated successfully');
      res.redirect(this.ADMIN_ROUTE);
    } catch (error) {
      console.error('❌ Error updating car:', error);
      req.flash('error', error.message);
      res.redirect(`${this.ADMIN_ROUTE}/${req.params.id}/edit`);
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await this.carService.delete(id);
      
      req.flash('success', 'Car deleted successfully');
      res.redirect(this.ADMIN_ROUTE);
    } catch (error) {
      req.flash('error', error.message);
      res.redirect(this.ADMIN_ROUTE);
    }
  }

  async restore(req, res) {
    try {
      const { id } = req.params;
      const car = await this.carService.restore(id);
      const auditService = req.app.get('container').get('AuditService');
      await auditService.createAuditLog(
        'car',
        id,
        'restore',
        car,
        {
          id: req.session.clientId,
          email: req.session.auth?.username || req.session.email
        }
      );

      req.flash('success', 'Car restored successfully');
      res.redirect(this.ADMIN_ROUTE);
    } catch (error) {
      console.error('❌ Error restoring car:', error);
      req.flash('error', error.message || 'Error restoring car');
      res.redirect(this.ADMIN_ROUTE);
    }
  }
};
