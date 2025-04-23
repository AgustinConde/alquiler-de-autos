test('initCarModule should call configureRoutes on controller', () => {
  const app = {};
  const configureRoutes = jest.fn();
  const container = { get: jest.fn().mockReturnValue({ configureRoutes }) };
  const { initCarModule } = require('../carModule');
  initCarModule(app, container);
  expect(container.get).toHaveBeenCalledWith('CarController');
  expect(configureRoutes).toHaveBeenCalledWith(app);
});
