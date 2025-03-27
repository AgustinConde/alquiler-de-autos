const { modelToEntity } = require('../mapper/carMapper');
const Car = require('../entity/Car');
const { CarNotDefinedError, CarIdNotDefinedError, CarNotFoundError } = require('../error/carError');
const RentalModel = require('../../rental/model/rentalModel');

module.exports = class CarRepository {
  /**
   * @param {typeof import('../model/carModel')} carModel
   * @param {import('../../backup/repository/backupRepository')} backupRepository
   */
  constructor(carModel, backupRepository) {
    this.carModel = carModel;
    this.backupRepository = backupRepository;
  }

  /**
   * @param {import('../entity/Car')} car
   */
  async save(car) {
    if (!(car instanceof Car)) {
      throw new CarNotDefinedError();
    }

    const carInstance = this.carModel.build(car, {
      isNewRecord: !car.id,
    });
    await carInstance.save();
    return modelToEntity(carInstance);
  }

  async getAllCars() {
    const cars = await this.carModel.findAll();
    return cars.map((car) => modelToEntity(car));
  }

  async getUnfilteredCars() {
    const cars = await this.carModel.findAll({
      paranoid: false
    });
    return cars.map(car => modelToEntity(car));
  }

  async getCarsLength() {
    return this.carModel.count();
  }

  async getLastCar() {
    const lastCar = await this.carModel.findOne({
      order: [['id', 'DESC']],
    });
    return modelToEntity(lastCar);
  }

  
  /**
   * @param {number} carId
   * @returns {Promise<import('../entity/Car')>}
   */
  async getUnfilteredCarById(carId) {
    if (!Number(carId)) {
      throw new CarIdNotDefinedError();
    }

    const car = await this.carModel.findByPk(carId, { 
      include: RentalModel,
      paranoid: false, 
    });
    if (!car) {
      throw new CarNotFoundError(`Car with ID ${carId} not found.`);
    }

    return modelToEntity(car);
  }

    /**
   * @param {number} carId
   * @returns {Promise<import('../entity/Car')>}
   */
    async getCarById(carId) {
      if (!Number(carId)) {
        throw new CarIdNotDefinedError();
      }
  
      const car = await this.carModel.findByPk(carId, { include: RentalModel });
      if (!car) {
        throw new CarNotFoundError(`Car with ID ${carId} not found.`);
      }
  
      return modelToEntity(car);
    }

  /**
   * @param {import('../entity/Car')} car
   */
  async delete(car) {
    if (!(car instanceof Car)) {
      throw new CarNotDefinedError();
    }

    const carModel = await this.carModel.findByPk(car.id, {
      include: [RentalModel]
    });

    if (carModel.Rentals && carModel.Rentals.length > 0) {
      const activeRentals = carModel.Rentals.filter(rental => {
        const endDate = new Date(rental.rentalEnd);
        return endDate >= new Date();
      });
      
      if (activeRentals.length > 0) {
        throw new Error('Cannot delete car with active rentals');
      }
    }

    console.log(`✅ Car ${car.id} succesfully deleted. Creating backup...`);
    await this.backupRepository.backupByCarId(car.id);

    await carModel.destroy();
    return car;
  }

  /**
 * @param {number} carId
 */
async restore(carId) {
  if (!Number(carId)) {
    throw new CarIdNotDefinedError();
  }

  const carInstance = await this.carModel.findByPk(carId, {
    paranoid: false
  });
  
  if (!carInstance) {
    throw new CarNotFoundError(`Car with ID ${carId} not found.`);
  }
  
  if (!carInstance.deletedAt) {
    throw new Error('Car is not deleted.');
  }
  
  await carInstance.restore();
  return modelToEntity(carInstance);
}

  /**
   * @param {Object} carData
   */
  async createFromBackup(carData) {
    try {
      const car = await this.carModel.create(carData);
      
      return modelToEntity(car);
    } catch (error) {
      console.error('Error restoring car from backup:', error);
      throw new Error(`Failed to restore car: ${error.message}`);
    }
  }
};
