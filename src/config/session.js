const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const { prepareSessionStorage } = require('./sessionUtils');

const dataDir = path.join(__dirname, '..', 'data');
const sessionsPath = path.join(dataDir, 'sessions.sqlite');

prepareSessionStorage({
  dataDir,
  sessionsFile: sessionsPath,
  nodeEnv: process.env.NODE_ENV,
});

module.exports = session({
  store: new SQLiteStore({
    db: 'sessions.sqlite',
    dir: dataDir,
  }),
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    sameSite: true,
  },
});
