const AuditService = require('../auditService');

describe('AuditService', () => {
  let mockAuditRepository;
  let mockCarRepository;
  let mockClientRepository;
  let mockRentalRepository;
  let service;

  beforeEach(() => {
    mockAuditRepository = {
      logAction: jest.fn(),
      getAll: jest.fn(),
      getById: jest.fn(),
      update: jest.fn(),
    };
    mockCarRepository = { restore: jest.fn() };
    mockClientRepository = { restore: jest.fn() };
    mockRentalRepository = { restore: jest.fn() };
    service = new AuditService(
      mockAuditRepository,
      mockCarRepository,
      mockClientRepository,
      mockRentalRepository
    );
  });

  test('createAuditLog should call auditRepository.logAction', async () => {
    mockAuditRepository.logAction.mockResolvedValue('ok');
    const result = await service.createAuditLog('car', 1, 'create', { foo: 'bar' }, { id: 2 });
    expect(mockAuditRepository.logAction).toHaveBeenCalledWith('car', 1, 'create', { foo: 'bar' }, { id: 2 });
    expect(result).toBe('ok');
  });

  test('createAuditLog should call auditRepository.logAction with user = null by default', async () => {
    mockAuditRepository.logAction.mockResolvedValue('ok');
    const result = await service.createAuditLog('car', 1, 'create', { foo: 'bar' });
    expect(mockAuditRepository.logAction).toHaveBeenCalledWith('car', 1, 'create', { foo: 'bar' }, null);
    expect(result).toBe('ok');
  });

  test('getAuditLogs should call auditRepository.getAll', async () => {
    mockAuditRepository.getAll.mockResolvedValue(['log']);
    const result = await service.getAuditLogs();
    expect(mockAuditRepository.getAll).toHaveBeenCalled();
    expect(result).toEqual(['log']);
  });

  describe('restoreFromAudit', () => {
    test('should restore car from audit log', async () => {
      const audit = { id: 1, entityType: 'car', entityId: 10, data: { foo: 'bar' } };
      mockAuditRepository.getById.mockResolvedValue(audit);
      mockAuditRepository.update.mockResolvedValue({});
      const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
      const result = await service.restoreFromAudit(1);
      expect(mockCarRepository.restore).toHaveBeenCalledWith(10);
      expect(mockAuditRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({ restoredAt: expect.any(Date) }));
      expect(result).toEqual({ success: true, message: 'car was restored successfully', entityId: 10 });
      consoleLog.mockRestore();
    });

    test('should restore client from audit log', async () => {
      const audit = { id: 2, entityType: 'client', entityId: 20, data: { foo: 'bar' } };
      mockAuditRepository.getById.mockResolvedValue(audit);
      mockAuditRepository.update.mockResolvedValue({});
      const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
      const result = await service.restoreFromAudit(2);
      expect(mockClientRepository.restore).toHaveBeenCalledWith(20);
      expect(result.entityId).toBe(20);
      consoleLog.mockRestore();
    });

    test('should restore rental from audit log', async () => {
      const audit = { id: 3, entityType: 'rental', entityId: 30, data: { foo: 'bar' } };
      mockAuditRepository.getById.mockResolvedValue(audit);
      mockAuditRepository.update.mockResolvedValue({});
      const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
      const result = await service.restoreFromAudit(3);
      expect(mockRentalRepository.restore).toHaveBeenCalledWith(30);
      expect(result.entityId).toBe(30);
      consoleLog.mockRestore();
    });

    test('should throw if audit log not found', async () => {
      mockAuditRepository.getById.mockResolvedValue(null);
      await expect(service.restoreFromAudit(99)).rejects.toThrow('Audit log not found');
    });

    test('should throw if already restored', async () => {
      const audit = { id: 4, entityType: 'car', entityId: 40, data: {}, restoredAt: new Date() };
      mockAuditRepository.getById.mockResolvedValue(audit);
      await expect(service.restoreFromAudit(4)).rejects.toThrow('This record has already been restored');
    });

    test('should throw if entity type is not supported', async () => {
      const audit = { id: 5, entityType: 'unknown', entityId: 50, data: {} };
      mockAuditRepository.getById.mockResolvedValue(audit);
      await expect(service.restoreFromAudit(5)).rejects.toThrow('Unsupported entity type: unknown');
    });

    test('should parse audit.data if it is a string', async () => {
      const audit = { id: 6, entityType: 'car', entityId: 60, data: JSON.stringify({ foo: 'bar' }) };
      mockAuditRepository.getById.mockResolvedValue(audit);
      mockAuditRepository.update.mockResolvedValue({});
      const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
      await service.restoreFromAudit(6);
      expect(mockCarRepository.restore).toHaveBeenCalledWith(60);
      consoleLog.mockRestore();
    });
  });

  describe('getById', () => {
    test('should call auditRepository.getById with valid id', async () => {
      mockAuditRepository.getById.mockResolvedValue('log');
      const result = await service.getById(1);
      expect(mockAuditRepository.getById).toHaveBeenCalledWith(1);
      expect(result).toBe('log');
    });
    test('should throw if id is invalid', async () => {
      await expect(service.getById('abc')).rejects.toThrow('Invalid audit log ID');
      await expect(service.getById(null)).rejects.toThrow('Invalid audit log ID');
    });
  });
});
