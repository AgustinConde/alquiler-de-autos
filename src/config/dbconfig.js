require("dotenv").config();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const rentalDbPath = path.join(dataDir, 'rentalDb.sqlite');

module.exports = {
  development: {
    rental: {
      storage: process.env.RENTALDB_PATH || rentalDbPath,
      dialect: 'sqlite',
      logging: false,
    }
  }
};
