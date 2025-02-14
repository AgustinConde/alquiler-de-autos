const Car = require('../entity/Car');
const { CarNotDefinedError, CarIdNotDefinedError } = require('../error/carError');

module.exports = class CarService {
  /**
   * @param {import('../repository/carRepository')} carRepository
   */
  constructor(carRepository) {
    this.carRepository = carRepository;
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
};
