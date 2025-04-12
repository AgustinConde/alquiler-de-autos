const RentalRepository = require('../rentalRepository');
const { RentalNotDefinedError, RentalIdNotDefinedError, RentalNotFoundError } = require('../../error/RentalError');

function MockRental(
    id,
    rentedCar, 
    rentedTo,
    pricePerDay,
    rentalStart,
    rentalEnd,
    totalPrice,
    paymentMethod,
    paymentProgress,
    createdAt,
    updatedAt,
    car,
    client
  ) {
    this.id = id;
    this.rentedCar = rentedCar;
    this.rentedTo = rentedTo;
    this.pricePerDay = pricePerDay;
    this.rentalStart = rentalStart;
    this.rentalEnd = rentalEnd;
    this.totalPrice = totalPrice;
    this.paymentMethod = paymentMethod;
    this.paymentProgress = paymentProgress;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.car = car || {};
    this.client = client || {};
  }
  
  const isPaidValues = {
    PENDING: { name: 'Pending', value: 0 },
    PAID: { name: 'Paid', value: 1 }
  };
  
  jest.mock('../../entity/Rental', () => MockRental);
  
  jest.mock('../../entity/RentalIsPaid', () => ({
    isPaid: isPaidValues
  }));
  
  jest.mock('../../mapper/rentalMapper', () => ({
    modelToEntity: jest.fn().mockImplementation((model, carMapper, clientMapper) =>
      new MockRental(
        model.id || 1,
        model.rentedCar || 1,
        model.rentedTo || 1,
        model.pricePerDay || 50,
        model.rentalStart || new Date(),
        model.rentalEnd || new Date(),
        model.totalPrice || 250,
        model.paymentMethod || 'Card',
        model.isPaid ? isPaidValues.PAID : isPaidValues.PENDING,
        model.createdAt || new Date(),
        model.updatedAt || new Date()
      )
    ),
    entityToModel: jest.fn().mockImplementation(entity => ({
      id: entity.id,
      rentedCar: entity.rentedCar,
      rentedTo: entity.rentedTo,
      pricePerDay: entity.pricePerDay,
      rentalStart: entity.rentalStart,
      rentalEnd: entity.rentalEnd,
      totalPrice: entity.totalPrice,
      paymentMethod: entity.paymentMethod,
      isPaid: entity.paymentProgress === isPaidValues.PAID
    }))
  }));

  const Rental = MockRental;
  const isPaid = isPaidValues;
  
  jest.mock('../../../car/mapper/carMapper', () => ({
    modelToEntity: jest.fn().mockReturnValue({})
  }));
  
  jest.mock('../../../client/mapper/clientMapper', () => ({
    modelToEntity: jest.fn().mockReturnValue({})
  }));
  
  jest.mock('sequelize', () => {
    class MockModel {}
    return {
      Op: {
        gte: 'gte',
        lte: 'lte',
        in: 'in',
        or: 'or'
      },
      Model: MockModel,
      DataTypes: {
        INTEGER: 'INTEGER',
        STRING: 'STRING',
        DATE: 'DATE',
        BOOLEAN: 'BOOLEAN',
        FLOAT: 'FLOAT',
        DECIMAL: 'DECIMAL',
        ENUM: () => 'ENUM'
      }
    };
  });
  
  jest.mock('../../../car/model/carModel', () => ({}), { virtual: true });
  jest.mock('../../../client/model/clientModel', () => ({}), { virtual: true });
  

