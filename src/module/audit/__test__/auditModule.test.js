test('initAuditModule should call configureRoutes on controller', () => {
  const app = {};
  const configureRoutes = jest.fn();
  const container = { get: jest.fn().mockReturnValue({ configureRoutes }) };
  const { initAuditModule } = require('../auditModule');
  initAuditModule(app, container);
  expect(container.get).toHaveBeenCalledWith('AuditController');
  expect(configureRoutes).toHaveBeenCalledWith(app);
});
