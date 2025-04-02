const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

if (process.env.NODE_ENV !== 'production') {
        const sessionsPath = path.join(dataDir, 'sessions.sqlite');
        if (fs.existsSync(sessionsPath)) {
            fs.unlinkSync(sessionsPath);
            console.log('🗑️ Old sessions cleared');
        }
}

module.exports = session({
    store: new SQLiteStore({
        db: 'sessions.sqlite',
        dir: dataDir,
        table: 'sessions'
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.USE_HTTPS === 'true',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
});
