const request = require('supertest');
const express = require('express');
const path = require('path');
const { CarController } = require('../../../car/carModule');
const Car = require('../../../car/entity/Car');

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
  createAuditLog: jest.fn(),
};

jest.mock('../../../auth/middleware/authMiddleware', () => ({
  isAuthenticated: (req, res, next) => next(),
  isAdmin: (req, res, next) => next(),
}));

jest.mock('../../../../middleware/uploadMiddleware', () => ({
  single: () => (req, res, next) => next(),
}));

describe('CarController (Integration)', () => {
  let app;
  let carController;

  beforeEach(() => {
    app = express();
    
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    app.set('views', [
        path.join(__dirname, '../../../../views'),
        path.join(__dirname, '../../../car/views')
      ]);
    app.set('view engine', 'njk');
    app.engine('njk', (filePath, options, callback) => {
      callback(null, 'Rendered template');
    });
    
    const originalRender = app.response.render;
    app.response.render = function(view, options, callback) {
      console.log(`Rendering view: ${view}`);
      
      if (typeof callback === 'function') {
        callback(null, 'Rendered template');
      } else {
        this.send('Rendered template');
      }
    };
    
    app.use((req, res, next) => {
      req.session = {
        clientId: 1,
        auth: { id: 1, username: 'test@example.com' },
      };
      req.flash = jest.fn();
      next();
    });

    mockCarService.getAllCars.mockResolvedValue([]);
    mockCarService.getCarById.mockResolvedValue(new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []));
    mockCarService.getById.mockResolvedValue(new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []));
    mockCarService.getCarsLength.mockResolvedValue(0);
    mockCarService.getLastCar.mockResolvedValue(new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []));
    mockCarService.getUnfilteredCars.mockResolvedValue([]);
    mockCarService.getUnfilteredCarById.mockResolvedValue(new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []));
    
    carController = new CarController(mockCarService, mockAuditService);
    carController.CAR_VIEWS = 'pages';
    carController.configureRoutes(app);
    
    app.use((err, req, res, next) => {
        console.error('Express error handler:', err);
        res.status(500).send('Test Error: ' + err.message);
      });

    jest.clearAllMocks();
  });

  describe('GET /', () => {
    test('should render index with cars', async () => {
      mockCarService.getCarsLength.mockResolvedValue(5);
      mockCarService.getLastCar.mockResolvedValue(new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []));
      
      const response = await request(app).get('/cars');
      
      expect(response.status).toBe(200);
      expect(mockCarService.getCarsLength).toHaveBeenCalled();
      expect(mockCarService.getLastCar).toHaveBeenCalled();
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
  });
});