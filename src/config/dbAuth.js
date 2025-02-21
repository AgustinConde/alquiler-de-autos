require("dotenv").config();
const { Sequelize } = require('sequelize');
console.log("AUTHDB Path:", process.env.AUTHDB_PATH);


const sequelizeAuth = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.AUTHDB_PATH,
  logging: (msg) => console.log(`Auth DB log: ${msg}`),
});

sequelizeAuth
  .authenticate()
  .then(() => console.log("✅ Connection to auth database established successfully."))
  .catch((err) => console.error("❌ Unable to connect to the auth database:", err));


module.exports = { sequelizeAuth };
