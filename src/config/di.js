const fs = require('fs');
const path = require('path');

const { default: DIContainer, object, get, factory } = require('rsdi');
const Sequelize = require('sequelize');
const multer = require('multer');

const { DefaultController } = require('../module/default/defaultModule');
const { CarController, CarService, CarRepository, CarModel } = require('../module/car/carModule');
const { ClientController, ClientService, ClientRepository, ClientModel } = require('../module/client/clientModule');
const { RentalController, RentalService, RentalRepository, RentalModel } = require('../module/rental/rentalModule');
const { AuthController, AuthService, AuthRepository, AuthModel } = require('../module/auth/authModule');
const { AuditController, AuditService, AuditRepository, AuditModel,} = require('../module/audit/auditModule');

function configureRentalSequelize() {
    return new Sequelize({
        dialect: 'sqlite',
        storage: './src/data/rentalDb.sqlite',
        logging: false
    });
}

/**
 * @param {DIContainer} container
 */
function configureCarModule(container) {
  return CarModel.setup(container.get('RentalSequelize'));
}

/**
 * @param {DIContainer} container
 */
function configureClientModule(container) {
  return ClientModel.setup(container.get('RentalSequelize'));
}

/**
 * @param {DIContainer} container
 */
function configureRentalModule(container) {
  const model = RentalModel.setup(container.get('RentalSequelize'));
  model.setAssociations();
  return model;
}

/**
 * @param {DIContainer} container
 */
function configureAuthModule(container) {
  const model = AuthModel.setup(container.get('RentalSequelize'));
  model.setAssociations(container.get('ClientModel'));
  return model;
}

/**
 * @param {DIContainer} container
 */
function configureAuditModule(container) {
  return AuditModel.setup(container.get('RentalSequelize'));
}

function configureMulter() {
  const storage = multer.diskStorage({
    destination(req, file, cb) {
      const dir = `${process.env.MULTER_UPLOADS_DIR}/`;
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(req, file, cb) {
      cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
  });
  return multer({ storage });
}

/**
 * @param {DIContainer} container
 */
function addCommonDefinitions(container) {
  container.addDefinitions({
    RentalSequelize: object(configureRentalSequelize),
    Multer: factory(configureMulter),
    DefaultController: object(DefaultController).construct(
      get('RentalService'),
      get('CarService')
    ),
  });
}

/**
 * @param {DIContainer} container
 */
function addCarModuleDefinitions(container) {
  container.addDefinitions({
    CarModel: factory(configureCarModule),
    CarRepository: object(CarRepository).construct(
      get('CarModel'),
      get('AuditRepository')
    ),
    CarService: object(CarService).construct(get('CarRepository')),
    CarController: object(CarController).construct(
      get('CarService'),
      get('AuditService')
    )
  });
}

/**
 * @param {DIContainer} container
 */
function addClientModuleDefinitions(container) {
  container.addDefinitions({
    ClientModel: factory(configureClientModule),
    ClientRepository: object(ClientRepository).construct(get('ClientModel')),
    ClientService: object(ClientService).construct(get('ClientRepository')),
    ClientController: object(ClientController).construct(get('ClientService'))
  });
}

/**
 * @param {DIContainer} container
 */
function addRentalModuleDefinitions(container) {
  container.addDefinitions({
    RentalSequelize: object(configureRentalSequelize),
    RentalModel: factory(configureRentalModule),
    RentalRepository: object(RentalRepository).construct(get('RentalModel')),
    RentalService: object(RentalService).construct(
      get('RentalRepository'),
      get('CarRepository')
    ),
    RentalController: object(RentalController).construct(
      get('RentalService'),
      get('CarService'),
      get('ClientService'),
      get('AuditService'))
  });
}

/**
 * @param {DIContainer} container
 */
function addAuthModuleDefinitions(container) {
  container.addDefinitions({
    AuthModel: factory(configureAuthModule),
    AuthRepository: object(AuthRepository).construct(get('AuthModel')),
    AuthService: object(AuthService).construct(
        get('AuthRepository'),
        get('ClientRepository')
    ),
    AuthController: object(AuthController).construct(get('AuthService'))
  });
}

/**
 * @param {DIContainer} container
 */
function addAuditModuleDefinitions(container) {
  container.addDefinitions({
    AuditModel: factory(configureAuditModule),
    AuditRepository: object(AuditRepository).construct(
      get('AuditModel'),
      get('CarModel'),
      get('RentalModel')
    ),
    AuditService: object(AuditService).construct(
      get('AuditRepository'),
      get('CarRepository'),
      get('ClientRepository'),
      get('RentalRepository')
    ),
    AuditController: object(AuditController).construct(get('AuditService'))
  });
}

/**
 * @returns {DIContainer}
 */
module.exports = function diConfig() {
  const container = new DIContainer();

  container.addDefinitions({
    RentalSequelize: object(configureRentalSequelize)
  });

  addCommonDefinitions(container);
  addCarModuleDefinitions(container);
  addClientModuleDefinitions(container);
  addAuditModuleDefinitions(container);
  addRentalModuleDefinitions(container);
  addAuthModuleDefinitions(container);

  return container;
}
