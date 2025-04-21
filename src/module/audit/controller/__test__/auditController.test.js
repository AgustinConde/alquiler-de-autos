const AuditController = require('../auditController');

describe('AuditController', () => {
  let auditService;
  let controller;
  let req;
  let res;

  beforeEach(() => {
    auditService = {
      getAuditLogs: jest.fn(),
      restoreFromAudit: jest.fn(),
      getById: jest.fn()
    };
    controller = new AuditController(auditService);
    req = { flash: jest.fn(), params: {}, body: {} };
    res = { render: jest.fn(), redirect: jest.fn() };
  });

  test('constructor sets auditService and ROUTE_BASE', () => {
    expect(controller.auditService).toBe(auditService);
    expect(controller.ROUTE_BASE).toBe('/manage/audit-log');
  });

  test('configureRoutes should register routes', () => {
    const app = { get: jest.fn(), post: jest.fn() };
    controller.configureRoutes(app);
    expect(app.get).toHaveBeenCalledWith('/manage/audit-log', expect.any(Function), expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/manage/audit-log/view/:id', expect.any(Function), expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/manage/audit-log/restore/:id', expect.any(Function), expect.any(Function));
  });

  test('index should render audit logs on success', async () => {
    const logs = [{ id: 1 }];
    auditService.getAuditLogs.mockResolvedValue(logs);
    await controller.index(req, res);
    expect(res.render).toHaveBeenCalledWith('pages/manage/audit/index.njk', expect.objectContaining({ auditLogs: logs, ROUTE: '/manage/audit-log' }));
  });

  test('index should handle error and redirect', async () => {
    auditService.getAuditLogs.mockRejectedValue(new Error('fail'));
    await controller.index(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'Error loading audit logs');
    expect(res.redirect).toHaveBeenCalledWith('/manage');
  });

  test('restore should flash success and redirect on success', async () => {
    req.params.id = 123;
    auditService.restoreFromAudit.mockResolvedValue({ message: 'Restored', entityId: 42 });
    await controller.restore(req, res);
    expect(req.flash).toHaveBeenCalledWith('success', expect.stringContaining('Restored'));
    expect(res.redirect).toHaveBeenCalledWith('/manage/audit-log');
  });

  test('restore should handle error and redirect', async () => {
    req.params.id = 123;
    auditService.restoreFromAudit.mockRejectedValue(new Error('fail'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await controller.restore(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('fail'));
    expect(res.redirect).toHaveBeenCalledWith('/manage/audit-log');
    errorSpy.mockRestore();
  });

  test('viewAuditDetails should render details when found', async () => {
    req.params.id = 1;
    const auditLog = { id: 1, data: {}, actionType: 'create', entityType: 'car' };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(res.render).toHaveBeenCalledWith('pages/manage/audit/detail.njk', expect.objectContaining({ audit: auditLog }));
  });

  test('viewAuditDetails should handle not found', async () => {
    req.params.id = 1;
    auditService.getById.mockResolvedValue(null);
    await controller.viewAuditDetails(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'Audit log not found');
    expect(res.redirect).toHaveBeenCalledWith('/manage/audit-log');
  });

  test('viewAuditDetails should handle error and redirect', async () => {
    req.params.id = 1;
    auditService.getById.mockRejectedValue(new Error('fail'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await controller.viewAuditDetails(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'fail');
    expect(res.redirect).toHaveBeenCalledWith('/manage/audit-log');
    errorSpy.mockRestore();
  });

  test('viewAuditDetails should parse auditLog.data if it is a string', async () => {
    req.params.id = 1;
    const auditLog = { id: 1, data: JSON.stringify({ foo: 'bar' }), actionType: 'create', entityType: 'car' };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(res.render).toHaveBeenCalledWith(
      'pages/manage/audit/detail.njk',
      expect.objectContaining({ audit: auditLog, auditData: { foo: 'bar' } })
    );
  });

  test('viewAuditDetails should handle JSON parse error and redirect', async () => {
    req.params.id = 1;
    const auditLog = { id: 1, data: "{invalidJson:}", actionType: 'create', entityType: 'car' };
    auditService.getById.mockResolvedValue(auditLog);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await controller.viewAuditDetails(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
    expect(res.redirect).toHaveBeenCalledWith('/manage/audit-log');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('viewAuditDetails should handle update actionType and mutate birthdate/birthDate', async () => {
    req.params.id = 1;
    const auditLog = {
      id: 1,
      data: {
        previous: { birthdate: '2000-01-01T00:00:00Z', car: { brand: 'A', model: 'B' }, client: { name: 'N', surname: 'S' }, paymentProgress: { value: 1 }, formattedDates: {}, rentalStart: '2024-01-01', rentalEnd: '2024-01-02' },
        current: { birthDate: '2001-01-01T00:00:00Z', car: { brand: 'C', model: 'D' }, client: { name: 'X', surname: 'Y' }, paymentProgress: { value: 0 }, formattedDates: {}, rentalStart: '2025-01-01', rentalEnd: '2025-01-02' }
      },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(auditLog.data.previous.birthdate).toBe('2000-01-01');
    expect(auditLog.data.current.birthDate).toBe('2001-01-01');
    expect(auditLog.data.previous.car).toBe('A B');
    expect(auditLog.data.current.car).toBe('C D');
    expect(auditLog.data.previous.client).toBe('N S');
    expect(auditLog.data.current.client).toBe('X Y');
    expect(auditLog.data.previous.paymentProgress).toBe('Paid');
    expect(auditLog.data.current.paymentProgress).toBe('Pending');
    expect(auditLog.data.previous.formattedDates).toBe('2024-01-01 to 2024-01-02');
    expect(auditLog.data.current.formattedDates).toBe('2025-01-01 to 2025-01-02');
    expect(res.render).toHaveBeenCalledWith(
      'pages/manage/audit/detail.njk',
      expect.objectContaining({ audit: auditLog })
    );
  });

  test('viewAuditDetails should cover all branches in update actionType', async () => {
    req.params.id = 1;
    const auditLog = {
      id: 1,
      data: {
        previous: {
          birthdate: '2020-01-01T12:00:00Z',
          car: { brand: 'Toyota', model: 'Corolla' },
          client: { name: 'Ana', surname: 'García' },
          paymentProgress: { value: 1 },
          formattedDates: {},
          rentalStart: '2020-01-01',
          rentalEnd: '2020-01-10'
        },
        current: {
          birthdate: '2021-01-01T12:00:00Z',
          car: { brand: 'Honda', model: 'Civic' },
          client: { name: 'Luis', surname: 'Pérez' },
          paymentProgress: { value: 0 },
          formattedDates: {},
          rentalStart: '2021-01-01',
          rentalEnd: '2021-01-10'
        }
      },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(auditLog.data.previous.birthdate).toBe('2020-01-01');
    expect(auditLog.data.current.birthdate).toBe('2021-01-01');
    expect(auditLog.data.previous.car).toBe('Toyota Corolla');
    expect(auditLog.data.current.car).toBe('Honda Civic');
    expect(auditLog.data.previous.client).toBe('Ana García');
    expect(auditLog.data.current.client).toBe('Luis Pérez');
    expect(auditLog.data.previous.paymentProgress).toBe('Paid');
    expect(auditLog.data.current.paymentProgress).toBe('Pending');
    expect(auditLog.data.previous.formattedDates).toBe('2020-01-01 to 2020-01-10');
    expect(auditLog.data.current.formattedDates).toBe('2021-01-01 to 2021-01-10');
    expect(res.render).toHaveBeenCalledWith(
      'pages/manage/audit/detail.njk',
      expect.objectContaining({ audit: auditLog })
    );
  });

  test('viewAuditDetails should cover branch where previous or current is missing (linea 71)', async () => {
    req.params.id = 1;
    let auditLog = {
      id: 1,
      data: { previous: { birthdate: '2020-01-01T00:00:00Z' } },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(res.render).toHaveBeenCalledWith(
      'pages/manage/audit/detail.njk',
      expect.objectContaining({ audit: auditLog })
    );

    auditLog = {
      id: 2,
      data: { current: { birthdate: '2021-01-01T00:00:00Z' } },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(res.render).toHaveBeenCalledWith(
      'pages/manage/audit/detail.njk',
      expect.objectContaining({ audit: auditLog })
    );
  });

  test('viewAuditDetails should cover all branches for car, client, paymentProgress (object and falsy cases)', async () => {
    req.params.id = 1;
    let auditLog = {
      id: 1,
      data: {
        previous: { car: { brand: 'Toyota', model: 'Corolla' } },
        current: { car: { brand: 'Honda', model: 'Civic' } }
      },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(auditLog.data.previous.car).toBe('Toyota Corolla');
    expect(auditLog.data.current.car).toBe('Honda Civic');

    auditLog = {
      id: 2,
      data: {
        previous: { car: null },
        current: { car: undefined }
      },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(auditLog.data.previous.car).toBeNull();
    expect(auditLog.data.current.car).toBeUndefined();

    auditLog = {
      id: 3,
      data: {
        previous: { client: { name: 'Ana', surname: 'García' } },
        current: { client: { name: 'Luis', surname: 'Pérez' } }
      },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(auditLog.data.previous.client).toBe('Ana García');
    expect(auditLog.data.current.client).toBe('Luis Pérez');

    auditLog = {
      id: 4,
      data: {
        previous: { client: null },
        current: { client: undefined }
      },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(auditLog.data.previous.client).toBeNull();
    expect(auditLog.data.current.client).toBeUndefined();

    auditLog = {
      id: 5,
      data: {
        previous: { paymentProgress: { value: 1 } },
        current: { paymentProgress: { value: 0 } }
      },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(auditLog.data.previous.paymentProgress).toBe('Paid');
    expect(auditLog.data.current.paymentProgress).toBe('Pending');

    auditLog = {
      id: 6,
      data: {
        previous: { paymentProgress: null },
        current: { paymentProgress: undefined }
      },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(auditLog.data.previous.paymentProgress).toBeNull();
    expect(auditLog.data.current.paymentProgress).toBeUndefined();
  });

  test('viewAuditDetails should cover all branches for car, client, paymentProgress with empty/partial objects', async () => {
    req.params.id = 1;
    let auditLog = {
      id: 1,
      data: {
        previous: { car: {} },
        current: { car: {} }
      },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(auditLog.data.previous.car).toBe(' ');
    expect(auditLog.data.current.car).toBe(' ');

    auditLog = {
      id: 2,
      data: {
        previous: { car: { brand: 'Toyota' } },
        current: { car: { model: 'Civic' } }
      },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(auditLog.data.previous.car).toBe('Toyota ');
    expect(auditLog.data.current.car).toBe(' Civic');

    auditLog = {
      id: 3,
      data: {
        previous: { client: {} },
        current: { client: {} }
      },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(auditLog.data.previous.client).toBe(' ');
    expect(auditLog.data.current.client).toBe(' ');

    auditLog = {
      id: 4,
      data: {
        previous: { client: { name: 'Ana' } },
        current: { client: { surname: 'Pérez' } }
      },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(auditLog.data.previous.client).toBe('Ana ');
    expect(auditLog.data.current.client).toBe(' Pérez');

    auditLog = {
      id: 5,
      data: {
        previous: { paymentProgress: {} },
        current: { paymentProgress: {} }
      },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(auditLog.data.previous.paymentProgress).toBe('Pending');
    expect(auditLog.data.current.paymentProgress).toBe('Pending');

    auditLog = {
      id: 6,
      data: {
        previous: { paymentProgress: { name: 'Custom' } },
        current: { paymentProgress: { name: 'Otro' } }
      },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(auditLog.data.previous.paymentProgress).toBe('Custom');
    expect(auditLog.data.current.paymentProgress).toBe('Otro');
  });

  test('viewAuditDetails should log rentals if entityType is car and Rentals exist', async () => {
    req.params.id = 1;
    const auditLog = {
      id: 1,
      data: { Rentals: [{ id: 1 }, { id: 2 }] },
      actionType: 'create',
      entityType: 'car'
    };
    auditService.getById.mockResolvedValue(auditLog);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await controller.viewAuditDetails(req, res);
    expect(logSpy).toHaveBeenCalledWith('Audit 1 contains 2 rentals');
    logSpy.mockRestore();
  });

  test('viewAuditDetails should cover previous.birthDate branch', async () => {
    req.params.id = 1;
    const auditLog = {
      id: 1,
      data: {
        previous: { birthDate: '2020-01-01T12:00:00Z' },
        current: {}
      },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(auditLog.data.previous.birthDate).toBe('2020-01-01');
    expect(res.render).toHaveBeenCalledWith(
      'pages/manage/audit/detail.njk',
      expect.objectContaining({ audit: auditLog })
    );
  });

  test('viewAuditDetails should cover all branches for current.paymentProgress (linea 112)', async () => {
    req.params.id = 1;
    let auditLog = {
      id: 1,
      data: {
        previous: {},
        current: { paymentProgress: { name: 'CustomStatus' } }
      },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(auditLog.data.current.paymentProgress).toBe('CustomStatus');

    auditLog = {
      id: 2,
      data: {
        previous: {},
        current: { paymentProgress: { value: 1 } }
      },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(auditLog.data.current.paymentProgress).toBe('Paid');

    auditLog = {
      id: 3,
      data: {
        previous: {},
        current: { paymentProgress: { value: 0 } }
      },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(auditLog.data.current.paymentProgress).toBe('Pending');

    auditLog = {
      id: 4,
      data: {
        previous: {},
        current: { paymentProgress: {} }
      },
      actionType: 'update',
      entityType: 'client'
    };
    auditService.getById.mockResolvedValue(auditLog);
    await controller.viewAuditDetails(req, res);
    expect(auditLog.data.current.paymentProgress).toBe('Pending');
  });
});
