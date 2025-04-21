const { Sequelize, DataTypes } = require('sequelize');
const AuditModel = require('../auditModel');

describe('AuditModel', () => {
  let sequelize;

  beforeAll(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    AuditModel.setup(sequelize);
    await sequelize.sync();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('should initialize the model correctly', () => {
    const attributes = AuditModel.getAttributes();
    expect(attributes).toHaveProperty('id');
    expect(attributes.entityType.type).toBeInstanceOf(DataTypes.ENUM);
    expect(attributes.entityType.values).toEqual(['car', 'client', 'rental']);
    expect(attributes.actionType.values).toEqual(['delete', 'update', 'create', 'restore']);
    expect(attributes.data.type.key).toBe('JSON');
    expect(attributes.performedByEmail.type.key).toBe('STRING');
    expect(attributes.restoredAt.type.key).toBe('DATE');
  });

  test('should create a record successfully', async () => {
    const audit = await AuditModel.create({
      entityType: 'car',
      entityId: 1,
      actionType: 'create',
      data: { foo: 'bar' },
      performedBy: 123,
      performedByEmail: 'test@example.com',
      restoredAt: null
    });
    expect(audit.id).toBeDefined();
    expect(audit.entityType).toBe('car');
    expect(audit.data).toEqual({ foo: 'bar' });
  });

  test('should require mandatory fields', async () => {
    await expect(AuditModel.create({})).rejects.toThrow();
  });

  test('should allow null values for performedBy and performedByEmail', async () => {
    const audit = await AuditModel.create({
      entityType: 'client',
      entityId: 2,
      actionType: 'update',
      data: { test: true },
      performedBy: null,
      performedByEmail: null,
      restoredAt: null
    });
    expect(audit.performedBy).toBeNull();
    expect(audit.performedByEmail).toBeNull();
  });
});
