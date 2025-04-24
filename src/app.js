require('dotenv').config();
const express = require('express');
const nunjucks = require('nunjucks');
const flash = require('connect-flash');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const dateFilter = require('nunjucks-date-filter');
const path = require('path');
const sessionMiddleware = require('./config/session');
const { isAuthenticated } = require('./module/auth/middleware/authMiddleware');

const diConfig = require('./config/di');
const { initCarModule } = require('./module/car/carModule');
const { initClientModule } = require('./module/client/clientModule');
const { initRentalModule } = require('./module/rental/rentalModule');
const { initAuditModule } = require('./module/audit/auditModule');
const { initAuthModule } = require('./module/auth/authModule');
const { initPaymentModule } = require('./module/payment/paymentModule');
const { connect } = require('http2');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/favicon.ico', (req, res) => {
  const faviconPath = path.join(__dirname, '..', 'public', 'favicon.ico');
  
  res.sendFile(faviconPath, (err) => {
    if (err) {
      console.log('⚠️ Favicon not found, sending empty response');
      res.status(204).end();
    }
  });
});

app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://use.fontawesome.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://use.fontawesome.com"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://use.fontawesome.com", "data:"],
        imgSrc: ["'self'", "data:", "https://use.fontawesome.com"],
        connectSrc: ["'self'", "https://use.fontawesome.com"],
      }
    },
    referrerPolicy: { policy: "no-referrer-when-downgrade" }
  }));

app.use(sessionMiddleware);
app.use(flash());

app.use((req, res, next) => {
    if (req.method === 'GET' && (
      req.path.endsWith('.ico') || 
      req.path.startsWith('/css/') || 
      req.path.startsWith('/js/') ||
      req.path.startsWith('/images/') ||
      req.path.startsWith('/uploads/') ||
      req.path === '/favicon.ico' ||
      req.hostname === 'use.fontawesome.com'
    )) {
      return next();
    }

    if (!req.session.csrfToken) {
      req.session.csrfToken = uuidv4();
    }
    
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      let token = null;
      
      if (req.body && req.body._csrf) {
        token = req.body._csrf;
      }
      
      if (!token && req.headers['x-csrf-token']) {
        token = req.headers['x-csrf-token'];
      }
      
      if (!token && req.query && req.query._csrf) {
        token = req.query._csrf;
      }
      
      if (!token && req.body && typeof req.body === 'object') {
        if (JSON.stringify(req.body).includes('_csrf')) {
          console.log('🔍 Buscando token CSRF en body procesado:', req.body);
        }
      }
      
      if (token !== req.session.csrfToken) {
        console.log('❌ CSRF validation failed', { 
          provided: token,
          expected: req.session.csrfToken
        });
        
        if (req.xhr || req.headers.accept?.includes('json')) {
          return res.status(403).json({ error: 'CSRF token validation failed' });
        }
        req.flash('error', 'Form submission failed. Please try again.');
        return res.redirect('back');
      } else {
        console.log('✅ CSRF token validated successfully');
      }
    }
    
    res.locals.csrfToken = req.session.csrfToken;
    next();
  });

const viewPaths = [
    path.join(__dirname, 'views'),
    path.join(__dirname, 'module')
];

const env = nunjucks.configure(viewPaths, {
    autoescape: true,
    express: app,
    watch: true
});
app.set('view engine', 'njk');
env.addFilter('date', dateFilter);


app.use(isAuthenticated);

app.use((req, res, next) => {
    console.log('📍 Request:', {
        method: req.method,
        url: req.url,
        sessionId: req.sessionID,
        hasSession: !!req.session,
        clientId: req.session?.clientId
    });
    next();
});

app.use((req, res, next) => {
    res.locals.client = req.session.clientId ? {
        id: req.session.clientId,
        role: req.session.userRole
    } : null;
    res.locals.flash = req.flash();
    next();
});

const container = diConfig();
app.set('container', container);
initAuthModule(app, container);
initCarModule(app, container);
initClientModule(app, container);
initRentalModule(app, container);
initAuditModule(app, container);
initPaymentModule(app, container);

const rentalSequelize = container.get('RentalSequelize');

rentalSequelize.sync({ force: process.env.NODE_ENV !== 'production'  })
.then(async () => {
    console.log('🗃️ Database sync successful');
    const defaultController = container.get('DefaultController');
    defaultController.configureRoutes(app);

    app.use((err, req, res, next) => {
        console.error('❌ Error:', err);
        res.status(500).render('error.njk', {
            error: process.env.NODE_ENV === 'development' ? err : 'An unexpected error occurred'
        });
    });

    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
})
.catch((error) => {
    console.error('❌ Database sync error:', error);
    process.exit(1);
});
