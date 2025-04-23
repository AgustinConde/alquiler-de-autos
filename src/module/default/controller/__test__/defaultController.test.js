const DefaultController = require('../defaultController');

describe('DefaultController', () => {
  let carService;
  let rentalService;
  let controller;

  beforeEach(() => {
    carService = { getAllCars: jest.fn() };
    rentalService = {};
    controller = new DefaultController(rentalService, carService);
  });

  test('should set ROUTE_BASE and services in constructor', () => {
    expect(controller.ROUTE_BASE).toBe('/');
    expect(controller.carService).toBe(carService);
    expect(controller.rentalService).toBe(rentalService);
  });

  test('index should render index.njk with cars on success', async () => {
    const cars = [{ id: 1 }, { id: 2 }];
    carService.getAllCars.mockResolvedValue(cars);
    const render = jest.fn();
    const res = { render };
    const req = {};
    await controller.index(req, res);
    expect(render).toHaveBeenCalledWith('default/views/index.njk', expect.objectContaining({ cars, title: 'Home' }));
  });

  test('index should render error.njk on error', async () => {
    carService.getAllCars.mockRejectedValue(new Error('fail'));
    const render = jest.fn();
    const status = jest.fn(() => ({ render }));
    const res = { status };
    const req = {};
    await controller.index(req, res);
    expect(status).toHaveBeenCalledWith(500);
    expect(render).toHaveBeenCalledWith('error.njk', expect.objectContaining({ error: expect.objectContaining({ message: 'Error loading homepage' }) }));
  });

  test('index should log the number of cars found', async () => {
    const cars = [{ id: 1 }, { id: 2 }, { id: 3 }];
    carService.getAllCars.mockResolvedValue(cars);
    const render = jest.fn();
    const res = { render };
    const req = {};
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await controller.index(req, res);
    expect(logSpy).toHaveBeenCalledWith('✅ Found 3 cars');
    logSpy.mockRestore();
  });

  test('index should log 0 cars if getAllCars returns undefined', async () => {
    carService.getAllCars.mockResolvedValue(undefined);
    const render = jest.fn();
    const res = { render };
    const req = {};
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await controller.index(req, res);
    expect(logSpy).toHaveBeenCalledWith('✅ Found 0 cars');
    logSpy.mockRestore();
  });

  test('configureRoutes should register GET / route', () => {
    const app = { get: jest.fn() };
    controller.configureRoutes(app);
    expect(app.get).toHaveBeenCalledWith('/', expect.any(Function));
  });
});
