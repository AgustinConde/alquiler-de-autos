const Car = require('../entity/Car');
const { CarNotDefinedError, CarIdNotDefinedError } = require('../error/carError');
const Rental = require('../../rental/entity/Rental');

module.exports = class CarService {
  /**
   * @param {import('../repository/carRepository')} carRepository
   */
  constructor(carRepository, backupService) {
    this.carRepository = carRepository;
    this.backupService = backupService;
  }

  /**
   * @param {import('../entity/Car')} car
   */
  async save(car) {
    if (!(car instanceof Car)) {
      throw new CarNotDefinedError();
    }
    return this.carRepository.save(car);
  }

  /**
   * @param {boolean} includeDeleted
   * @returns {Promise<Array>}
   */
  async getCars(includeDeleted = false) {
    return includeDeleted 
      ? this.carRepository.getUnfilteredCars() 
      : this.carRepository.getAllCars();
  }

  /**
   * @returns {Promise<Array>}
   */
  async getAllCars() {
    return this.getCars(false);
  }

  /**
   * @returns {Promise<Array>}
   */
  async getUnfilteredCars() {
    return this.getCars(true);
  }

  async getCarsLength() {
    return this.carRepository.getCarsLength();
  }

  async getLastCar() {
    return this.carRepository.getLastCar();
  }

  /**
   * @param {number} carId
   * @returns {Promise<Car>}
   */
  async getCarById(carId) {
    if (!Number(carId)) {
      throw new CarIdNotDefinedError();
    }
    return this.carRepository.getCarById(carId);
  }

    /**
   * @param {number} carId
   * @returns {Promise<Car>}
   */
    async getUnfilteredCarById(carId) {
      if (!Number(carId)) {
        throw new CarIdNotDefinedError();
      }
      return this.carRepository.getUnfilteredCarById(carId);
    }

/**
 * @param {Car|number} input
 */
async delete(input) {
  const car = input instanceof Car 
    ? input 
    : await this.carRepository.getCarById(Number(input));
    
  return this.carRepository.delete(car);
}

  /**
 * @param {number} carId
 */
  async restore(carId) {
    if (!Number(carId)) {
      throw new CarIdNotDefinedError();
    }
    return this.carRepository.restore(carId);
  }
};
