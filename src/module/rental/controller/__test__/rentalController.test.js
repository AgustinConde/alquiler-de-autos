const RentalController = require('../rentalController');
const { RentalIdNotDefinedError } = require('../../error/RentalError');

describe('RentalController', () => {
  let RentalService, CarService, ClientService, AuditService, controller, req, res;

  beforeEach(() => {
    RentalService = {
      getAll: jest.fn(),
      getRentalById: jest.fn(),
      update: jest.fn(),
      saveRental: jest.fn(),
      delete: jest.fn(),
      getRentalsByClientId: jest.fn(),
      cancelRental: jest.fn()
    };
    CarService = { getCarById: jest.fn() };
    ClientService = { getClientById: jest.fn() };
    AuditService = { createAuditLog: jest.fn().mockResolvedValue({}) };
    controller = new RentalController(RentalService, CarService, ClientService, AuditService);
    req = {
      params: {},
      body: {},
      session: {},
      flash: jest.fn(),
      app: { get: jest.fn() },
      query: {},
      path: '',
    };
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
  });

  test('adminIndex should render rentals', async () => {
    RentalService.getAll.mockResolvedValue([{ id: 1 }]);
    await controller.adminIndex(req, res);
    expect(res.render).toHaveBeenCalledWith('pages/manage/rentals/index.njk', expect.objectContaining({ rentals: [{ id: 1 }] }));
  });

  test('adminIndex should handle error', async () => {
    RentalService.getAll.mockRejectedValue(new Error('fail'));
    await controller.adminIndex(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'Error loading rentals');
    expect(res.redirect).toHaveBeenCalledWith('/');
  });

  test('view should render rental view (profile)', async () => {
    req.params.rentalId = '1';
    req.session.userRole = 'client';
    req.query = {};
    req.path = '/profile/rentals/view/1';
    RentalService.getRentalById.mockResolvedValue({ id: 1 });
    await controller.view(req, res);
    expect(res.render).toHaveBeenCalledWith('pages/rental/view.njk', expect.objectContaining({ rental: { id: 1 } }));
  });

  test('view should render rental view (admin)', async () => {
    req.params.rentalId = '1';
    req.session.userRole = 'admin';
    req.query = {};
    req.path = '/manage/rentals/view/1';
    RentalService.getRentalById.mockResolvedValue({ id: 1 });
    await controller.view(req, res);
    expect(res.render).toHaveBeenCalledWith('pages/manage/rentals/view.njk', expect.objectContaining({ rental: { id: 1 } }));
  });

  test('view should handle error', async () => {
    req.params.rentalId = '1';
    RentalService.getRentalById.mockRejectedValue(new Error('fail'));
    await controller.view(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'fail');
    expect(res.redirect).toHaveBeenCalledWith('/profile/rentals');
  });

  test('view should handle invalid rentalId and redirect', async () => {
    req.params.rentalId = 'abc';
    await controller.view(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
    expect(res.redirect).toHaveBeenCalledWith('/profile/rentals');
  });

  test('edit should render edit page (admin)', async () => {
    req.params.id = '1';
    req.path = '/manage/rentals/1/edit';
    RentalService.getRentalById.mockResolvedValue({ id: 1 });
    await controller.edit(req, res);
    expect(res.render).toHaveBeenCalledWith('pages/manage/rentals/edit.njk', expect.objectContaining({ rental: { id: 1 } }));
  });

  test('edit should render edit page (client)', async () => {
    req.params.rentalId = '1';
    req.path = '/profile/rentals/edit/1';
    RentalService.getRentalById.mockResolvedValue({ id: 1 });
    await controller.edit(req, res);
    expect(res.render).toHaveBeenCalledWith('/pages/rental/edit.njk', expect.objectContaining({ rental: { id: 1 } }));
  });

  test('edit should handle error', async () => {
    req.params.id = '1';
    req.path = '/manage/rentals/1/edit';
    RentalService.getRentalById.mockRejectedValue(new Error('fail'));
    await controller.edit(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'fail');
    expect(res.redirect).toHaveBeenCalledWith('/manage/rentals');
  });

  test('edit should handle invalid rentalId and redirect', async () => {
    req.params.rentalId = 'abc';
    req.path = '/profile/rentals/edit/abc';
    await controller.edit(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
    expect(res.redirect).toHaveBeenCalledWith('/manage/rentals');
  });

  test('update should update rental, create audit log, and redirect', async () => {
    req.params.id = '1';
    req.body = { pricePerDay: 100 };
    req.session = { clientId: 2, email: 'mail@mail.com' };
    const rentalMock = {
      id: 1,
      client: { id: 2, name: 'John', surname: 'Doe', email: 'mail@mail.com' },
      car: { id: 3, brand: 'Toyota', model: 'Corolla', year: 2020 },
      pricePerDay: 100,
      rentalStart: '2024-04-23',
      rentalEnd: '2024-04-25',
      totalPrice: 200,
      paymentProgress: { name: 'Pending', value: 0 }
    };
    RentalService.getRentalById.mockResolvedValueOnce(rentalMock).mockResolvedValueOnce(rentalMock);
    RentalService.update.mockResolvedValue({});
    await controller.update(req, res);
    expect(AuditService.createAuditLog).toHaveBeenCalledWith(
      'rental',
      '1',
      'update',
      expect.anything(),
      { id: 2, email: 'mail@mail.com' }
    );
    expect(req.flash).toHaveBeenCalledWith('success', 'Rental updated successfully');
    expect(res.redirect).toHaveBeenCalledWith('/manage/rentals');
  });

  test('update should handle error updating rental and redirect to edit', async () => {
    req.params.id = '1';
    RentalService.getRentalById.mockResolvedValueOnce({ id: 1 });
    RentalService.update.mockRejectedValue(new Error('fail-update'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await controller.update(req, res);
    expect(spy).toHaveBeenCalledWith('❌ Error updating rental:', expect.any(Error));
    expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
    expect(res.redirect).toHaveBeenCalledWith('/manage/rentals/1/edit');
    spy.mockRestore();
  });

  test('update should handle error in audit log and log to console', async () => {
    req.params.id = '1';
    req.body = { pricePerDay: 100 };
    req.session = { clientId: 2, email: 'mail@mail.com' };
    const rentalMock = {
      id: 1,
      client: { id: 2, name: 'John', surname: 'Doe', email: 'mail@mail.com' },
      car: { id: 3, brand: 'Toyota', model: 'Corolla', year: 2020 },
      pricePerDay: 100,
      rentalStart: '2024-04-23',
      rentalEnd: '2024-04-25',
      totalPrice: 200,
      paymentProgress: { name: 'Pending', value: 0 }
    };
    RentalService.getRentalById.mockResolvedValueOnce(rentalMock).mockResolvedValueOnce(rentalMock);
    RentalService.update.mockResolvedValue({});
    AuditService.createAuditLog.mockRejectedValue(new Error('audit fail'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await controller.update(req, res);
    expect(spy).toHaveBeenCalledWith('❌ Error creating audit log:', expect.any(Error));
    spy.mockRestore();
  });

  test('update should handle missing client.surname in previousState', async () => {
    req.params.id = '1';
    req.body = { pricePerDay: 100 };
    req.session = { clientId: 2, email: 'mail@mail.com' };
    const rentalMock = {
      id: 1,
      client: { id: 2, name: 'John', surname: undefined, email: 'mail@mail.com' },
      car: { id: 3, brand: 'Toyota', model: 'Corolla', year: 2020 },
      pricePerDay: 100,
      rentalStart: '2024-04-23',
      rentalEnd: '2024-04-25',
      totalPrice: 200,
      paymentProgress: { name: 'Pending', value: 0 }
    };
    RentalService.getRentalById.mockResolvedValueOnce(rentalMock).mockResolvedValueOnce(rentalMock);
    RentalService.update.mockResolvedValue({});
    await controller.update(req, res);
    expect(AuditService.createAuditLog).toHaveBeenCalledWith(
      'rental',
      '1',
      'update',
      expect.objectContaining({ previous: expect.objectContaining({ client: expect.objectContaining({ surname: '' }) }) }),
      { id: 2, email: 'mail@mail.com' }
    );
  });

  test('update should handle updatedRental.client as null', async () => {
    req.params.id = '1';
    req.body = { pricePerDay: 100 };
    req.session = { clientId: 2, email: 'mail@mail.com' };
    const rentalMock = {
      id: 1,
      client: null,
      car: { id: 3, brand: 'Toyota', model: 'Corolla', year: 2020 },
      pricePerDay: 100,
      rentalStart: '2024-04-23',
      rentalEnd: '2024-04-25',
      totalPrice: 200,
      paymentProgress: { name: 'Pending', value: 0 }
    };
    RentalService.getRentalById.mockResolvedValueOnce(rentalMock).mockResolvedValueOnce(rentalMock);
    RentalService.update.mockResolvedValue({});
    await controller.update(req, res);
    expect(AuditService.createAuditLog).toHaveBeenCalledWith(
      'rental',
      '1',
      'update',
      expect.objectContaining({ current: expect.objectContaining({ client: null }) }),
      { id: 2, email: 'mail@mail.com' }
    );
  });

  test('update should handle updatedRental.client as truthy (full branch)', async () => {
    req.params.id = '1';
    req.body = { pricePerDay: 100 };
    req.session = { clientId: 2, email: 'mail@mail.com' };
    const rentalMock = {
      id: 1,
      client: { id: 2, name: 'John', surname: 'Doe', email: 'mail@mail.com' },
      car: { id: 3, brand: 'Toyota', model: 'Corolla', year: 2020 },
      pricePerDay: 100,
      rentalStart: '2024-04-23',
      rentalEnd: '2024-04-25',
      totalPrice: 200,
      paymentProgress: { name: 'Pending', value: 0 }
    };
    RentalService.getRentalById.mockResolvedValueOnce(rentalMock).mockResolvedValueOnce(rentalMock);
    RentalService.update.mockResolvedValue({});
    await controller.update(req, res);
    expect(AuditService.createAuditLog).toHaveBeenCalledWith(
      'rental',
      '1',
      'update',
      expect.objectContaining({ current: expect.objectContaining({ client: expect.objectContaining({ id: 2, name: 'John', surname: 'Doe', email: 'mail@mail.com' }) }) }),
      { id: 2, email: 'mail@mail.com' }
    );
  });

  test('update should handle updatedRental.car as truthy and req.session.email present', async () => {
    req.params.id = '1';
    req.body = { pricePerDay: 100 };
    req.session = { clientId: 2, email: 'mail@mail.com' };
    const rentalMock = {
      id: 1,
      client: { id: 2, name: 'John', surname: 'Doe', email: 'mail@mail.com' },
      car: { id: 3, brand: 'Toyota', model: 'Corolla', year: 2020 },
      pricePerDay: 100,
      rentalStart: '2024-04-23',
      rentalEnd: '2024-04-25',
      totalPrice: 200,
      paymentProgress: { name: 'Pending', value: 0 }
    };
    RentalService.getRentalById.mockResolvedValueOnce(rentalMock).mockResolvedValueOnce(rentalMock);
    RentalService.update.mockResolvedValue({});
    await controller.update(req, res);
    expect(AuditService.createAuditLog).toHaveBeenCalledWith(
      'rental',
      '1',
      'update',
      expect.objectContaining({ current: expect.objectContaining({ car: expect.objectContaining({ id: 3, brand: 'Toyota', model: 'Corolla', year: 2020 }) }) }),
      { id: 2, email: 'mail@mail.com' }
    );
  });

  test('update should handle updatedRental.car as null and req.session.auth.username present', async () => {
    req.params.id = '1';
    req.body = { pricePerDay: 100 };
    req.session = { clientId: 2, auth: { username: 'user@mail.com' } };
    const rentalMock = {
      id: 1,
      client: { id: 2, name: 'John', surname: 'Doe', email: 'user@mail.com' },
      car: null,
      pricePerDay: 100,
      rentalStart: '2024-04-23',
      rentalEnd: '2024-04-25',
      totalPrice: 200,
      paymentProgress: { name: 'Pending', value: 0 }
    };
    RentalService.getRentalById.mockResolvedValueOnce(rentalMock).mockResolvedValueOnce(rentalMock);
    RentalService.update.mockResolvedValue({});
    await controller.update(req, res);
    expect(AuditService.createAuditLog).toHaveBeenCalledWith(
      'rental',
      '1',
      'update',
      expect.objectContaining({ current: expect.objectContaining({ car: null }) }),
      { id: 2, email: 'user@mail.com' }
    );
  });

  test('new should render create page with car and client', async () => {
    req.params.carId = '1';
    req.session.clientId = 2;
    CarService.getCarById.mockResolvedValue({ id: 1, pricePerDay: 100 });
    ClientService.getClientById.mockResolvedValue({ id: 2 });
    await controller.new(req, res);
    expect(res.render).toHaveBeenCalledWith('pages/rental/create.njk', expect.objectContaining({ car: { id: 1, pricePerDay: 100 }, client: { id: 2 } }));
  });

  test('new should handle car not found', async () => {
    req.params.carId = '1';
    CarService.getCarById.mockResolvedValue(null);
    await controller.new(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'Car not found');
    expect(res.redirect).toHaveBeenCalledWith('/');
  });

  test('new should handle error', async () => {
    req.params.carId = '1';
    CarService.getCarById.mockRejectedValue(new Error('fail'));
    await controller.new(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'fail');
    expect(res.redirect).toHaveBeenCalledWith('/');
  });

  test('create should create rental and redirect', async () => {
    req.params.carId = '1';
    req.session.clientId = 2;
    req.body = { startDate: '2024-04-23', endDate: '2024-04-25', paymentMethod: 'Card' };
    CarService.getCarById.mockResolvedValue({ id: 1, pricePerDay: 100 });
    RentalService.saveRental.mockResolvedValue({ id: 10 });
    await controller.create(req, res);
    expect(req.flash).toHaveBeenCalledWith('success', 'Car rented successfully');
    expect(res.redirect).toHaveBeenCalledWith('/profile/rentals/view/10');
  });

  test('create should handle car not found', async () => {
    req.params.carId = '1';
    CarService.getCarById.mockResolvedValue(null);
    await controller.create(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'Car not found');
    expect(res.redirect).toHaveBeenCalledWith('/');
  });

  test('create should handle invalid dates', async () => {
    req.params.carId = '1';
    req.session.clientId = 2;
    req.body = { startDate: 'invalid', endDate: '2024-04-25', paymentMethod: 'Card' };
    CarService.getCarById.mockResolvedValue({ id: 1, pricePerDay: 100 });
    await controller.create(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'Invalid dates');
    expect(res.redirect).toHaveBeenCalledWith('/rent/1');
  });

  test('create should handle end date before start date', async () => {
    req.params.carId = '1';
    req.session.clientId = 2;
    req.body = { startDate: '2024-04-25', endDate: '2024-04-23', paymentMethod: 'Card' };
    CarService.getCarById.mockResolvedValue({ id: 1, pricePerDay: 100 });
    await controller.create(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'End date must be after start date');
    expect(res.redirect).toHaveBeenCalledWith('/rent/1');
  });

  test('create should handle error', async () => {
    req.params.carId = '1';
    req.session.clientId = 2;
    req.body = { startDate: '2024-04-23', endDate: '2024-04-25', paymentMethod: 'Card' };
    CarService.getCarById.mockResolvedValue({ id: 1, pricePerDay: 100 });
    RentalService.saveRental.mockRejectedValue(new Error('fail'));
    await controller.create(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'fail');
    expect(res.redirect).toHaveBeenCalledWith('/rent/1');
  });

  test('delete should delete rental, create audit log, and redirect', async () => {
    req.params.id = '1';
    req.session = { clientId: 2, email: 'mail@mail.com' };
    const rentalMock = { id: 1 };
    RentalService.getRentalById.mockResolvedValue(rentalMock);
    RentalService.delete.mockResolvedValue({});
    await controller.delete(req, res);
    expect(AuditService.createAuditLog).toHaveBeenCalledWith(
      'rental',
      '1',
      'delete',
      rentalMock,
      { id: 2, email: 'mail@mail.com' }
    );
    expect(req.flash).toHaveBeenCalledWith('success', 'Rental deleted successfully');
    expect(res.redirect).toHaveBeenCalledWith('/manage/rentals');
  });

  test('delete should handle rental not found and redirect', async () => {
    req.params.id = '1';
    RentalService.getRentalById.mockResolvedValue(null);
    await controller.delete(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'Error deleting rental: Rental not found');
    expect(res.redirect).toHaveBeenCalledWith('/manage/rentals');
  });

  test('delete should handle error deleting rental and redirect', async () => {
    req.params.id = '1';
    RentalService.getRentalById.mockResolvedValue({ id: 1 });
    RentalService.delete.mockRejectedValue(new Error('fail-delete'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await controller.delete(req, res);
    expect(spy).toHaveBeenCalledWith('❌ Error deleting rental:', expect.any(Error));
    expect(req.flash).toHaveBeenCalledWith('error', 'Error deleting rental: fail-delete');
    expect(res.redirect).toHaveBeenCalledWith('/manage/rentals');
    spy.mockRestore();
  });

  test('delete should handle error in audit log and log to console', async () => {
    req.params.id = '1';
    req.session = { clientId: 2, email: 'mail@mail.com' };
    const rentalMock = { id: 1 };
    RentalService.getRentalById.mockResolvedValue(rentalMock);
    RentalService.delete.mockResolvedValue({});
    AuditService.createAuditLog.mockRejectedValue(new Error('audit fail'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await controller.delete(req, res);
    expect(spy).toHaveBeenCalledWith('❌ Error creating audit log:', expect.any(Error));
    spy.mockRestore();
  });

  test('getClientRentals should render client rentals', async () => {
    req.session.clientId = 2;
    RentalService.getRentalsByClientId.mockResolvedValue([{ id: 1 }]);
    await controller.getClientRentals(req, res);
    expect(res.render).toHaveBeenCalledWith('pages/rental/client-rentals.njk', expect.objectContaining({ rentals: [{ id: 1 }] }));
  });

  test('getClientRentals should handle not logged in', async () => {
    req.session.clientId = undefined;
    await controller.getClientRentals(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'You must be logged in to view your rentals');
    expect(res.redirect).toHaveBeenCalledWith('/auth/login');
  });

  test('getClientRentals should handle error', async () => {
    req.session.clientId = 2;
    RentalService.getRentalsByClientId.mockRejectedValue(new Error('fail'));
    await controller.getClientRentals(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'fail');
    expect(res.redirect).toHaveBeenCalledWith('/');
  });

  test('cancel should cancel rental and redirect', async () => {
    req.params.id = '1';
    req.session.clientId = 2;
    RentalService.cancelRental.mockResolvedValue({ message: 'Rental cancelled' });
    await controller.cancel(req, res);
    expect(req.flash).toHaveBeenCalledWith('success', 'Rental cancelled');
    expect(res.redirect).toHaveBeenCalledWith('/profile/rentals');
  });

  test('cancel should handle not logged in', async () => {
    req.params.id = '1';
    req.session.clientId = undefined;
    await controller.cancel(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'You must be logged in to cancel a rental');
    expect(res.redirect).toHaveBeenCalledWith('/auth/login');
  });

  test('cancel should handle error', async () => {
    req.params.id = '1';
    req.session.clientId = 2;
    RentalService.cancelRental.mockRejectedValue(new Error('fail'));
    await controller.cancel(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'fail');
    expect(res.redirect).toHaveBeenCalledWith('/profile/rentals');
  });

  test('configureRoutes should register all routes with correct middlewares and handlers', () => {
    const app = { get: jest.fn(), post: jest.fn() };
    controller.configureRoutes(app);
    expect(app.get).toHaveBeenCalledWith('/profile/rentals', expect.any(Function), expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/profile/rentals/view/:rentalId', expect.any(Function), expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/rent/:carId', expect.any(Function), expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/rent/:carId', expect.any(Function), expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/profile/rentals/cancel/:id', expect.any(Function), expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/profile/rentals/edit/:rentalId', expect.any(Function), expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/manage/rentals', expect.any(Function), expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/manage/rentals/:id/edit', expect.any(Function), expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/manage/rentals/:id/edit', expect.any(Function), expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/manage/rentals/:id/delete', expect.any(Function), expect.any(Function));
  });
});
