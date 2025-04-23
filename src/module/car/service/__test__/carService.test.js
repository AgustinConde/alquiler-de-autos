const CarService = require('../../service/carService');
const Car = require('../../entity/Car');
const { CarIdNotDefinedError, CarNotDefinedError } = require('../../error/carError');

const mockCarRepository = {
  save: jest.fn(),
  getAllCars: jest.fn(),
  getUnfilteredCars: jest.fn(),
  getCarById: jest.fn(),
  getUnfilteredCarById: jest.fn(),
  delete: jest.fn(),
  restore: jest.fn(),
  getCarsLength: jest.fn(),
  getLastCar: jest.fn()
};

const mockAuditService = {
  createAuditLog: jest.fn()
};

describe('CarService', () => {
  let carService;

  beforeEach(() => {
    jest.clearAllMocks();
    carService = new CarService(mockCarRepository, mockAuditService);
  });

  describe('save', () => {
    test('should throw CarNotDefinedError when car is not an instance of Car', async () => {
      const invalidCar = { brand: 'Toyota', model: 'Corolla' };
      
      await expect(carService.save(invalidCar))
        .rejects
        .toThrow(CarNotDefinedError);
      
      expect(mockCarRepository.save).not.toHaveBeenCalled();
    });

    test('should call repository.save with the car when valid', async () => {
      const car = new Car(
        1, 'Toyota', 'Corolla', 2020, 5000, 'Red', 
        true, 5, 'automatic', 50, '/uploads/car1.jpg', 
        new Date(), new Date(), null, []
      );
      mockCarRepository.save.mockResolvedValue(car);
      
      const result = await carService.save(car);
      
      expect(mockCarRepository.save).toHaveBeenCalledWith(car);
      expect(result).toEqual(car);
    });
  });

  describe('getAllCars', () => {
    test('should return all non-deleted cars', async () => {
      const cars = [
        new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []),
        new Car(2, 'Honda', 'Civic', 2019, 15000, 'Blue', true, 5, 'automatic', 45, '/img/car2.jpg', new Date(), new Date(), null, [])
      ];
      mockCarRepository.getAllCars.mockResolvedValue(cars);
      
      const result = await carService.getAllCars();
      
      expect(mockCarRepository.getAllCars).toHaveBeenCalled();
      expect(result).toEqual(cars);
    });
  });

  describe('getCars', () => {
    test('should return filtered cars when includeDeleted is false', async () => {
      const filteredCars = [
        new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []),
        new Car(2, 'Honda', 'Civic', 2019, 15000, 'Blue', true, 5, 'automatic', 45, '/img/car2.jpg', new Date(), new Date(), null, [])
      ];
      
      mockCarRepository.getAllCars.mockResolvedValue(filteredCars);
      
      const result = await carService.getCars(false);
      
      expect(mockCarRepository.getAllCars).toHaveBeenCalled();
      expect(mockCarRepository.getUnfilteredCars).not.toHaveBeenCalled();
      expect(result).toEqual(filteredCars);
    });
    
    test('should return all cars including deleted when includeDeleted is true', async () => {
      const allCars = [
        new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []),
        new Car(2, 'Honda', 'Civic', 2019, 15000, 'Blue', true, 5, 'automatic', 45, '/img/car2.jpg', new Date(), new Date(), new Date(), []) // Coche eliminado
      ];
      
      mockCarRepository.getUnfilteredCars.mockResolvedValue(allCars);
      
      const result = await carService.getCars(true);
      
      expect(mockCarRepository.getUnfilteredCars).toHaveBeenCalled();
      expect(mockCarRepository.getAllCars).not.toHaveBeenCalled();
      expect(result).toEqual(allCars);
    });

    test('should use default value (false) when parameter is not provided', async () => {
      const filteredCars = [
        new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []),
        new Car(2, 'Honda', 'Civic', 2019, 15000, 'Blue', true, 5, 'automatic', 45, '/img/car2.jpg', new Date(), new Date(), null, [])
      ];
      
      mockCarRepository.getAllCars.mockResolvedValue(filteredCars);
      
      const result = await carService.getCars();
      
      expect(mockCarRepository.getAllCars).toHaveBeenCalled();
      expect(mockCarRepository.getUnfilteredCars).not.toHaveBeenCalled();
      expect(result).toEqual(filteredCars);
    });
  });

  describe('getCarById', () => {
    test('should handle error when car is not found', async () => {
      mockCarRepository.getCarById.mockResolvedValue(null);
      
      const result = await carService.getCarById(999);
      
      expect(result).toBeNull();
      expect(mockCarRepository.getCarById).toHaveBeenCalledWith(999);
    });
    
    test('should throw CarIdNotDefinedError when id is invalid', async () => {
      await expect(carService.getCarById(null))
        .rejects
        .toThrow(CarIdNotDefinedError);
      
      expect(mockCarRepository.getCarById).not.toHaveBeenCalled();
    });

    test('should return car when found by id', async () => {
      const car = new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []);
      mockCarRepository.getCarById.mockResolvedValue(car);
      
      const result = await carService.getCarById(1);
      
      expect(mockCarRepository.getCarById).toHaveBeenCalledWith(1);
      expect(result).toEqual(car);
    });
  });

  describe('getUnfilteredCarById', () => {
    test('should throw CarIdNotDefinedError when id is invalid', async () => {
      await expect(carService.getUnfilteredCarById(null))
        .rejects
        .toThrow(CarIdNotDefinedError);
      
      expect(mockCarRepository.getUnfilteredCarById).not.toHaveBeenCalled();
    });
    
    test('should return car when found by id including deleted cars', async () => {
      const car = new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), new Date(), []);
      mockCarRepository.getUnfilteredCarById.mockResolvedValue(car);
      
      const result = await carService.getUnfilteredCarById(1);
      
      expect(mockCarRepository.getUnfilteredCarById).toHaveBeenCalledWith(1);
      expect(result).toEqual(car);
    });
  });

  describe('getUnfilteredCars', () => {
    test('should call getCars with true parameter', async () => {
      const deletedCars = [
        new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), new Date(), []), // Coche eliminado
        new Car(2, 'Honda', 'Civic', 2019, 15000, 'Blue', true, 5, 'automatic', 45, '/img/car2.jpg', new Date(), new Date(), new Date(), []) // Coche eliminado
      ];
      
      mockCarRepository.getUnfilteredCars.mockResolvedValue(deletedCars);
      
      const result = await carService.getUnfilteredCars();
      
      expect(mockCarRepository.getUnfilteredCars).toHaveBeenCalled();
      expect(result).toEqual(deletedCars);
    });
  });
  
  describe('getCarsLength', () => {
    test('should return number of cars from repository', async () => {
      mockCarRepository.getCarsLength.mockResolvedValue(5);
      
      const result = await carService.getCarsLength();
      
      expect(mockCarRepository.getCarsLength).toHaveBeenCalled();
      expect(result).toBe(5);
    });
  });
  
  describe('getLastCar', () => {
    test('should return the last car from repository', async () => {
      const lastCar = new Car(99, 'Nissan', 'Leaf', 2022, 1000, 'Green', true, 5, 'automatic', 40, '/img/leaf.jpg', new Date(), new Date(), null, []);
      
      mockCarRepository.getLastCar.mockResolvedValue(lastCar);
      
      const result = await carService.getLastCar();
      
      expect(mockCarRepository.getLastCar).toHaveBeenCalled();
      expect(result).toBe(lastCar);
    });
  });
  
  describe('restore', () => {
    test('should restore a deleted car', async () => {
      const carId = 1;
      const restoredCar = new Car(
        carId, 'Toyota', 'Corolla', 2020, 5000, 'Red', 
        true, 5, 'automatic', 50, '/img/car1.jpg', 
        new Date(), new Date(), null, []
      );

      mockCarRepository.restore.mockResolvedValue(restoredCar);
      
      const result = await carService.restore(carId);
      
      expect(mockCarRepository.restore).toHaveBeenCalledWith(carId);
      expect(result.deletedAt).toBeNull();
    });
    
    test('should throw error when car not found', async () => {
      mockCarRepository.restore.mockRejectedValue(
        new Error('Car with ID 999 not found.')
      );
      
      await expect(carService.restore(999))
        .rejects
        .toThrow('Car with ID 999 not found.');
    });

    test('should throw CarIdNotDefinedError when id is invalid for restore', async () => {
      await expect(carService.restore(null)).rejects.toThrow(CarIdNotDefinedError);
      await expect(carService.restore(undefined)).rejects.toThrow(CarIdNotDefinedError);
      await expect(carService.restore('abc')).rejects.toThrow(CarIdNotDefinedError);
      await expect(carService.restore('')).rejects.toThrow(CarIdNotDefinedError);
      
      expect(mockCarRepository.restore).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    test('should delete car by id', async () => {
      const carId = 1;
      const car = new Car(carId, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []);
      mockCarRepository.getCarById.mockResolvedValue(car);
      mockCarRepository.delete.mockResolvedValue(car);
      
      await carService.delete(carId);
      
      expect(mockCarRepository.getCarById).toHaveBeenCalledWith(carId);
      expect(mockCarRepository.delete).toHaveBeenCalledWith(car);
    });

    test('should accept car entity directly', async () => {
      const car = new Car(1, 'Toyota', 'Corolla', 2020, 5000, 'Red', true, 5, 'automatic', 50, '/img/car1.jpg', new Date(), new Date(), null, []);
      mockCarRepository.delete.mockResolvedValue(car);
      
      await carService.delete(car);
      
      expect(mockCarRepository.getCarById).not.toHaveBeenCalled();
      expect(mockCarRepository.delete).toHaveBeenCalledWith(car);
    });
  });
});