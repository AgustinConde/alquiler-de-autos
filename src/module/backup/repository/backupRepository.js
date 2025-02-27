module.exports = class BackupRepository {
  constructor(backupModel) {
    this.backupModel = backupModel;
  }

  async create(backupData) {
    return this.backupModel.create(backupData);
  }

  async getAll() {
    return this.backupModel.findAll({
      order: [['createdAt', 'DESC']]
    });
  }

  async getById(id) {
    return this.backupModel.findByPk(id);
  }

  async update(id, data) {
    const backup = await this.backupModel.findByPk(id);
    if (!backup) throw new Error('Backup not found');
    return backup.update(data);
  }
};
