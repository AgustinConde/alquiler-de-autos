jest.mock('../../../car/entity/Car', () => {
  return function Car(id, brand, model, year, mileage, color, ac, capacity, transmission, pricePerDay, image, createdAt, updatedAt, deletedAt, rentals) {
    return { id, brand, model, year, mileage, color, ac, capacity, transmission, pricePerDay, image, createdAt, updatedAt, deletedAt, rentals };
  };
});

jest.mock('../../mapper/carMapper', () => ({
  formToEntity: jest.fn(carData => carData)
}));

const request = require('supertest');
const express = require('express');
const path = require('path');
const CarController = require('../carController');
const Car = require('../../../car/entity/Car');
const { CarIdNotDefinedError } = require('../../../car/error/carError');

jest.setTimeout(60000);

const mockCarService = {
  getAllCars: jest.fn(),
  getCarById: jest.fn(),
  getById: jest.fn(),
  getCarsLength: jest.fn(),
  getLastCar: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  restore: jest.fn(),
  getUnfilteredCars: jest.fn(),
  getUnfilteredCarById: jest.fn()
};

const mockAuditService = {
  createAuditLog: jest.fn().mockResolvedValue({}),
};

const isAdmin = (req, res, next) => next();
const isAuthenticated = (req, res, next) => next();

jest.mock('../../../auth/middleware/authMiddleware', () => ({
  isAuthenticated: (req, res, next) => next(),
  isAdmin: (req, res, next) => next(),
}));

const mockUpload = {
  single: () => (req, res, next) => {
    if (req.mockFile) {
      req.file = req.mockFile;
    }
    next();
  }
};

jest.mock('../../../../middleware/uploadMiddleware', () => ({
  single: (field) => (req, res, next) => {
    if (req.mockFile) {
      req.file = req.mockFile;
    }
    next();
  }
}));

