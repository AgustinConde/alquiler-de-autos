const CarRepository = require('../carRepository');
const Car = require('../../entity/Car');
const { CarNotDefinedError, CarIdNotDefinedError, CarNotFoundError } = require('../../error/carError');

const mockCarModel = {
  build: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  count: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
};

const mockAuditRepository = {
  createAuditLog: jest.fn(),
  logAction: jest.fn(),
};

describe('CarRepository', () => {
  let carRepository;
  
  beforeEach(() => {
    jest.clearAllMocks();
    carRepository = new CarRepository(mockCarModel, mockAuditRepository);
  });
  
  describe('save', () => {
    test('should save a new car', async () => {
      const car = new Car(
        null, 'Toyota', 'Corolla', 2020, 5000, 'Red', 
        true, 5, 'automatic', 50, '/img/car1.jpg', 
        new Date(), new Date(), null, []
      );
      
      const mockInstance = {
        save: jest.fn().mockResolvedValue({}),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          brand: 'Toyota',
          model: 'Corolla',
          year: 2020
        })
      };
      
      mockCarModel.build.mockReturnValue(mockInstance);
      
      await carRepository.save(car);
      
      expect(mockCarModel.build).toHaveBeenCalled();
      expect(mockInstance.save).toHaveBeenCalled();
    });
    
    test('should throw CarNotDefinedError when car is not provided', async () => {
      await expect(carRepository.save(null)).rejects.toThrow(CarNotDefinedError);
      await expect(carRepository.save({})).rejects.toThrow(CarNotDefinedError);
    });
  });
  
  describe('getAllCars', () => {
    test('should return all active cars', async () => {
      const mockCars = [
        {
          id: 1,
          brand: 'Toyota',
          model: 'Corolla',
          year: 2020,
          toJSON: () => ({
            id: 1,
            brand: 'Toyota',
            model: 'Corolla',
            year: 2020
          })
        }
      ];
      
      mockCarModel.findAll.mockResolvedValue(mockCars);
      
      // Act
      const result = await carRepository.getAllCars();
      
      // Assert
      expect(mockCarModel.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Car);
    });
  });
  
  describe('getCarById', () => {
    test('should return car by id', async () => {
      const mockCar = {
        id: 1,
        brand: 'Toyota',
        model: 'Corolla',
        year: 2020,
        rentals: [],
        toJSON: () => ({
          id: 1,
          brand: 'Toyota',
          model: 'Corolla',
          year: 2020,
          rentals: []
        })
      };
      
      mockCarModel.findByPk.mockResolvedValue(mockCar);
      
      const result = await carRepository.getCarById(1);
      
      expect(mockCarModel.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(result).toBeInstanceOf(Car);
      expect(result.id).toBe(1);
    });
    
    test('should throw CarIdNotDefinedError when id is not provided', async () => {
      await expect(carRepository.getCarById(null)).rejects.toThrow(CarIdNotDefinedError);
    });
    
    test('should throw CarNotFoundError when car is not found', async () => {
      mockCarModel.findByPk.mockResolvedValue(null);
      await expect(carRepository.getCarById(999)).rejects.toThrow(CarNotFoundError);
    });

    test('should handle model with properties', async () => {
        const mockCar = {
          id: 1,
          brand: 'Toyota',
          model: 'Corolla',
          year: 2020,
          mileage: 5000,
          color: 'Red',
          ac: true,
          capacity: 5,
          transmission: 'automatic',
          pricePerDay: 50,
          image: '/img/car.jpg',
          rentals: [],
          toJSON: () => ({
            id: 1,
            brand: 'Toyota',
            model: 'Corolla',
            year: 2020,
            mileage: 5000,
            color: 'Red',
            ac: true,
            capacity: 5,
            transmission: 'automatic',
            pricePerDay: 50,
            image: '/img/car.jpg',
            rentals: []
          })
        };
        
        mockCarModel.findByPk.mockResolvedValue(mockCar);
        
        const result = await carRepository.getCarById(1);
        
        expect(result).toBeInstanceOf(Car);
        expect(result.brand).toBe('Toyota');
        expect(result.model).toBe('Corolla');
      });
  });

  describe('getUnfilteredCars', () => {
    test('should return all cars including deleted ones', async () => {
      const mockCars = [
        {
          id: 1,
          brand: 'Toyota',
          model: 'Corolla',
          year: 2020,
          deletedAt: null,
          toJSON: () => ({
            id: 1,
            brand: 'Toyota',
            model: 'Corolla',
            year: 2020,
            deletedAt: null
          })
        },
        {
          id: 2,
          brand: 'Honda',
          model: 'Civic',
          year: 2019,
          deletedAt: new Date(),
          toJSON: () => ({
            id: 2,
            brand: 'Honda',
            model: 'Civic',
            year: 2019,
            deletedAt: new Date()
          })
        }
      ];
      
      mockCarModel.findAll.mockResolvedValue(mockCars);
      
      const result = await carRepository.getUnfilteredCars();
      
      expect(mockCarModel.findAll).toHaveBeenCalledWith({
        paranoid: false
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Car);
      expect(result[1]).toBeInstanceOf(Car);
      expect(result[1].deletedAt).toBeDefined();
    });
  });
  
  describe('getUnfilteredCarById', () => {
    test('should return car by id including soft deleted ones', async () => {
      const mockCar = {
        id: 1,
        brand: 'Toyota',
        model: 'Corolla',
        year: 2020,
        deletedAt: new Date(),
        rentals: [],
        toJSON: () => ({
          id: 1,
          brand: 'Toyota',
          model: 'Corolla',
          year: 2020,
          deletedAt: new Date(),
          rentals: []
        })
      };
      
      mockCarModel.findByPk.mockResolvedValue(mockCar);
      
      const result = await carRepository.getUnfilteredCarById(1);
      
      expect(mockCarModel.findByPk).toHaveBeenCalledWith(1, expect.objectContaining({
        paranoid: false
      }));
      expect(result).toBeInstanceOf(Car);
      expect(result.deletedAt).toBeDefined();
    });

    test('should throw CarIdNotDefinedError when id is invalid', async () => {
      await expect(carRepository.getUnfilteredCarById(null)).rejects.toThrow(CarIdNotDefinedError);
      await expect(carRepository.getUnfilteredCarById('abc')).rejects.toThrow(CarIdNotDefinedError);
      await expect(carRepository.getUnfilteredCarById(undefined)).rejects.toThrow(CarIdNotDefinedError);
      
      expect(mockCarModel.findByPk).not.toHaveBeenCalled();
    });

    test('should throw CarNotFoundError when car does not exist', async () => {
      mockCarModel.findByPk.mockResolvedValue(null);
      
      await expect(carRepository.getUnfilteredCarById(999))
        .rejects
        .toThrow(CarNotFoundError);
      
      expect(mockCarModel.findByPk).toHaveBeenCalledWith(999, expect.objectContaining({
        paranoid: false
      }));
    });
  });

  describe('getCarsLength', () => {
    test('should return the number of cars', async () => {
      mockCarModel.count.mockResolvedValue(5);
      
      const result = await carRepository.getCarsLength();
      
      expect(mockCarModel.count).toHaveBeenCalled();
      expect(result).toBe(5);
    });
  });

  describe('delete', () => {
    test('should delete car by id', async () => {
        const car = new Car(
          1, 'Toyota', 'Corolla', 2020, 5000, 'Red', 
          true, 5, 'automatic', 50, '/img/car1.jpg', 
          new Date(), new Date(), null, []
        );
        
        const mockCarInstance = {
          destroy: jest.fn().mockResolvedValue({}),
          toJSON: jest.fn().mockReturnValue({
            id: 1,
            brand: 'Toyota',
            model: 'Corolla',
            year: 2020
          }),
          Rentals: []
        };
        
        mockCarModel.findByPk.mockResolvedValue(mockCarInstance);
        mockAuditRepository.logAction.mockResolvedValue({});
        
        await carRepository.delete(car);
        
        expect(mockCarModel.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
        expect(mockAuditRepository.logAction).toHaveBeenCalledWith(
          'car', 
          1, 
          'delete', 
          expect.any(Object), 
          null
        );
        expect(mockCarInstance.destroy).toHaveBeenCalled();
      });

      test('should throw error when car has active rentals', async () => {
        const car = new Car(
          1, 'Toyota', 'Corolla', 2020, 5000, 'Red', 
          true, 5, 'automatic', 50, '/img/car1.jpg', 
          new Date(), new Date(), null, []
        );
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const mockCarInstance = {
          Rentals: [
            {
              id: 1,
              rentalStart: new Date(),
              rentalEnd: tomorrow
            }
          ],
          toJSON: jest.fn().mockReturnValue({
            id: 1,
            brand: 'Toyota',
            model: 'Corolla'
          })
        };
        
        mockCarModel.findByPk.mockResolvedValue(mockCarInstance);
        
        await expect(carRepository.delete(car))
          .rejects
          .toThrow('Cannot delete car with active rentals');
        
        expect(mockAuditRepository.logAction).not.toHaveBeenCalled();
      });

      test('should throw CarNotDefinedError when not a Car instance', async () => {
        const notACar = { 
          id: 1, 
          brand: 'Toyota'
        };
        
        await expect(carRepository.delete(notACar))
          .rejects
          .toThrow(CarNotDefinedError);
        
        expect(mockCarModel.findByPk).not.toHaveBeenCalled();
      });
      
      test('should allow deletion when car has only past rentals', async () => {
        const car = new Car(
          1, 'Toyota', 'Corolla', 2020, 5000, 'Red', 
          true, 5, 'automatic', 50, '/img/car1.jpg', 
          new Date(), new Date(), null, []
        );
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const mockCarInstance = {
          Rentals: [
            {
              id: 1,
              rentalStart: yesterday,
              rentalEnd: yesterday
            }
          ],
          destroy: jest.fn().mockResolvedValue({}),
          toJSON: jest.fn().mockReturnValue({
            id: 1,
            brand: 'Toyota'
          })
        };
        
        mockCarModel.findByPk.mockResolvedValue(mockCarInstance);
        mockAuditRepository.logAction.mockResolvedValue({});
        
        await carRepository.delete(car);
        
        expect(mockCarInstance.destroy).toHaveBeenCalled();
        expect(mockAuditRepository.logAction).toHaveBeenCalled();
      });
  });

  describe('restore', () => {
    test('should restore a deleted car', async () => {
      const carId = 1;
      const mockDeletedCar = {
        id: carId,
        brand: 'Toyota',
        model: 'Corolla',
        deletedAt: new Date(),
        restore: jest.fn().mockResolvedValue({}),
        toJSON: () => ({
          id: carId,
          brand: 'Toyota',
          model: 'Corolla',
          deletedAt: new Date(),
        })
      };
      
      mockCarModel.findByPk.mockResolvedValue(mockDeletedCar);
      mockAuditRepository.logAction.mockResolvedValue({});
      
      await carRepository.restore(carId);
      
      expect(mockCarModel.findByPk).toHaveBeenCalledWith(carId, { paranoid: false });
      expect(mockDeletedCar.restore).toHaveBeenCalled();
    });
    
    test('should throw error when car not found', async () => {
      mockCarModel.findByPk.mockResolvedValue(null);
      
      await expect(carRepository.restore(999))
        .rejects
        .toThrow(`Car with ID 999 not found.`);
    });

    test('should throw CarIdNotDefinedError when id is invalid for restore', async () => {
      await expect(carRepository.restore(null)).rejects.toThrow(CarIdNotDefinedError);
      await expect(carRepository.restore('abc')).rejects.toThrow(CarIdNotDefinedError);
      await expect(carRepository.restore(undefined)).rejects.toThrow(CarIdNotDefinedError);
      
      expect(mockCarModel.findByPk).not.toHaveBeenCalled();
    });

    test('should throw error when car is not deleted', async () => {
      const carId = 1;
      const mockNonDeletedCar = {
        id: carId,
        brand: 'Toyota',
        model: 'Corolla',
        deletedAt: null,
        restore: jest.fn(),
        toJSON: () => ({
          id: carId,
          brand: 'Toyota',
          model: 'Corolla',
          deletedAt: null
        })
      };
      
      mockCarModel.findByPk.mockResolvedValue(mockNonDeletedCar);
      
      await expect(carRepository.restore(carId))
        .rejects
        .toThrow('Car is not deleted.');
      
      expect(mockNonDeletedCar.restore).not.toHaveBeenCalled();
    });
  });

  describe('getLastCar', () => {
    test('should return the last added car', async () => {
      const mockCar = {
        id: 5,
        brand: 'Tesla',
        model: 'Model S',
        toJSON: () => ({
          id: 5,
          brand: 'Tesla',
          model: 'Model S'
        })
      };
      
      mockCarModel.findOne.mockResolvedValue(mockCar);
      
      const result = await carRepository.getLastCar();
      
      expect(mockCarModel.findOne).toHaveBeenCalledWith({
        order: [['id', 'DESC']]
      });
      expect(result).toBeInstanceOf(Car);
      expect(result.id).toBe(5);
      expect(result.brand).toBe('Tesla');
    });
    
    test('should throw error when no cars exist', async () => {
      mockCarModel.findOne.mockResolvedValue(null);
      
      await expect(carRepository.getLastCar())
        .rejects
        .toThrow('No cars found');
    });
  });
});
