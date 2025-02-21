require("dotenv").config();
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
module.exports = sequelize;