describe('CarController', () => {
  let app;
  let carController;
  let mockFlash;
  
  beforeEach(() => {
    app = express();
    
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    app.set('views', [
        path.join(__dirname, '../../../../views'),
        path.join(__dirname, '../../../car/views'),
        path.join(__dirname, '../../../../')
      ]);
    app.set('view engine', 'njk');
    app.engine('njk', (filePath, options, callback) => {
      callback(null, 'Rendered template');
    });
    
    app.response.render = function(view, options, callback) {
      if (typeof callback === 'function') {
        callback(null, 'Rendered template');
      } else {
        this.send('Rendered template');
      }
    };
    
    mockFlash = jest.fn();
    
    const mockContainer = {
      get: jest.fn(() => mockAuditService)
    };
    
    const originalGet = app.get;
    app.get = function(key) {
      if (key === 'container') {
        return mockContainer;
      }
      return originalGet.apply(this, arguments);
    };
    
    app.use((req, res, next) => {
      req.session = {
        clientId: 1,
        auth: { id: 1, username: 'test@example.com' },
        email: 'test@example.com'
      };
      req.flash = mockFlash;
      req.app = app;
      next();
    });

    mockCarService.getAllCars.mockResolvedValue([]);
    mockCarService.getCarById.mockResolvedValue(new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []));
    mockCarService.getById.mockResolvedValue(new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []));
    mockCarService.getCarsLength.mockResolvedValue(0);
    mockCarService.getLastCar.mockResolvedValue(new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []));
    mockCarService.getUnfilteredCars.mockResolvedValue([]);
    mockCarService.getUnfilteredCarById.mockResolvedValue(new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []));
    mockCarService.save.mockResolvedValue(new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []));
    mockCarService.delete.mockResolvedValue({});
    mockCarService.restore.mockResolvedValue(new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []));
    
    carController = new CarController(mockCarService, mockAuditService);
    carController.CAR_VIEWS = 'car/views';
    
    app.get('/cars', carController.index.bind(carController));
    app.get('/cars/:id', carController.show.bind(carController));
    app.get('/manage/cars', carController.adminIndex.bind(carController));
    app.get('/manage/cars/create', carController.create.bind(carController));
    app.post('/manage/cars/create', mockUpload.single('image'), carController.store.bind(carController));
    app.get('/manage/cars/:id/edit', carController.edit.bind(carController));
    app.post('/manage/cars/:id/edit', mockUpload.single('image'), carController.update.bind(carController));
    app.post('/manage/cars/:id/delete', carController.delete.bind(carController));
    app.post('/manage/cars/:id/restore', carController.restore.bind(carController));
    
    app.use((err, req, res, next) => {
      res.status(500).send('Test Error: ' + err.message);
    });

    app.use((req, res) => {
      res.status(404).send('Not found');
    });

    jest.clearAllMocks();
  });

  describe('GET /cars', () => {
    test('should render index with cars', async () => {
      mockCarService.getCarsLength.mockResolvedValue(5);
      mockCarService.getLastCar.mockResolvedValue(new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []));
      
      const response = await request(app).get('/cars');
      
      expect(response.status).toBe(200);
      expect(mockCarService.getCarsLength).toHaveBeenCalled();
      expect(mockCarService.getLastCar).toHaveBeenCalled();
    });

    test('should render index without lastCar when getLastCar throws', async () => {
      mockCarService.getCarsLength.mockResolvedValue(5);
      mockCarService.getLastCar.mockRejectedValue(new Error('No cars available'));
      
      const response = await request(app).get('/cars');
      
      expect(response.status).toBe(200);
      expect(mockCarService.getCarsLength).toHaveBeenCalled();
      expect(mockCarService.getLastCar).toHaveBeenCalled();
    });
  });

  describe('GET /cars/:carId', () => {
    test('should render car details', async () => {
      const car = new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []);
      mockCarService.getById.mockResolvedValue(car);
      
      const response = await request(app).get('/cars/1');
      
      expect(response.status).toBe(200);
      expect(mockCarService.getById).toHaveBeenCalledWith('1');
    });
    
    test('should handle invalid car ID', async () => {
      const response = await request(app).get('/cars/invalid');
      
      expect(response.status).toBe(500);
      expect(response.text).toContain('Test Error');
    });
    
    test('should handle car not found', async () => {
      mockCarService.getById.mockRejectedValue(new Error('Car not found'));
      
      const response = await request(app).get('/cars/999');
      
      expect(response.status).toBe(500);
      expect(response.text).toContain('Car not found');
    });
  });

  describe('GET /manage/cars', () => {
    test('should render admin index with cars', async () => {
      const cars = [
        new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []),
        new Car(2, 'Honda', 'Civic', 2019, 15000, 'Blue', true, 5, 'automatic', 45, '/img/car2.jpg', new Date(), new Date(), null, [])
      ];
      mockCarService.getAllCars.mockResolvedValue(cars);
      
      const response = await request(app).get('/manage/cars');
      
      expect(response.status).toBe(200);
      expect(mockCarService.getAllCars).toHaveBeenCalled();
    });
    
    test('should show deleted cars when showDeleted is true', async () => {
      const cars = [
        new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), new Date(), []),
        new Car(2, 'Honda', 'Civic', 2019, 15000, 'Blue', true, 5, 'automatic', 45, '/img/car2.jpg', new Date(), new Date(), new Date(), [])
      ];
      mockCarService.getUnfilteredCars.mockResolvedValue(cars);
      
      const response = await request(app).get('/manage/cars?showDeleted=true');
      
      expect(response.status).toBe(200);
      expect(mockCarService.getUnfilteredCars).toHaveBeenCalled();
    });

    test('should handle error when loading cars fails', async () => {
      mockCarService.getAllCars.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/manage/cars');
      
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/');
      expect(mockFlash).toHaveBeenCalledWith('error', 'Error loading cars');
    });
  });

  describe('GET /manage/cars/create', () => {
    test('should render create form', async () => {
      const response = await request(app).get('/manage/cars/create');
      
      expect(response.status).toBe(200);
    });
  });

  describe('POST /manage/cars/create', () => {
    test('should create a new car and redirect to admin index', async () => {
      const newCar = new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/uploads/default_car.jpg', new Date(), new Date(), null, []);
      mockCarService.save.mockResolvedValue(newCar);
      
      const response = await request(app)
        .post('/manage/cars/create')
        .send({
          brand: 'Toyota',
          model: 'Corolla',
          year: 2020,
          mileage: 5000,
          color: 'Red',
          ac: 'on',
          transmission: 'automatic',
          capacity: 5,
          pricePerDay: 50
        });
      
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/manage/cars');
      expect(mockCarService.save).toHaveBeenCalled();
      expect(mockAuditService.createAuditLog).toHaveBeenCalled();
    });

    test('should create car with uploaded image', async () => {
      const newCar = new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/uploads/test-image.jpg', new Date(), new Date(), null, []);
      mockCarService.save.mockResolvedValue(newCar);
      
      const req = request(app)
        .post('/manage/cars/create')
        .send({
          brand: 'Toyota',
          model: 'Corolla',
          year: 2020,
          mileage: 5000,
          color: 'Red',
          ac: 'on',
          transmission: 'automatic',
          capacity: 5,
          pricePerDay: 50
        });
      
      req.mockFile = { filename: 'test-image.jpg' };
      
      const response = await req;
      
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/manage/cars');
    });
    
    test('should handle error when saving car fails', async () => {
      mockCarService.save.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .post('/manage/cars/create')
        .send({
          brand: 'Toyota',
          model: 'Corolla',
          year: 2020,
          mileage: 5000,
          color: 'Red',
          ac: 'on',
        });
      
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/manage/cars/create');
      expect(mockFlash).toHaveBeenCalled();
    });
  });

  describe('POST /manage/cars/:id/edit', () => {
    test('should update car with existing image', async () => {
      const existingCar = new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []);
      mockCarService.getCarById.mockResolvedValue(existingCar);
      mockCarService.save.mockResolvedValue({...existingCar, model: 'Corolla Updated'});
      
      const containerMock = { get: jest.fn().mockReturnValue(mockAuditService) };
      app.get = function(key) {
        if (key === 'container') {
          return containerMock;
        }
      };
      
      const response = await request(app)
        .post('/manage/cars/1/edit')
        .send({
          brand: 'Toyota',
          model: 'Corolla Updated',
          year: 2021,
          mileage: 6000,
          color: 'Blue',
          ac: 'on',
          transmission: 'automatic',
          capacity: 5,
          pricePerDay: 55
        });
      
      expect(response.status).toBe(302);
      expect(mockCarService.save).toHaveBeenCalled();
      expect(containerMock.get).toHaveBeenCalledWith('AuditService');
    });
    
    test('should update car with new image', async () => {
      mockCarService.save.mockResolvedValue({});
      const req = {
        params: { id: 1 },
        body: { brand: 'Toyota', model: 'Corolla Updated', year: 2021, mileage: 6000, color: 'Blue' },
        file: { filename: 'new-image.jpg' },
        session: { clientId: 1, auth: { username: 'test@example.com' } },
        flash: jest.fn(),
        app: { get: jest.fn(() => ({ get: jest.fn(() => ({ createAuditLog: jest.fn().mockResolvedValue({}) })) })) }
      };
      const res = { redirect: jest.fn() };
      await carController.update(req, res);
      expect(mockCarService.save).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/manage/cars');
    });

    test('should handle error and redirect to edit', async () => {
      mockCarService.getCarById.mockResolvedValue(new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []));
      mockCarService.save.mockRejectedValue(new Error('fail'));
      const req = {
        params: { id: 1 },
        body: { brand: 'Toyota', model: 'Corolla Updated', year: 2021, mileage: 6000, color: 'Blue' },
        session: { clientId: 1, auth: { username: 'test@example.com' } },
        flash: jest.fn(),
        app: { get: jest.fn(() => ({ get: jest.fn() })) }
      };
      const res = { redirect: jest.fn() };
      await carController.update(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/manage/cars/1/edit');
    });
  });

  describe('POST /manage/cars/:id/delete', () => {
    test('should delete a car successfully', async () => {
      mockCarService.delete.mockResolvedValue(true);
      
      const response = await request(app)
        .post('/manage/cars/1/delete');
      
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/manage/cars');
      expect(mockCarService.delete).toHaveBeenCalledWith('1');
      expect(mockFlash).toHaveBeenCalledWith('success', 'Car deleted successfully');
    });
    
    test('should handle errors when deleting a car', async () => {
      mockCarService.delete.mockRejectedValue(new Error('Car not found'));
      
      const response = await request(app)
        .post('/manage/cars/999/delete');
      
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/manage/cars');
      expect(mockFlash).toHaveBeenCalledWith('error', 'Car not found');
    });
  });

  describe('POST /manage/cars/:id/restore', () => {
    test('should restore a car successfully', async () => {
      const car = new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), new Date(), []);
      mockCarService.restore.mockResolvedValue(car);
      
      const containerMock = { get: jest.fn().mockReturnValue(mockAuditService) };
      app.get = function(key) {
        if (key === 'container') {
          return containerMock;
        }
      };
      
      const response = await request(app)
        .post('/manage/cars/1/restore');
      
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/manage/cars');
      expect(mockCarService.restore).toHaveBeenCalledWith('1');
      expect(containerMock.get).toHaveBeenCalledWith('AuditService');
      expect(mockAuditService.createAuditLog).toHaveBeenCalled();
    });
    
    test('should handle errors when restoring a car', async () => {
      mockCarService.restore.mockRejectedValue(new Error('Car not found'));
      
      const response = await request(app)
        .post('/manage/cars/999/restore');
      
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/manage/cars');
      expect(mockFlash).toHaveBeenCalledWith('error', 'Car not found');
    });
  });

  describe('configureRoutes', () => {
    test('should register all routes including restore', () => {
      const appMock = { get: jest.fn(), post: jest.fn() };
      carController.configureRoutes(appMock);
      expect(appMock.get).toHaveBeenCalledWith('/cars', expect.any(Function));
      expect(appMock.post).toHaveBeenCalledWith('/manage/cars/:id/restore', expect.any(Function), expect.any(Function));
    });
  });

  describe('store (image upload branches)', () => {
    test('should use uploaded image and log url', async () => {
      const newCar = new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/uploads/testfile.jpg', new Date(), new Date(), null, []);
      mockCarService.save.mockResolvedValue(newCar);
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const req = {
        body: { brand: 'Toyota', model: 'Corolla', year: 2020, mileage: 5000, color: 'Red', ac: 'on', transmission: 'automatic', capacity: 5, pricePerDay: 50 },
        file: { filename: 'testfile.jpg' },
        session: { clientId: 1, auth: { username: 'test@example.com' } },
        flash: jest.fn(),
        app: { get: jest.fn() }
      };
      const res = { redirect: jest.fn() };
      await carController.store(req, res);
      expect(logSpy).toHaveBeenCalledWith('✅ Image uploaded, URL:', '/uploads/testfile.jpg');
      expect(res.redirect).toHaveBeenCalledWith('/manage/cars');
      logSpy.mockRestore();
    });
  });

  describe('update (image upload branch)', () => {
    test('should update car with uploaded image', async () => {
      require('../../mapper/carMapper').formToEntity = jest.fn(carData => carData);
      mockCarService.save.mockImplementation(car => Promise.resolve(car));
      const existingCar = new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []);
      mockCarService.getCarById.mockResolvedValue(existingCar);
      const req = {
        params: { id: 1 },
        body: { brand: 'Toyota', model: 'Corolla Updated', year: 2021, mileage: 6000, color: 'Blue' },
        file: { filename: 'new-image.jpg' },
        session: { clientId: 1, auth: { username: 'test@example.com' } },
        flash: jest.fn(),
        app: { get: jest.fn(() => ({ get: jest.fn(() => ({ createAuditLog: jest.fn().mockResolvedValue({}) })) })) }
      };
      const res = { redirect: jest.fn() };
      await carController.update(req, res);
      expect(mockCarService.save).toHaveBeenCalled();
      const savedCar = mockCarService.save.mock.calls[0][0];
      expect(savedCar.image).toBe('/uploads/new-image.jpg');
      expect(res.redirect).toHaveBeenCalledWith('/manage/cars');
    });
  });
});

