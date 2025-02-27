const DefaultController = require('./controller/defaultController');
/**
 * @param {import('express').Application} app
 * @param {import('rsdi').IDIContainer} container
 */
function initDefaultModule(app, container) {
  /**
   * @type {DefaultController} controller
   */
  const controller = container.get('DefaultController');
  controller.configureRoutes(app);
}

module.exports = { DefaultController, initDefaultModule };
