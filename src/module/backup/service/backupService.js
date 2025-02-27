const { Backup } = require('../model/backupModel');
const { Rental } = require('../../rental/model/rentalModel');
const { Car } = require('../../car/model/carModel');
const { Client } = require('../../client/model/clientModel');

module.exports = class BackupService {
  constructor(backupRepository) {
    this.backupRepository = backupRepository;
  }

  async createBackup(entityType, entityId, rentals) {
    const backupData = {
      entityType,
      entityId,
      data: rentals.map(rental => ({
        id: rental.id,
        startDate: rental.startDate,
        endDate: rental.endDate,
        totalPrice: rental.totalPrice,
        status: rental.status,
        carId: rental.carId,
        clientId: rental.clientId,
        notes: rental.notes
      }))
    };

    return this.backupRepository.create(backupData);
  }

  async getBackups() {
    return this.backupRepository.getAll();
  }

  async restoreBackup(id) {
    const backup = await this.backupRepository.getById(id);
    if (!backup) throw new Error('Backup not found');
    if (backup.restoredAt) throw new Error('Backup already restored');

    await this.backupRepository.update(id, { restoredAt: new Date() });
    return backup;
  }
};
