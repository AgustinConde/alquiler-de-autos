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
const { PaymentController, PaymentService, PaymentRepository, PaymentModel } = require('../module/payment/paymentModule');


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
  model.setAssociations(container.get('CarModel'), container.get('ClientModel'));
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

/**
 * @param {DIContainer} container
 */
function configurePaymentModule(container) {
  const model = PaymentModel.setup(container.get('RentalSequelize'));
  model.setAssociations(container.get('RentalModel'));
  return model;
}

function configureMulter() {
  const storage = multer.diskStorage({
    destination(req, file, cb) {
      const dir = `${process.env.MULTER_UPLOADS_DIR}/`;
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(req, file, cb) {
      const sanitizedName = path.basename(file.originalname).replace(/[^a-zA-Z0-9_.-]/g, '_');
      cb(null, `${file.fieldname}-${Date.now()}${path.extname(sanitizedName)}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  };
  
  return multer({ 
    storage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB
    }
  });
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
 * @param {DIContainer} container
 */
function addPaymentModuleDefinitions(container) {
  container.addDefinitions({
    PaymentModel: factory(configurePaymentModule),
    PaymentRepository: object(PaymentRepository).construct(get('PaymentModel')),
    PaymentService: object(PaymentService).construct(
      get('PaymentRepository'),
      get('RentalService')
    ),
    PaymentController: object(PaymentController).construct(get('PaymentService'))
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
  addPaymentModuleDefinitions(container);

  return container;
}
