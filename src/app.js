require('dotenv').config();
const express = require("express");
const nunjucks = require("nunjucks");
const path = require("path");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);

const { sequelizeRental } = require("./config/dbRental");
const { sequelizeAuth } = require("./config/dbAuth");


const RentalModel = require("./module/rental/model/rentalModel");
const CarModel = require("./module/car/model/carModel");
const ClientModel = require("./module/client/model/clientModel");
const AuthModel = require("./module/auth/model/authModel");
const AuthService = require("./module/auth/service/authService");
const RentalController = require("./module/rental/controller/rentalController");
const AuthController = require("./module/auth/controller/authController");

const PORT = 8080;
const app = express();

app.use(
  session({
    store: new SQLiteStore({ db: "sessions.sqlite", dir: "./data" }),
    secret: process.env.SESSION_PW,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true },
  })
);

CarModel.setup(sequelizeRental);
ClientModel.setup(sequelizeRental);
RentalModel.setup(sequelizeRental);
RentalModel.setAssociations(CarModel, ClientModel);
AuthModel.setup(sequelizeAuth);

Promise.all([sequelizeRental.sync({ alter: true }), sequelizeAuth.sync({ alter: true })])
  .then(() => console.log("Databases synchronized successfully"))
  .catch((error) => console.error("Error synchronizing databases:", error));

nunjucks.configure(path.join(__dirname, "views"), {
  autoescape: true,
  express: app,
  watch: true,
});

app.set("view engine", "njk");
app.use(express.static(path.join(__dirname, "../static")));
app.use("/images", express.static(path.join(__dirname, "../static/images")));
app.use(express.json());

const authService = new AuthService(AuthModel);
const authController = new AuthController(authService);

authController.configureRoutes(app);

app.use("/", RentalController);
app.use("/auth", AuthController); 

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
