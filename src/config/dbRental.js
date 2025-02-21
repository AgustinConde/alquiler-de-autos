require("dotenv").config();
const { Sequelize } = require("sequelize");
console.log("RENTALDB Path:", process.env.RENTALDB_PATH);


const sequelizeRental = new Sequelize({
  dialect: "sqlite",
  storage: process.env.RENTALDB_PATH,
  logging: (msg) => console.log(`Rental DB log: ${msg}`)
});

sequelizeRental
  .authenticate()
  .then(() => console.log("✅ Connection to rental database established successfully."))
  .catch((err) => console.error("❌ Unable to connect to the rental database:", err));

  
module.exports = { sequelizeRental };
