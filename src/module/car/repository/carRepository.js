const { modelToEntity } = require('../mapper/carMapper');
const Car = require('../entity/Car');
const { CarNotDefinedError, CarIdNotDefinedError, CarNotFoundError } = require('../error/carError');
const RentalModel = require('../../rental/model/rentalModel');
const BackupRepository = require('../../rental/repository/backupRepository');

module.exports = class CarRepository {
  /**
   * @param {typeof import('../model/carModel')} carModel
   */
  constructor(carModel) {
    this.carModel = carModel;
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
   * @returns {Promise<Boolean>}
   */
  async delete(car) {
    if (!(car instanceof Car)) {
      throw new CarNotDefinedError();
    }

    await BackupRepository.backupByCarId(car.id);

    const deleted = await this.carModel.destroy({ where: { id: car.id } });

    return Boolean(deleted);
  }
};
