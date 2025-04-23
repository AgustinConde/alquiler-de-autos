jest.mock('../../../car/model/carModel', () => class CarModelMock {});
jest.mock('../../../client/model/clientModel', () => class ClientModelMock {});

const { Sequelize, Model } = require('sequelize');
const RentalModel = require('../rentalModel');

describe('RentalModel', () => {
  let sequelize;

  beforeEach(() => {
    sequelize = new Sequelize('sqlite::memory:');
  });

  test('setup should initialize the model with correct fields', () => {
    const ModelClass = RentalModel.setup(sequelize);
    expect(ModelClass === RentalModel).toBe(true);
    expect(ModelClass.tableName).toBe('rentals');
    const attrs = ModelClass.getAttributes();
    expect(attrs).toHaveProperty('id');
    expect(attrs).toHaveProperty('rentedCar');
    expect(attrs).toHaveProperty('rentedTo');
    expect(attrs).toHaveProperty('pricePerDay');
    expect(attrs).toHaveProperty('rentalStart');
    expect(attrs).toHaveProperty('rentalEnd');
    expect(attrs).toHaveProperty('totalPrice');
    expect(attrs).toHaveProperty('paymentMethod');
    expect(attrs).toHaveProperty('isPaid');
    expect(attrs).toHaveProperty('deletedAt');
  });

  test('setAssociations should call hasMany and belongsTo for CarModel and ClientModel', () => {
    const CarModel = class extends Model {};
    const ClientModel = class extends Model {};
    CarModel.hasMany = jest.fn();
    RentalModel.belongsTo = jest.fn();
    ClientModel.hasMany = jest.fn();
    const result = RentalModel.setAssociations(CarModel, ClientModel);
    expect(CarModel.hasMany).toHaveBeenCalledWith(RentalModel, { foreignKey: 'rentedCar', onDelete: 'CASCADE' });
    expect(RentalModel.belongsTo).toHaveBeenCalledWith(CarModel, { foreignKey: 'rentedCar' });
    expect(ClientModel.hasMany).toHaveBeenCalledWith(RentalModel, { foreignKey: 'rentedTo', onDelete: 'CASCADE' });
    expect(RentalModel.belongsTo).toHaveBeenCalledWith(ClientModel, { foreignKey: 'rentedTo' });
    expect(result).toBe(RentalModel);
    delete RentalModel.belongsTo;
  });

  test('should validate rentalEnd is after rentalStart (valid case)', async () => {
    const ModelClass = RentalModel.setup(sequelize);
    await expect(ModelClass.build({
      id: 2,
      rentedCar: 1,
      rentedTo: 1,
      pricePerDay: 10,
      rentalStart: '2024-04-23',
      rentalEnd: '2024-04-24',
      totalPrice: 20,
      paymentMethod: 'Card',
      isPaid: false
    }).validate()).resolves.toBeInstanceOf(ModelClass);
  });

  test('should validate rentalEnd is after rentalStart (equal dates, should fail)', async () => {
    const ModelClass = RentalModel.setup(sequelize);
    await expect(ModelClass.build({
      id: 3,
      rentedCar: 1,
      rentedTo: 1,
      pricePerDay: 10,
      rentalStart: '2024-04-23',
      rentalEnd: '2024-04-23',
      totalPrice: 10,
      paymentMethod: 'Card',
      isPaid: false
    }).validate()).rejects.toThrow('Rental end must be after rental start.');
  });
});
