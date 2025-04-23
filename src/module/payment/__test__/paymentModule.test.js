test('initPaymentModule should call configureRoutes on controller', () => {
  const app = {};
  const configureRoutes = jest.fn();
  const container = { get: jest.fn().mockReturnValue({ configureRoutes }) };
  const { initPaymentModule } = require('../paymentModule');
  initPaymentModule(app, container);
  expect(container.get).toHaveBeenCalledWith('PaymentController');
  expect(configureRoutes).toHaveBeenCalledWith(app);
});
