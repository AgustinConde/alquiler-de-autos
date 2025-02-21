require("dotenv").config();
<<<<<<< Updated upstream
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

=======
const { Sequelize } = require('sequelize');
const ClientModel = require('./models/clientModel');
const AuthModel = require('./models/authModel');
const RentalModel = require('./models/rentalModel');

const sequelize = new Sequelize({ 
    dialect: 'sqlite', 
    storage: process.env.AUTHDB_PATH 
});

ClientModel.setup(sequelize);
AuthModel.setup(sequelize);
RentalModel.setup(sequelize);

ClientModel.hasOne(AuthModel, { foreignKey: 'clientId', as: 'auth' });
AuthModel.belongsTo(ClientModel, { foreignKey: 'clientId', as: 'client' });

sequelize.sync();
>>>>>>> Stashed changes
module.exports = sequelize;