describe('RentalRepository', () => {
    let rentalRepository;
    let mockRentalModel;
    let mockCarModel;
    let mockClientModel;
    let mockAuditRepository;
    
    beforeEach(() => {
      mockRentalModel = {
        build: jest.fn().mockReturnValue({
          save: jest.fn().mockResolvedValue({}),
          toJSON: () => ({
            id: 1,
            rentedCar: 1,
            rentedTo: 1,
            pricePerDay: 50
          })
        }),
        findAll: jest.fn().mockResolvedValue([]),
        findByPk: jest.fn(),
        findOne: jest.fn()
      };
      
      mockCarModel = {};
      mockClientModel = {};
      
      mockAuditRepository = {
        logAction: jest.fn()
      };
      
      rentalRepository = new RentalRepository(
        mockRentalModel, 
        mockCarModel, 
        mockClientModel, 
        mockAuditRepository
      );
    });
  
  describe('save', () => {
    test('should save a new rental', async () => {
      const rental = new Rental(
        null, // id
        1, // carId
        2, // clientId
        50, // pricePerDay
        new Date('2023-01-01'), // startDate
        new Date('2023-01-05'), // endDate
        250, // totalPrice
        'Card', // paymentMethod
        isPaid.PENDING, // paymentProgress
        new Date(), // createdAt
        new Date() // updatedAt
      );
      
      const mockRentalInstance = {
        save: jest.fn().mockResolvedValue({}),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          rentedCar: 1,
          rentedTo: 2,
          pricePerDay: 50
        })
      };
      
      mockRentalModel.build.mockReturnValue(mockRentalInstance);
      
      await rentalRepository.save(rental);
      
      expect(mockRentalModel.build).toHaveBeenCalled();
      expect(mockRentalInstance.save).toHaveBeenCalled();
    });
    
    test('should throw RentalNotDefinedError when rental is not provided', async () => {
      await expect(rentalRepository.save(null)).rejects.toThrow(RentalNotDefinedError);
      await expect(rentalRepository.save({})).rejects.toThrow(RentalNotDefinedError);
    });
  });
  
  describe('getAllRentals', () => {
    test('should return all rentals', async () => {
        mockRentalModel.findAll.mockResolvedValue([
          {
            id: 1,
            toJSON: () => ({ id: 1, rentedCar: 1, rentedTo: 1 })
          }
        ]);
        
        const result = await rentalRepository.getAllRentals();
        
        expect(mockRentalModel.findAll).toHaveBeenCalled();
        expect(result).toHaveLength(1);
      });
  });
  
  describe('getRentalById', () => {
    test('should return rental by id', async () => {
      const mockRental = {
        id: 1,
        rentedCar: 1,
        rentedTo: 2,
        pricePerDay: 50,
        rentalStart: new Date('2023-01-01'),
        rentalEnd: new Date('2023-01-05'),
        totalPrice: 250,
        paymentMethod: 'Card',
        isPaid: false,
        toJSON: () => ({
          id: 1,
          rentedCar: 1,
          rentedTo: 2
        })
      };
      
      mockRentalModel.findByPk.mockResolvedValue(mockRental);
      
      const result = await rentalRepository.getRentalById(1);
      
      expect(mockRentalModel.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(result).toBeInstanceOf(Rental);
    });
    
    test('should throw RentalIdNotDefinedError when id is not provided', async () => {
      await expect(rentalRepository.getRentalById(null)).rejects.toThrow(RentalIdNotDefinedError);
    });
    
    test('should throw RentalNotFoundError when rental is not found', async () => {
      mockRentalModel.findByPk.mockResolvedValue(null);
      await expect(rentalRepository.getRentalById(999)).rejects.toThrow(RentalNotFoundError);
    });
  });
  
  describe('getRentalsByClientId', () => {
    test('should return rentals by client id', async () => {
      const clientId = 2;
      const mockRentals = [
        {
          id: 1,
          rentedCar: 1,
          rentedTo: clientId,
          toJSON: () => ({
            id: 1,
            rentedCar: 1,
            rentedTo: clientId
          })
        }
      ];
      
      mockRentalModel.findAll.mockResolvedValue(mockRentals);
      
      const result = await rentalRepository.getRentalsByClientId(clientId);
      
      expect(mockRentalModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            rentedTo: clientId
          })
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Rental);
    });
  });
  
  describe('getRentalsByCarId', () => {
    test('should return rentals by car id', async () => {
      const carId = 1;
      const mockRentals = [
        {
          id: 1,
          rentedCar: carId,
          rentedTo: 2,
          toJSON: () => ({
            id: 1,
            rentedCar: carId,
            rentedTo: 2
          })
        }
      ];
      
      mockRentalModel.findAll.mockResolvedValue(mockRentals);
      
      const result = await rentalRepository.getRentalsByCarId(carId);
      
      expect(mockRentalModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            rentedCar: carId
          })
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Rental);
    });
    
    test('should throw error when car id is invalid', async () => {
      await expect(rentalRepository.getRentalsByCarId(null))
        .rejects
        .toThrow('Invalid car ID');
    });
  });
  
  describe('delete', () => {
    test('should delete a rental', async () => {
      const rental = new Rental(
        1, 1, 2, 50, new Date(), new Date(), 250, 'Card', isPaid.PENDING, new Date(), new Date()
      );
      
      const mockRentalInstance = {
        destroy: jest.fn().mockResolvedValue({}),
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          rentedCar: 1,
          rentedTo: 2
        })
      };
      
      mockRentalModel.findByPk.mockResolvedValue(mockRentalInstance);
      
      await rentalRepository.delete(rental);
      
      expect(mockRentalModel.findByPk).toHaveBeenCalledWith(1);
      expect(mockRentalInstance.destroy).toHaveBeenCalled();
    });
  });
});
