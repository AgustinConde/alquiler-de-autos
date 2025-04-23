test('initClientModule should call configureRoutes on controller', () => {
  const app = {};
  const configureRoutes = jest.fn();
  const container = { get: jest.fn().mockReturnValue({ configureRoutes }) };
  const { initClientModule } = require('../clientModule');
  initClientModule(app, container);
  expect(container.get).toHaveBeenCalledWith('ClientController');
  expect(configureRoutes).toHaveBeenCalledWith(app);
});
