test('initAuthModule should call configureRoutes on controller', () => {
  const app = {};
  const configureRoutes = jest.fn();
  const container = { get: jest.fn().mockReturnValue({ configureRoutes }) };
  const { initAuthModule } = require('../authModule');
  initAuthModule(app, container);
  expect(container.get).toHaveBeenCalledWith('AuthController');
  expect(configureRoutes).toHaveBeenCalledWith(app);
});
