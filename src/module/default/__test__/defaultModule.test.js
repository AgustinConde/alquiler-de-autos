test('initDefaultModule should call configureRoutes on controller', () => {
  const app = {};
  const configureRoutes = jest.fn();
  const container = { get: jest.fn().mockReturnValue({ configureRoutes }) };
  const { initDefaultModule } = require('../defaultModule');
  initDefaultModule(app, container);
  expect(container.get).toHaveBeenCalledWith('DefaultController');
  expect(configureRoutes).toHaveBeenCalledWith(app);
});
