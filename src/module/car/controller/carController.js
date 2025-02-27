const { formToEntity } = require('../mapper/carMapper');
const { CarIdNotDefinedError } = require('../error/carError');
const { isAuthenticated, isAdmin } = require('../../auth/middleware/authMiddleware');
const upload = require('../../../middleware/uploadMiddleware');

module.exports = class CarController {
  /**
   * @param {import('../service/carService')} carService 
   */
  constructor(carService) {
    this.carService = carService;
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

  async show(req, res) {
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

  async adminIndex(req, res) {
    try {
      const cars = await this.carService.getAllCars();
      res.render('pages/manage/cars/index.njk', {
        title: 'Manage Cars',
        cars
      });
    } catch (error) {
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
      }
      
      const carData = {
        ...req.body,
        colour: req.body.color,
        image: imageUrl
      };
      
      const car = formToEntity(carData);
      await this.carService.save(car);
      
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
      
      const carData = {
        ...req.body,
        id,
        colour: req.body.color,
        image: existingCar.image
      };
      
      if (req.file) {
        carData.image = `/uploads/${req.file.filename}`;
      }
      
      const car = formToEntity(carData);
      await this.carService.save(car);
      
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

  async save(req, res) {
    const car = formToEntity(req.body);
    if (req.file) {
      const path = req.file.path.split('public')[1];
      car.img = path;
    }
    await this.carService.save(car);
    res.redirect(this.ROUTE_BASE);
  }
};
