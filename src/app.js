require('dotenv').config();
const sequelize = require("./config/database");
const CarModel = require("./module/car/model/carModel");
const ClientModel = require("./module/client/model/clientModel");
const RentalModel = require("./module/rental/model/rentalModel");
const express = require("express");
const rentalController = require("./module/rental/controller/rentalController");
const PORT = 8080;
const nunjucks = require('nunjucks');
const path = require('path');

const app = express();

const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);

app.use(session({
    store: new SQLiteStore({ db: 'sessions.sqlite', dir: './data' }),
    secret: process.env.SESSION_PW,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true }
}));


CarModel.setup(sequelize);
ClientModel.setup(sequelize);
RentalModel.setup(sequelize);

RentalModel.setAssociations(CarModel, ClientModel);



sequelize.sync({ alter:true })
    .then( () => console.log("Database syncronized succesfully with models"))
   .catch ((error) => {
    console.error("Error syncronizing database with models:", error);
  });


nunjucks.configure(path.join(__dirname, 'views'), {
    autoescape: true,
    express: app,
    watch: true,
});
app.set('view engine', 'njk');
app.use(express.static(path.join(__dirname, '../static')));
app.use('/images', express.static(path.join(__dirname, '../static/images')));
app.use(express.json());


app.use("/", rentalController);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = express;
