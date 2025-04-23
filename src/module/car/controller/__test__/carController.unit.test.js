const CarController = require('../carController');

jest.mock('../../entity/Car', () => {
  return function Car(id, brand, model, year, mileage, color, ac, capacity, transmission, pricePerDay, image, createdAt, updatedAt, deletedAt, rentals) {
    return { id, brand, model, year, mileage, color, ac, capacity, transmission, pricePerDay, image, createdAt, updatedAt, deletedAt, rentals };
  };
});

jest.mock('../../mapper/carMapper', () => ({
  formToEntity: jest.fn(carData => carData)
}));

describe('CarController.store (error branch for carService.save)', () => {
  let carController;
  let mockCarServiceLocal;
  let mockAuditServiceLocal;

  beforeEach(() => {
    mockCarServiceLocal = { save: jest.fn() };
    mockAuditServiceLocal = { createAuditLog: jest.fn() };
    carController = new CarController(mockCarServiceLocal, mockAuditServiceLocal);
  });

  test('should flash error.message if present', async () => {
    mockCarServiceLocal.save.mockRejectedValue(new Error('save fail'));
    const req = {
      body: { brand: 'Toyota' },
      file: { filename: 'car.jpg' },
      session: { clientId: 1, auth: { username: 'user@email.com' } },
      flash: jest.fn(),
      app: { get: jest.fn() }
    };
    const res = { redirect: jest.fn() };
    await carController.store(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'save fail');
    expect(res.redirect).toHaveBeenCalledWith('/manage/cars/create');
  });

  test('should flash default error if error.message is falsy', async () => {
    mockCarServiceLocal.save.mockRejectedValue({});
    const req = {
      body: { brand: 'Toyota' },
      file: { filename: 'car.jpg' },
      session: { clientId: 1, auth: { username: 'user@email.com' } },
      flash: jest.fn(),
      app: { get: jest.fn() }
    };
    const res = { redirect: jest.fn() };
    await carController.store(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'Error creating car');
    expect(res.redirect).toHaveBeenCalledWith('/manage/cars/create');
  });
});

describe('CarController.update (email branch)', () => {
  let carController;
  let mockCarServiceLocal;
  let mockAuditServiceLocal;

  beforeEach(() => {
    mockCarServiceLocal = {
      getCarById: jest.fn(),
      save: jest.fn()
    };
    mockAuditServiceLocal = { createAuditLog: jest.fn().mockResolvedValue({}) };
    carController = new CarController(mockCarServiceLocal, mockAuditServiceLocal);
  });

  test('should use req.session.auth.username if present', async () => {
    mockCarServiceLocal.getCarById.mockResolvedValue({ id: 1, image: '/img/car1.jpg' });
    mockCarServiceLocal.save.mockImplementation(car => Promise.resolve(car));
    const auditServiceMock = { createAuditLog: jest.fn().mockResolvedValue({}) };
    const containerMock = { get: jest.fn().mockReturnValue(auditServiceMock) };
    const req = {
      params: { id: 1 },
      body: { brand: 'Toyota' },
      session: { clientId: 1, auth: { username: 'user@email.com' } },
      flash: jest.fn(),
      app: { get: jest.fn((key) => key === 'container' ? containerMock : undefined) }
    };
    const res = { redirect: jest.fn() };
    await carController.update(req, res);
    expect(auditServiceMock.createAuditLog).toHaveBeenCalledWith(
      'car',
      expect.anything(),
      'update',
      expect.anything(),
      { id: 1, email: 'user@email.com' }
    );
  });

  test('should use req.session.email if req.session.auth is missing', async () => {
    mockCarServiceLocal.getCarById.mockResolvedValue({ id: 1, image: '/img/car1.jpg' });
    mockCarServiceLocal.save.mockImplementation(car => Promise.resolve(car));
    const auditServiceMock = { createAuditLog: jest.fn().mockResolvedValue({}) };
    const containerMock = { get: jest.fn().mockReturnValue(auditServiceMock) };
    const req = {
      params: { id: 1 },
      body: { brand: 'Toyota' },
      session: { clientId: 1, email: 'fallback@email.com' },
      flash: jest.fn(),
      app: { get: jest.fn((key) => key === 'container' ? containerMock : undefined) }
    };
    const res = { redirect: jest.fn() };
    await carController.update(req, res);
    expect(auditServiceMock.createAuditLog).toHaveBeenCalledWith(
      'car',
      expect.anything(),
      'update',
      expect.anything(),
      { id: 1, email: 'fallback@email.com' }
    );
  });
});

describe('CarController.restore (error branch for auditService.createAuditLog)', () => {
  let carController;
  let mockCarServiceLocal;
  let mockAuditServiceLocal;

  beforeEach(() => {
    mockCarServiceLocal = { restore: jest.fn() };
    mockAuditServiceLocal = { createAuditLog: jest.fn() };
    carController = new CarController(mockCarServiceLocal, mockAuditServiceLocal);
  });

  test('should flash error.message if present', async () => {
    mockCarServiceLocal.restore.mockRejectedValue(new Error('restore fail'));
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

  test('should flash default error if error.message is falsy', async () => {
    mockCarServiceLocal.restore.mockRejectedValue({});
    const req = {
      params: { id: 1 },
      session: { clientId: 1, auth: { username: 'user@email.com' } },
      flash: jest.fn(),
      app: { get: jest.fn() }
    };
    const res = { redirect: jest.fn() };
    await carController.restore(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'Error restoring car');
    expect(res.redirect).toHaveBeenCalledWith('/manage/cars');
  });
});
