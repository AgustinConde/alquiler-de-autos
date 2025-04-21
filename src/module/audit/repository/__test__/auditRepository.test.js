const AuditRepository = require('../auditRepository');

describe('AuditRepository', () => {
  let mockAuditModel;
  let repository;

  beforeEach(() => {
    mockAuditModel = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
    };
    repository = new AuditRepository(mockAuditModel, {}, {});
  });

  describe('logAction', () => {
    test('should create an audit log and return it', async () => {
      const audit = { id: 1 };
      mockAuditModel.create.mockResolvedValue(audit);
      const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
      const result = await repository.logAction('car', 1, 'create', { foo: 'bar' });
      expect(mockAuditModel.create).toHaveBeenCalledWith(expect.objectContaining({
        entityType: 'car',
        entityId: 1,
        actionType: 'create',
        data: { foo: 'bar' },
        performedBy: undefined,
        performedByEmail: undefined,
      }));
      expect(result).toBe(audit);
      expect(consoleLog).toHaveBeenCalled();
      consoleLog.mockRestore();
    });

    test('should handle errors and throw with message', async () => {
      mockAuditModel.create.mockRejectedValue(new Error('fail'));
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(repository.logAction('car', 1, 'create', {}, {})).rejects.toThrow('Error creating audit log: fail');
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('create', () => {
    test('should call auditModel.create', async () => {
      const data = { foo: 'bar' };
      mockAuditModel.create.mockResolvedValue(data);
      const result = await repository.create(data);
      expect(mockAuditModel.create).toHaveBeenCalledWith(data);
      expect(result).toBe(data);
    });
  });

  describe('getAll', () => {
    test('should call auditModel.findAll with order', async () => {
      const audits = [{ id: 1 }];
      mockAuditModel.findAll.mockResolvedValue(audits);
      const result = await repository.getAll();
      expect(mockAuditModel.findAll).toHaveBeenCalledWith({ order: [['createdAt', 'DESC']] });
      expect(result).toBe(audits);
    });
  });

  describe('getById', () => {
    test('should call auditModel.findByPk', async () => {
      const audit = { id: 1 };
      mockAuditModel.findByPk.mockResolvedValue(audit);
      const result = await repository.getById(1);
      expect(mockAuditModel.findByPk).toHaveBeenCalledWith(1);
      expect(result).toBe(audit);
    });
  });

  describe('update', () => {
    test('should update an existing audit log', async () => {
      const audit = { update: jest.fn().mockResolvedValue({ updated: true }) };
      mockAuditModel.findByPk.mockResolvedValue(audit);
      const result = await repository.update(1, { foo: 'bar' });
      expect(mockAuditModel.findByPk).toHaveBeenCalledWith(1);
      expect(audit.update).toHaveBeenCalledWith({ foo: 'bar' });
      expect(result).toEqual({ updated: true });
    });
    test('should throw if audit log not found', async () => {
      mockAuditModel.findByPk.mockResolvedValue(null);
      await expect(repository.update(1, {})).rejects.toThrow('Audit log not found');
    });
  });
});
