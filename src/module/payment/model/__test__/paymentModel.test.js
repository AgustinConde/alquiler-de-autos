const { Sequelize, DataTypes, Model } = require('sequelize');
const PaymentModel = require('../paymentModel');

describe('PaymentModel', () => {
  let sequelize;

  beforeEach(() => {
    sequelize = new Sequelize('sqlite::memory:');
  });

  test('setup should initialize the model with correct fields', () => {
    const ModelClass = PaymentModel.setup(sequelize);
    expect(ModelClass === PaymentModel).toBe(true);
    expect(ModelClass.tableName).toBe('payments');
    const attrs = ModelClass.getAttributes();
    expect(attrs).toHaveProperty('id');
    expect(attrs).toHaveProperty('rentalId');
    expect(attrs).toHaveProperty('amount');
    expect(attrs).toHaveProperty('provider');
    expect(attrs).toHaveProperty('transactionId');
    expect(attrs).toHaveProperty('status');
  });

  test('setAssociations should call hasMany and belongsTo and return PaymentModel', () => {
    const RentalModel = class extends Model {};
    RentalModel.hasMany = jest.fn();
    PaymentModel.belongsTo = jest.fn();
    const result = PaymentModel.setAssociations(RentalModel);
    expect(RentalModel.hasMany).toHaveBeenCalledWith(PaymentModel, { foreignKey: 'rentalId' });
    expect(PaymentModel.belongsTo).toHaveBeenCalledWith(RentalModel, { foreignKey: 'rentalId' });
    expect(result).toBe(PaymentModel);
    delete PaymentModel.belongsTo;
  });
});
