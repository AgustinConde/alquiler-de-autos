const { isAuthenticated } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const ms = require('ms');

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min.
  max: 5,
  standardHeaders: true,
  store: {
    init: () => {},
    increment: (key) => {
      const record = attemptStore.get(key) || { counter: 0, resetTime: Date.now() + 15 * 60 * 1000 };
      record.counter++;
      attemptStore.set(key, record);
      return record;
    },
    decrement: (key) => {
      const record = attemptStore.get(key);
      if (record) {
        record.counter--;
        attemptStore.set(key, record);
      }
    },
    resetKey: (key) => attemptStore.delete(key),
    resetAll: () => attemptStore.clear(),
    get: (key) => {
      const record = attemptStore.get(key);
      return record ? record.counter : 0;
    },
  },
  message: (req, res) => {
    const key = req.ip;
    const record = attemptStore.get(key);
    if (!record) return 'Too many login attempts. Please try again later.';
    
    const timeLeft = Math.ceil((record.resetTime - Date.now()) / (60 * 1000)); // en minutos
    return `Too many login attempts. Please try again in ${timeLeft} minutes.`;
  }
});

module.exports = class AuthController {
    /**
     * @param {import('../service/authService')} authService
     */
    constructor(authService) {
      this.authService = authService;
      this.ROUTE_BASE = '/auth';
      this.AUTH_VIEWS = 'auth/views';

      this.login = this.login.bind(this);
      this.processLogin = this.processLogin.bind(this);
      this.register = this.register.bind(this);
      this.processRegister = this.processRegister.bind(this);
      this.logout = this.logout.bind(this);
      this.profile = this.profile.bind(this);
      this.editProfile = this.editProfile.bind(this);
      this.processEditProfile = this.processEditProfile.bind(this);
      this.changePassword = this.changePassword.bind(this);
      this.processChangePassword = this.processChangePassword.bind(this);
    }
  
    /**
     * @param {import('express').Application} app
     */
    configureRoutes(app) {
      const ROUTE = this.ROUTE_BASE;
      app.get(`${ROUTE}/login`, this.login.bind(this));
      app.post(`${ROUTE}/login`, loginLimiter, this.processLogin.bind(this));
      app.get(`${ROUTE}/logout`, (req, res) => this.logout(req, res));
      app.get(`${ROUTE}/register`, (req, res) => this.register(req, res));
      app.post(`${ROUTE}/register`, (req, res) => this.processRegister(req, res));
      if (process.env.NODE_ENV !== 'production') {
        app.get(`${this.ROUTE_BASE}/debug`, this.debug.bind(this));
      }
      app.get('/profile', (req, res) => this.profile(req, res));
      app.get('/profile/edit', (req, res) => this.editProfile(req, res));
      app.post('/profile/edit', (req, res) => this.processEditProfile(req, res));
      app.get('/profile/change-password', (req, res) => this.changePassword(req, res));
      app.post('/profile/change-password', (req, res) => this.processChangePassword(req, res));
    }
  
    /**
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async login(req, res) {
        res.render('pages/auth/login.njk', {
            title: 'Login',
            error: req.flash('error'),
            success: req.flash('success')
        });
    }
  
    /**
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async processLogin(req, res) {
      try {
          const { email, password } = req.body;
          const { auth, client } = await this.authService.login(email, password);
          
          req.session.clientId = client.id;
          req.session.auth = {
              id: auth.id,
              username: auth.username
          };
          req.session.role = client.role;
  
          await new Promise((resolve, reject) => {
              req.session.save(err => {
                  if (err) {
                      console.error('❌ Session save error:', err);
                      reject(err);
                  } else {
                      resolve();
                  }
              });
          });
          const returnTo = req.session.returnTo;
          delete req.session.returnTo;

          if (returnTo) {
              console.log('↩️ Redirecting to saved URL:', returnTo);
              res.redirect(returnTo);
          } else {
              res.redirect('/');
          }
      } catch (error) {
          console.error('❌ Login error:', error);
          req.flash('error', 'Invalid credentials');
          res.redirect('/auth/login');
      }
  }
  
    /**
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async logout(req, res) {
        console.log('🔒 Logging out user:', req.session?.clientId);
        req.session.destroy((err) => {
            if (err) {
                console.error('❌ Error destroying session:', err);
            }
            res.redirect('/');
        });
    }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  authMiddleware(req, res, next) {
      if (!isAuthenticated) {
          return res.redirect("/auth/login");
      }
      next();
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async register(req, res) {
    res.render('pages/auth/register.njk', {
      title: 'Register',
      error: req.flash('error')
    });
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async processRegister(req, res) {
    try {
        const requiredFields = ['name', 'surname', 'email', 'phone', 'idType', 'idNumber', 'password'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            req.flash('error', `Missing required fields: ${missingFields.join(', ')}`);
            return res.redirect('/auth/register');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.email)) {
            req.flash('error', 'Invalid email format');
            return res.redirect('/auth/register');
        }
        if (req.body.password !== req.body.confirmPassword) {
            req.flash('error', 'Passwords do not match');
            return res.redirect('/auth/register');
        }

        const clientData = {
            name: req.body.name,
            surname: req.body.surname,
            email: req.body.email,
            phone: req.body.phone,
            idType: req.body.idType,
            idNumber: req.body.idNumber,
            birthDate: req.body.birthDate,
            nationality: req.body.nationality,
            address: req.body.address,
            password: req.body.password
        };

        console.log('📝 Processed client data:', clientData);

        await this.authService.register(clientData);
        req.flash('success', 'Registration successful! Please login.');
        res.redirect('/auth/login');
    } catch (error) {
        console.error('❌ Registration error:', error);
        req.flash('error', error.message);
        res.redirect('/auth/register');
    }
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async debug(req, res) {
    try {
      const clients = await this.authService.clientRepository.getAll();
      res.json(clients);
    } catch (error) {
      console.error('❌ Debug error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async profile(req, res) {
    try {
        if (!req.session?.clientId) {
            throw new Error('Not authenticated');
        }

        const client = await this.authService.getClientProfile(req.session.clientId);
        if (!client) {
            throw new Error('Client not found');
        }

        res.render('pages/profile.njk', { client });
    } catch (error) {
        console.error('❌ Profile error:', error);
        req.flash('error', 'Please login to view your profile');
        res.redirect('/auth/login');
    }
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async editProfile(req, res) {
    try {
        if (!req.session?.clientId) {
            req.flash('error', 'Please login to edit your profile');
            return res.redirect('/auth/login');
        }

        const client = await this.authService.getClientProfile(req.session.clientId);
        
        res.render('pages/edit-profile.njk', {
            title: 'Edit Profile',
            client
        });
    } catch (error) {
        console.error('❌ Edit profile error:', error);
        req.flash('error', error.message);
        res.redirect('/profile');
    }
}

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async processEditProfile(req, res) {
    try {
        if (!req.session?.clientId) {
            req.flash('error', 'Please login to edit your profile');
            return res.redirect('/auth/login');
        }

        const updatedClient = await this.authService.updateProfile(
            req.session?.clientId,
            {
                name: req.body.name,
                surname: req.body.surname,
                phone: req.body.phone,
                address: req.body.address
            }
        );

        req.session.client = updatedClient;
        req.flash('success', 'Profile updated successfully');
        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating profile:', error);
        req.flash('error', error.message);
        res.redirect('/profile/edit');
    }
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async changePassword(req, res) {
    try {
      res.render('pages/change-password.njk', {
        title: 'Change Password'
      });
    } catch (error) {
      req.flash('error', error.message);
      res.redirect('/profile');
    }
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async processChangePassword(req, res) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      
      if (newPassword !== confirmPassword) {
        req.flash('error', 'New passwords do not match');
        return res.redirect('/profile/change-password');
      }
      
      await this.authService.changePassword(req.session.clientId, currentPassword, newPassword);
      req.flash('success', 'Password changed successfully');
      res.redirect('/profile');
    } catch (error) {
      req.flash('error', error.message);
      res.redirect('/profile/change-password');
    }
  }
};
