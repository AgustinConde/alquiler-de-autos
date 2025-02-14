require("dotenv").config();
const { Sequelize } = require("sequelize");
console.log("Database path:", process.env.DB_PATH);


const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_PATH,
  logging: (msg) => console.log(`Sequelize log: ${msg}`)
});

sequelize
  .authenticate()
  .then(() => console.log("✅ Connection to database established successfully."))
  .catch((err) => console.error("❌ Unable to connect to the database:", err));

module.exports = sequelize;
