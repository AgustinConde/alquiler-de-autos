test('initRentalModule should call configureRoutes on controller', () => {
  const app = {};
  const configureRoutes = jest.fn();
  const container = { get: jest.fn().mockReturnValue({ configureRoutes }) };
  const { initRentalModule } = require('../rentalModule');
  initRentalModule(app, container);
  expect(container.get).toHaveBeenCalledWith('RentalController');
  expect(configureRoutes).toHaveBeenCalledWith(app);
});
