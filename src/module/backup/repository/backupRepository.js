const fs = require('fs');
const path = require('path');
const RentalModel = require('../../rental/model/rentalModel');

module.exports = class BackupRepository {
  constructor(backupModel, carModel, rentalModel) {
    this.backupModel = backupModel;
    this.CarModel = carModel;
    this.RentalModel = rentalModel;
  }

  /**
   * @param {number} carId 
   */
  async backupByCarId(carId) {
    try {
      const car = await this.CarModel.findByPk(carId, {
        include: [this.RentalModel]
      });

      if (!car) {
        throw new Error(`Car with ID ${carId} not found for backup`);
      }

      const backupData = {
        entityType: 'car',
        entityId: carId,
        data: car.toJSON(),
      };

      console.log('📋 Backup data:', backupData);

      const backup = await this.backupModel.create(backupData);
      
      console.log(`✓ Backup created for car ID ${carId}, backup ID: ${backup.id}`);
      
      return backup;
    } catch (error) {
      console.error(`❌ Error creating backup for car ID ${carId}:`, error);
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  async create(backupData) {
    return this.backupModel.create(backupData);
  }

  async getAll() {
    return this.backupModel.findAll({
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * @param {number} id
   */
  async getById(id) {
    return this.backupModel.findByPk(id);
  }

  async update(id, data) {
    const backup = await this.backupModel.findByPk(id);
    if (!backup) throw new Error('Backup not found');
    return backup.update(data);
  }
};
