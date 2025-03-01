const { Backup } = require('../model/backupModel');
const { Rental } = require('../../rental/model/rentalModel');
const { Car } = require('../../car/model/carModel');
const { Client } = require('../../client/model/clientModel');

module.exports = class BackupService {
  constructor(backupRepository, carRepository, clientRepository, rentalRepository) {
    this.backupRepository = backupRepository;
    this.carRepository = carRepository;
    this.clientRepository = clientRepository;
    this.rentalRepository = rentalRepository;
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

  /**
   * @param {number} id 
   */
  async restoreBackup(id) {
    const backup = await this.backupRepository.getById(id);
    if (!backup) throw new Error('Backup not found');
    if (backup.restoredAt) throw new Error('Backup already restored');

    const backupData = typeof backup.data === 'string' ? JSON.parse(backup.data) : backup.data;
    console.log('🔄 Restaurando backup:', {type: backup.entityType, id: backup.entityId});

    if (backup.entityType === 'car') {
      await this.restoreCar(backupData);
    } else if (backup.entityType === 'client') {
      await this.restoreClient(backupData);
    }

    await this.backupRepository.update(id, { restoredAt: new Date() });
    
    return {
      success: true,
      message: `${backup.entityType} was restored successfully`,
      entityId: backup.entityId
    };
  }

  /**
   * @param {Object} carData
   */
  async restoreCar(carData) {
    try {
      const { id: oldCarId, createdAt, updatedAt, deletedAt, Rentals, ...carDetails } = carData;
      
      console.log('🚗 Restaurando auto con datos:', carDetails);
      const restoredCar = await this.carRepository.createFromBackup(carDetails);
      console.log(`✅ Auto restaurado con ID: ${restoredCar.id}`);
      
      if (Rentals && Rentals.length > 0) {
        console.log(`🔄 Restaurando ${Rentals.length} alquileres asociados al auto ${oldCarId}`);
        
        for (const rentalData of Rentals) {
          rentalData.rentedCar = restoredCar.id;
          
          const { id, createdAt, updatedAt, deletedAt, Car, Client, ...rentalDetails } = rentalData;
          
          await this.rentalRepository.createFromBackup(rentalDetails);
        }
        
        console.log(`✅ Se restauraron ${Rentals.length} alquileres`);
      }
      
      return restoredCar;
    } catch (error) {
      console.error('❌ Error en restauración de auto:', error);
      throw new Error(`Failed to restore car: ${error.message}`);
    }
  }

  /**
   * @param {Object} clientData
   */
  async restoreClient(clientData) {
    const { id, createdAt, updatedAt, deletedAt, Rentals, ...clientDetails } = clientData;
    
    const restoredClient = await this.clientRepository.createFromBackup(clientDetails);
    
    console.log(`✅ Cliente restaurado con ID: ${restoredClient.id}`);
    return restoredClient;
  }

  /**
   * @param {number} id
   */
  async getById(id) {
    if (!Number(id)) {
      throw new Error('Invalid backup ID');
    }
    
    return this.backupRepository.getById(id);
  }
};
