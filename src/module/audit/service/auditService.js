module.exports = class AuditService {
  constructor(auditRepository, carRepository, clientRepository, rentalRepository) {
    this.auditRepository = auditRepository;
    this.carRepository = carRepository;
    this.clientRepository = clientRepository;
    this.rentalRepository = rentalRepository;
  }

  /**
   * @param {string} entityType
   * @param {number} entityId
   * @param {string} actionType
   * @param {object} data
   * @param {object} user
   */
  async createAuditLog(entityType, entityId, actionType, data, user = null) {
    return this.auditRepository.logAction(entityType, entityId, actionType, data, user);
  }

  async getAuditLogs() {
    return this.auditRepository.getAll();
  }

  /**
   * @param {number} id 
   */
  async restoreFromAudit(id) {
    const audit = await this.auditRepository.getById(id);
    if (!audit) throw new Error('Audit log not found');
    if (audit.restoredAt) throw new Error('This record has already been restored');

    const auditData = typeof audit.data === 'string' ? JSON.parse(audit.data) : audit.data;
    console.log('🔄 Restoring from audit log:', {type: audit.entityType, id: audit.entityId});

    if (audit.entityType === 'car') {
      await this.carRepository.restore(audit.entityId);
    } else if (audit.entityType === 'client') {
      await this.clientRepository.restore(audit.entityId);
    } else if (audit.entityType === 'rental') {
      await this.rentalRepository.restore(audit.entityId);
    } else {
      throw new Error(`Unsupported entity type: ${audit.entityType}`);
    }

    await this.auditRepository.update(id, { restoredAt: new Date() });
    
    return {
      success: true,
      message: `${audit.entityType} was restored successfully`,
      entityId: audit.entityId
    };
  }

  /**
   * @param {number} id
   */
  async getById(id) {
    if (!Number(id)) {
      throw new Error('Invalid audit log ID');
    }
    
    return this.auditRepository.getById(id);
  }
};
