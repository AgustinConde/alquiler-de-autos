const { isAdmin } = require('../../../utilities/authUtilities');


module.exports = class AuthController {
    /**
     * @param {import('../service/authService')} authService
     */
    constructor(authService) {
      this.authService = authService;
      this.ROUTE_BASE = '/auth';
      this.AUTH_VIEWS = 'auth/views';
    }
  
    /**
     * @param {import('express').Application} app
     */
    configureRoutes(app) {
      const ROUTE = this.ROUTE_BASE;
      app.get(`${ROUTE}/login`, this.showLoginForm.bind(this));
      app.post(`${ROUTE}/login`, this.login.bind(this));
      app.post(`${ROUTE}/logout`, this.logout.bind(this));
    }
  
    /**
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    showLoginForm(req, res) {
      res.render(`${this.AUTH_VIEWS}/login.njk`, {
        title: 'Login',
        error: null,
      });
    }
  
    /**
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async login(req, res) {
      try {
          const { username, password } = req.body;
          const client = await this.authService.authenticate(username, password);
          if (!client) {
              return res.render("auth/login.njk", { title: "Iniciar Sesión", error: "Credenciales incorrectas" });
          }
          
          req.session.clientId = client.id;
          req.session.clientRole = client.role;
          req.session.client = client;
          
          res.redirect("/");
      } catch (error) {
          res.render("auth/login.njk", { title: "Iniciar Sesión", error: "Error en el servidor" });
      }
    }
  
    /**
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    logout(req, res) {
      req.session.destroy(() => {
        res.redirect('/auth/login');
      });
    }

    
    /**
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    authMiddleware(req, res, next) {
      if (!req.session.client) {
          return res.redirect("/auth/login");
      }
      next();
  }
  };
