module.exports = class AuditRepository {
  constructor(auditModel, carModel, rentalModel) {
    this.auditModel = auditModel;
    this.CarModel = carModel;
    this.RentalModel = rentalModel;
  }


    /**
   * @param {string} entityType
   * @param {number} entityId
   * @param {string} actionType
   * @param {object} data
   * @param {object} user
   */
    async logAction(entityType, entityId, actionType, data, user = null) {
      try {
        const auditData = {
          entityType,
          entityId,
          actionType,
          data,
          performedBy: user?.id,
          performedByEmail: user?.email
        };
  
        const audit = await this.auditModel.create(auditData);
        
        console.log(`✓ Audit log created for ${entityType} ID ${entityId}, log ID: ${audit.id}`);
        
        return audit;
      } catch (error) {
        console.error(`❌ Error creating audit log for ${entityType} ID ${entityId}:`, error);
        throw new Error(`Error creating audit log: ${error.message}`);
      }
    }

  async create(auditData) {
    return this.auditModel.create(auditData);
  }

  async getAll() {
    return this.auditModel.findAll({
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * @param {number} id
   */
  async getById(id) {
    return this.auditModel.findByPk(id);
  }

  async update(id, data) {
    const audit = await this.auditModel.findByPk(id);
    if (!audit) throw new Error('Audit log not found');
    return audit.update(data);
  }
};