describe('CarController.edit (success branch)', () => {
  let carController;
  beforeEach(() => {
    carController = new CarController(mockCarService, mockAuditService);
  });

  test('should render edit page with car data if getCarById succeeds', async () => {
    const carObj = new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []);
    mockCarService.getCarById.mockResolvedValue(carObj);
    const req = { params: { id: 1 } };
    const res = { render: jest.fn() };
    await carController.edit(req, res);
    expect(res.render).toHaveBeenCalledWith('pages/manage/cars/edit.njk', {
      title: 'Edit Car',
      car: carObj
    });
  });

  test('should handle error and redirect to /manage/cars if getCarById throws', async () => {
    mockCarService.getCarById.mockRejectedValue(new Error('DB error'));
    const req = { params: { id: 1 }, flash: jest.fn() };
    const res = { redirect: jest.fn() };
    await carController.edit(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'DB error');
    expect(res.redirect).toHaveBeenCalledWith('/manage/cars');
  });
});

describe('CarController.update (default image branch)', () => {
  let carController;
  beforeEach(() => {
    carController = new CarController(mockCarService, mockAuditService);
    mockCarService.getCarById.mockReset();
    mockCarService.save.mockReset();
  });

  test('should assign default image if car has no image and no file is uploaded', async () => {
    const carObj = new Car(2, 'Honda', 'Civic', 2022, 1000, 'Black', true, 5, 'manual', 60, undefined, new Date(), new Date(), null, []);
    mockCarService.getCarById.mockResolvedValue(carObj);
    mockCarService.save.mockImplementation(car => Promise.resolve(car));
    const req = {
      params: { id: 2 },
      body: { brand: 'Honda', model: 'Civic', year: 2022, mileage: 1000, color: 'Black' },
      file: undefined,
      session: { clientId: 2, auth: { username: 'test2@email.com' } },
      flash: jest.fn(),
      app: { get: jest.fn(() => ({ get: jest.fn(() => ({ createAuditLog: jest.fn().mockResolvedValue({}) })) })) }
    };
    const res = { redirect: jest.fn() };
    await carController.update(req, res);
    expect(mockCarService.save).toHaveBeenCalled();
    const savedCar = mockCarService.save.mock.calls[0][0];
    expect(savedCar.image).toBe('/uploads/default_car.jpg');
    expect(res.redirect).toHaveBeenCalledWith('/manage/cars');
  });
});

