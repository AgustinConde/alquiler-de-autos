const PaymentController = require('./controller/paymentController');
const PaymentService = require('./service/paymentService');
const PaymentRepository = require('./repository/paymentRepository');
const PaymentModel = require('./model/paymentModel');

/**
 * @param {import('express').Application} app
 * @param {import('rsdi').IDIContainer} container
 */
function initPaymentModule(app, container) {
  /**
   * @type {PaymentController} controller
   */
  const controller = container.get('PaymentController');
  controller.configureRoutes(app);
}

module.exports = {
  initPaymentModule,
  PaymentController,
  PaymentService,
  PaymentRepository,
  PaymentModel
};