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

  async getAllCars() {
    return this.carRepository.getAllCars();
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
   * @param {import('../entity/Car')} car
   */
  async deleteCar(car) {
    if (!(car instanceof Car)) {
      throw new CarNotDefinedError();
    }

    return this.carRepository.delete(car);
  }

  /**
   * @param {number} carId
   */
  async delete(carId) {
    if (!Number(carId)) {
      throw new Error('Car ID not defined');
    }

    const car = await this.carRepository.getCarById(carId);
    
    if (car.rentals && car.rentals.some(rental => rental instanceof Rental && rental.status === 'active')) {
      throw new Error('Cannot delete a car that is currently being rented');
    }
    
    return this.carRepository.delete(car);
  }
};