describe('CarController.store and restore (branches for audit/email/error)', () => {
  let carController;
  beforeEach(() => {
    carController = new CarController(mockCarService, mockAuditService);
    jest.clearAllMocks();
  });

  test('store: should use req.session.auth.username if present', async () => {
    mockCarService.save.mockImplementation(car => Promise.resolve({ ...car, id: 123 }));
    mockAuditService.createAuditLog.mockResolvedValue({});
    const req = {
      body: { brand: 'Toyota', model: 'Corolla', year: 2020, mileage: 5000, color: 'Red' },
      file: { filename: 'car.jpg' },
      session: { clientId: 1, auth: { username: 'user@email.com' } },
      flash: jest.fn(),
      app: { get: jest.fn() }
    };
    const res = { redirect: jest.fn() };
    await carController.store(req, res);
    expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
      'car',
      123,
      'create',
      expect.anything(),
      { id: 1, email: 'user@email.com' }
    );
    expect(res.redirect).toHaveBeenCalledWith('/manage/cars');
  });

  test('store: should use req.session.email if req.session.auth is missing', async () => {
    mockCarService.save.mockImplementation(car => Promise.resolve({ ...car, id: 123 }));
    mockAuditService.createAuditLog.mockResolvedValue({});
    const req = {
      body: { brand: 'Toyota', model: 'Corolla', year: 2020, mileage: 5000, color: 'Red' },
      file: { filename: 'car.jpg' },
      session: { clientId: 1, email: 'fallback@email.com' },
      flash: jest.fn(),
      app: { get: jest.fn() }
    };
    const res = { redirect: jest.fn() };
    await carController.store(req, res);
    expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
      'car',
      123,
      'create',
      expect.anything(),
      { id: 1, email: 'fallback@email.com' }
    );
    expect(res.redirect).toHaveBeenCalledWith('/manage/cars');
  });

  test('store: should handle error and flash error message if auditService.createAuditLog fails', async () => {
    mockCarService.save.mockImplementation(car => Promise.resolve({ ...car, id: 123 }));
    mockAuditService.createAuditLog.mockRejectedValue(new Error('audit fail'));
    const req = {
      body: { brand: 'Toyota', model: 'Corolla', year: 2020, mileage: 5000, color: 'Red' },
      file: { filename: 'car.jpg' },
      session: { clientId: 1, auth: { username: 'user@email.com' } },
      flash: jest.fn(),
      app: { get: jest.fn() }
    };
    const res = { redirect: jest.fn() };
    await carController.store(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'audit fail');
    expect(res.redirect).toHaveBeenCalledWith('/manage/cars/create');
  });

  test('restore: should use req.session.auth.username if present', async () => {
    mockCarService.restore.mockResolvedValue({ id: 1, brand: 'Toyota' });
    mockAuditService.createAuditLog.mockResolvedValue({});
    const containerMock = { get: jest.fn().mockReturnValue(mockAuditService) };
    const req = {
      params: { id: 1 },
      session: { clientId: 1, auth: { username: 'user@email.com' } },
      flash: jest.fn(),
      app: { get: jest.fn((key) => key === 'container' ? containerMock : undefined) }
    };
    const res = { redirect: jest.fn() };
    await carController.restore(req, res);
    expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
      'car',
      1,
      'restore',
      { id: 1, brand: 'Toyota' },
      { id: 1, email: 'user@email.com' }
    );
    expect(res.redirect).toHaveBeenCalledWith('/manage/cars');
  });

  test('restore: should use req.session.email if req.session.auth is missing', async () => {
    mockCarService.restore.mockResolvedValue({ id: 1, brand: 'Toyota' });
    mockAuditService.createAuditLog.mockResolvedValue({});
    const containerMock = { get: jest.fn().mockReturnValue(mockAuditService) };
    const req = {
      params: { id: 1 },
      session: { clientId: 1, email: 'fallback@email.com' },
      flash: jest.fn(),
      app: { get: jest.fn((key) => key === 'container' ? containerMock : undefined) }
    };
    const res = { redirect: jest.fn() };
    await carController.restore(req, res);
    expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
      'car',
      1,
      'restore',
      { id: 1, brand: 'Toyota' },
      { id: 1, email: 'fallback@email.com' }
    );
    expect(res.redirect).toHaveBeenCalledWith('/manage/cars');
  });

  test('restore: should handle error and flash error message', async () => {
    mockCarService.restore.mockRejectedValue(new Error('restore fail'));
    const req = {
      params: { id: 1 },
      session: { clientId: 1, auth: { username: 'user@email.com' } },
      flash: jest.fn(),
      app: { get: jest.fn() }
    };
    const res = { redirect: jest.fn() };
    await carController.restore(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'restore fail');
    expect(res.redirect).toHaveBeenCalledWith('/manage/cars');
  });
});
