const { DataTypes, Sequelize, Model } = require('sequelize');
const ClientModel = require('../clientModel');

describe('ClientModel', () => {
  let sequelize;

  beforeEach(() => {
    sequelize = new Sequelize('sqlite::memory:');
  });

  test('setup should initialize the model with correct fields', () => {
    const ModelClass = ClientModel.setup(sequelize);
    expect(ModelClass === ClientModel).toBe(true);
    expect(ModelClass.tableName).toBe('clients');
    expect(ModelClass.getAttributes()).toHaveProperty('id');
    expect(ModelClass.getAttributes()).toHaveProperty('name');
    expect(ModelClass.getAttributes()).toHaveProperty('surname');
    expect(ModelClass.getAttributes()).toHaveProperty('idType');
    expect(ModelClass.getAttributes()).toHaveProperty('idNumber');
    expect(ModelClass.getAttributes()).toHaveProperty('nationality');
    expect(ModelClass.getAttributes()).toHaveProperty('address');
    expect(ModelClass.getAttributes()).toHaveProperty('phone');
    expect(ModelClass.getAttributes()).toHaveProperty('email');
    expect(ModelClass.getAttributes()).toHaveProperty('password');
    expect(ModelClass.getAttributes()).toHaveProperty('birthDate');
    expect(ModelClass.getAttributes()).toHaveProperty('role');
  });

  test('setAssociations should call hasOne and return ClientModel', () => {
    const AuthModel = class extends Model {};
    const spy = jest.spyOn(ClientModel, 'hasOne').mockImplementation(() => {});
    const result = ClientModel.setAssociations(AuthModel);
    expect(spy).toHaveBeenCalledWith(AuthModel, { foreignKey: 'clientId', as: 'Auth', onDelete: 'CASCADE' });
    expect(result).toBe(ClientModel);
    spy.mockRestore();
  });
});
