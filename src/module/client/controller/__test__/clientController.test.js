const ClientController = require('../clientController');
const { ClientIdNotDefinedError } = require('../../error/clientError');
const { isAdmin } = require('../../../auth/middleware/authMiddleware');

jest.mock('../../mapper/clientMapper', () => ({
  formToEntity: jest.fn(data => data)
}));

describe('ClientController', () => {
  let clientService;
  let controller;
  let req;
  let res;
  let auditServiceMock;
  let containerMock;

  beforeEach(() => {
    clientService = {
      getClientById: jest.fn(),
      getAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      save: jest.fn()
    };
    controller = new ClientController(clientService);
    req = {
      params: {},
      body: {},
      session: {},
      flash: jest.fn(),
      app: { get: jest.fn() }
    };
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    auditServiceMock = { createAuditLog: jest.fn().mockResolvedValue({}) };
    containerMock = { get: jest.fn().mockReturnValue(auditServiceMock) };
  });

  describe('configureRoutes', () => {
    let app;
    let controller;

    beforeEach(() => {
        app = {
        get: jest.fn(),
        post: jest.fn()
        };
        controller = new ClientController({});
    });

    test('should register all admin routes with isAdmin middleware and correct handlers', () => {
        controller.configureRoutes(app);
        const ROUTE = '/manage/clients';
        expect(app.get).toHaveBeenCalledWith(`${ROUTE}`, isAdmin, expect.any(Function));
        expect(app.get).toHaveBeenCalledWith(`${ROUTE}/:id`, isAdmin, expect.any(Function));
        expect(app.get).toHaveBeenCalledWith(`${ROUTE}/:id/edit`, isAdmin, expect.any(Function));
        expect(app.post).toHaveBeenCalledWith(`${ROUTE}/:id/edit`, isAdmin, expect.any(Function));
        expect(app.post).toHaveBeenCalledWith(`${ROUTE}/:id/delete`, isAdmin, expect.any(Function));
        expect(app.post).toHaveBeenCalledWith(`${ROUTE}/:id/make-admin`, isAdmin, expect.any(Function));
    });
  });

  test('view should throw if clientId is not a number', async () => {
    req.params.clientId = 'abc';
    await expect(controller.view(req, res)).rejects.toThrow(ClientIdNotDefinedError);
  });

  test('view should render client view', async () => {
    req.params.clientId = '1';
    clientService.getClientById.mockResolvedValue({ id: 1, rentals: [] });
    await controller.view(req, res);
    expect(res.render).toHaveBeenCalledWith(
      'pages/client/view.njk',
      expect.objectContaining({ client: expect.objectContaining({ id: 1 }) })
    );
  });

  test('adminIndex should render clients', async () => {
    clientService.getAll.mockResolvedValue([{ id: 1 }]);
    await controller.adminIndex(req, res);
    expect(res.render).toHaveBeenCalledWith(
      'pages/manage/clients/index.njk',
      expect.objectContaining({ clients: [{ id: 1 }] })
    );
  });

  test('adminIndex should handle error', async () => {
    clientService.getAll.mockRejectedValue(new Error('fail'));
    await controller.adminIndex(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'Error loading clients');
    expect(res.redirect).toHaveBeenCalledWith('/');
  });

  test('edit should render edit page', async () => {
    req.params.id = '1';
    clientService.getClientById.mockResolvedValue({ id: 1 });
    await controller.edit(req, res);
    expect(res.render).toHaveBeenCalledWith('pages/manage/clients/edit.njk', { client: { id: 1 } });
  });

  test('edit should handle error', async () => {
    req.params.id = '1';
    clientService.getClientById.mockRejectedValue(new Error('fail'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await controller.edit(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Error loading client');
    spy.mockRestore();
  });

  test('update should update client and create audit log', async () => {
    req.params.id = '1';
    req.body = { name: 'New' };
    req.session = { clientId: 2, email: 'mail@mail.com' };
    req.app.get = jest.fn(key => key === 'container' ? containerMock : undefined);
    const existing = { id: 1, name: 'Old', rentals: [], createdAt: '', updatedAt: '', deletedAt: '' };
    clientService.getClientById.mockResolvedValueOnce(existing).mockResolvedValueOnce({ id: 1, name: 'New' });
    clientService.update.mockResolvedValue({});
    await controller.update(req, res);
    expect(auditServiceMock.createAuditLog).toHaveBeenCalledWith(
      'client',
      '1',
      'update',
      expect.anything(),
      { id: 2, email: 'mail@mail.com' }
    );
    expect(res.redirect).toHaveBeenCalledWith('/manage/clients');
  });

  test('update should use req.session.email if present', async () => {
    req.params.id = '1';
    req.body = { name: 'New' };
    req.session = { clientId: 2, email: 'mail@mail.com' }; // email presente
    req.app.get = jest.fn(key => key === 'container' ? containerMock : undefined);
    const existing = { id: 1, name: 'Old', rentals: [], createdAt: '', updatedAt: '', deletedAt: '' };
    clientService.getClientById.mockResolvedValueOnce(existing).mockResolvedValueOnce({ id: 1, name: 'New' });
    clientService.update.mockResolvedValue({});
    await controller.update(req, res);
    expect(auditServiceMock.createAuditLog).toHaveBeenCalledWith(
      'client',
      '1',
      'update',
      expect.anything(),
      { id: 2, email: 'mail@mail.com' }
    );
  });

  test('update should use req.session.auth.username if email is missing', async () => {
    req.params.id = '1';
    req.body = { name: 'New' };
    req.session = { clientId: 2, auth: { username: 'user@mail.com' } }; // email ausente, auth.username presente
    req.app.get = jest.fn(key => key === 'container' ? containerMock : undefined);
    const existing = { id: 1, name: 'Old', rentals: [], createdAt: '', updatedAt: '', deletedAt: '' };
    clientService.getClientById.mockResolvedValueOnce(existing).mockResolvedValueOnce({ id: 1, name: 'New' });
    clientService.update.mockResolvedValue({});
    await controller.update(req, res);
    expect(auditServiceMock.createAuditLog).toHaveBeenCalledWith(
      'client',
      '1',
      'update',
      expect.anything(),
      { id: 2, email: 'user@mail.com' }
    );
  });

  test('update should handle error', async () => {
    req.params.id = '1';
    clientService.getClientById.mockRejectedValue(new Error('fail'));
    await controller.update(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'fail');
    expect(res.redirect).toHaveBeenCalledWith('/manage/clients/1/edit');
  });

  test('delete should delete client and create audit log', async () => {
    req.params.id = '1';
    req.session = { user: { id: 2, email: 'mail@mail.com' } };
    req.app.get = jest.fn(key => key === 'container' ? containerMock : undefined);
    clientService.getClientById.mockResolvedValue({ id: 1 });
    clientService.delete.mockResolvedValue({});
    await controller.delete(req, res);
    expect(auditServiceMock.createAuditLog).toHaveBeenCalledWith(
      'client',
      '1',
      'delete',
      { id: 1 },
      { id: 2, email: 'mail@mail.com' }
    );
    expect(res.redirect).toHaveBeenCalledWith('/manage/clients');
  });

  test('delete should handle error', async () => {
    req.params.id = '1';
    clientService.getClientById.mockRejectedValue(new Error('fail'));
    await controller.delete(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'Error deleting client');
    expect(res.redirect).toHaveBeenCalledWith('/manage/clients');
  });

  test('add should render add client page', async () => {
    await controller.add(req, res);
    expect(res.render).toHaveBeenCalledWith('pages/client/add.njk', { title: 'Add New Client' });
  });

  test('save should save client and redirect', async () => {
    req.body = { name: 'Test' };
    clientService.save.mockResolvedValue({});
    await controller.save(req, res);
    expect(clientService.save).toHaveBeenCalledWith({ name: 'Test' });
    expect(res.redirect).toHaveBeenCalledWith('/manage/clients');
  });

  test('makeAdmin should make client admin and redirect', async () => {
    req.session = { clientId: 2, role: 'admin' };
    req.params.id = '1';
    clientService.update.mockResolvedValue({ email: 'mail@mail.com' });
    await controller.makeAdmin(req, res);
    expect(clientService.update).toHaveBeenCalledWith('1', { role: 'admin' });
    expect(req.flash).toHaveBeenCalledWith('success', expect.stringContaining('mail@mail.com'));
    expect(res.redirect).toHaveBeenCalledWith('/manage/clients');
  });

  test('makeAdmin should handle permission error', async () => {
    req.session = { clientId: null, role: 'user' };
    await controller.makeAdmin(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
    expect(res.redirect).toHaveBeenCalledWith('/manage/clients');
  });

  test('makeAdmin should handle error', async () => {
    req.session = { clientId: 2, role: 'admin' };
    req.params.id = '1';
    clientService.update.mockRejectedValue(new Error('fail'));
    await controller.makeAdmin(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'fail');
    expect(res.redirect).toHaveBeenCalledWith('/manage/clients');
  });
});
