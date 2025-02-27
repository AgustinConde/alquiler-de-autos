require('dotenv').config();
const express = require('express');
const nunjucks = require('nunjucks');
const flash = require('connect-flash');
const path = require('path');
const sessionMiddleware = require('./config/session');
const { isAuthenticated } = require('./module/auth/middleware/authMiddleware');

const diConfig = require('./config/di');
const { initCarModule } = require('./module/car/carModule');
const { initClientModule } = require('./module/client/clientModule');
const { initRentalModule } = require('./module/rental/rentalModule');
const { initBackupModule } = require('./module/backup/backupModule');
const { initAuthModule } = require('./module/auth/authModule');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

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
env.addFilter('date', function(str) {
    return new Date(str).toLocaleDateString();
});

app.use(sessionMiddleware);
app.use(flash());
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
    res.locals.user = req.session.clientId ? {
        id: req.session.clientId,
        role: req.session.role
    } : null;
    res.locals.flash = req.flash();
    next();
});

const container = diConfig();
initAuthModule(app, container);
initCarModule(app, container);
initClientModule(app, container);
initRentalModule(app, container);
initBackupModule(app, container);

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
