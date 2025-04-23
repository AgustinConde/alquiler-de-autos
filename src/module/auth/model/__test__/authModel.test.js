const { Sequelize, DataTypes } = require('sequelize');
const AuthModel = require('../authModel');

describe('AuthModel', () => {
  let sequelize;

  beforeAll(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    AuthModel.setup(sequelize);
    await sequelize.sync();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('should initialize the model correctly', () => {
    const attributes = AuthModel.getAttributes();
    expect(attributes).toHaveProperty('id');
    expect(attributes.username.type.key).toBe('STRING');
    expect(attributes.passwordHash.type.key).toBe('STRING');
    expect(attributes.clientId.type.key).toBe('INTEGER');
    expect(attributes.username.allowNull).toBe(false);
    expect(attributes.passwordHash.allowNull).toBe(false);
    expect(attributes.clientId.allowNull).toBe(false);
    expect(attributes.username.unique).toBe(true);
    expect(attributes.id.primaryKey).toBe(true);
    expect(attributes.id.autoIncrement).toBe(true);
  });

  test('should create a record successfully', async () => {
    const auth = await AuthModel.create({
      username: 'testuser',
      passwordHash: 'hashedpass',
      clientId: 1
    });
    expect(auth.id).toBeDefined();
    expect(auth.username).toBe('testuser');
    expect(auth.passwordHash).toBe('hashedpass');
    expect(auth.clientId).toBe(1);
  });

  test('should require mandatory fields', async () => {
    await expect(AuthModel.create({})).rejects.toThrow();
  });

  test('should set associations with ClientModel', () => {
    const mockBelongsTo = jest.fn();
    const MockClientModel = {};
    AuthModel.belongsTo = mockBelongsTo;
    const result = AuthModel.setAssociations(MockClientModel);
    expect(mockBelongsTo).toHaveBeenCalledWith(MockClientModel, {
      foreignKey: 'clientId',
      as: 'client',
    });
    expect(result).toBe(AuthModel);
  });
});
