const AuthController = require('./controller/authController');
const AuthService = require('./service/authService');
const AuthRepository = require('./repository/authRepository');
const AuthModel = require('./model/authModel');

function initAuthModule(app, container) {
      /**
   * @type {AuthController} controller
   */
    const controller = container.get('AuthController');
    controller.configureRoutes(app);
}

module.exports = {
    AuthController,
    AuthService,
    AuthRepository,
    AuthModel,
    initAuthModule
};
