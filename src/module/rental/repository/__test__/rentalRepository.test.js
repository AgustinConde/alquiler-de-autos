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

    test('should handle rental with existing ID', async () => {
      const rental = new Rental(
        1,
        1, 2, 50, new Date(), new Date(), 250, 'Card', 
        isPaid.PENDING, new Date(), new Date()
      );
      
      mockRentalModel.findByPk.mockResolvedValue(null);
      
      const mockRentalInstance = {
        save: jest.fn().mockResolvedValue({}),
        toJSON: () => ({
          id: 1,
          rentedCar: 1,
          rentedTo: 2
        })
      };

      mockRentalModel.build.mockReturnValue(mockRentalInstance);
      
      const result = await rentalRepository.save(rental);
      
      expect(mockRentalModel.build).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ isNewRecord: false })
      );
      
      expect(mockRentalInstance.save).toHaveBeenCalled();
    });

    test('should handle null updatedAt in rental', async () => {
      const rental = new Rental(
        1, // ID
        1, 2, 50, new Date(), new Date(), 250, 'Card', 
        isPaid.PENDING, new Date(), null // null updatedAt
      );
      
      const mockRentalInstance = {
        save: jest.fn().mockResolvedValue({}),
        toJSON: () => ({
          id: 1,
          rentedCar: 1,
          rentedTo: 2
        })
      };
      
      mockRentalModel.build.mockReturnValue(mockRentalInstance);
      
      const spy = jest.spyOn(mockRentalModel, 'build');
      
      await rentalRepository.save(rental);
      
      const buildCallArg = spy.mock.calls[0][0];
      expect(buildCallArg.updatedAt).not.toBeNull();
      expect(buildCallArg.updatedAt instanceof Date).toBe(true);
      
      spy.mockRestore();
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

    test('should handle rental with valid Client property (line 137)', async () => {
      const mockRental = {
        id: 1,
        rentedCar: 1,
        rentedTo: 2,
        Client: {
          id: 2,
          name: 'John Doe'
        },
        Car: {},
        toJSON: () => ({
          id: 1,
          rentedCar: 1,
          rentedTo: 2
        })
      };
      
      mockRentalModel.findByPk.mockResolvedValue(mockRental);
      
      const spy = jest.spyOn(console, 'log');
      
      const result = await rentalRepository.getRentalById(1);
      
      expect(spy).toHaveBeenCalledWith(
        '🔍 Database data for rental:',
        expect.objectContaining({ 
          client: expect.objectContaining({
            id: 2,
            name: 'John Doe'
          })
        })
      );
      
      spy.mockRestore();
    });

    test('should handle rental with null Client property', async () => {
      const mockRental = {
        id: 1,
        rentedCar: 1,
        rentedTo: 2,
        Client: null,
        Car: {},
        toJSON: () => ({
          id: 1,
          rentedCar: 1,
          rentedTo: 2
        })
      };
      
      mockRentalModel.findByPk.mockResolvedValue(mockRental);
      
      const spy = jest.spyOn(console, 'log');
      
      const result = await rentalRepository.getRentalById(1);
      
      expect(console.log).toHaveBeenCalledWith(
        '🔍 Database data for rental:',
        expect.objectContaining({ 
          id: 1,
          client: 'No client data'
        })
      );
      
      expect(result).toBeInstanceOf(Rental);
      expect(result.client).toEqual({});
      
      spy.mockRestore();
    });
  });

  describe('getRentalsByStatus', () => {
    test('should return rentals filtered by single status', async () => {
      const mockRentals = [
        {
          id: 1,
          isPaid: true,
          toJSON: () => ({ id: 1, isPaid: true })
        }
      ];
      
      mockRentalModel.findAll.mockResolvedValue(mockRentals);
      
      const result = await rentalRepository.getRentalsByStatus(isPaid.PAID.value);
      
      expect(mockRentalModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            paymentProgress: {
              [require('sequelize').Op.or]: [isPaid.PAID.value]
            }
          }
        })
      );
      
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Rental);
    });
    
    test('should return rentals filtered by multiple statuses', async () => {
      const mockRentals = [
        { id: 1, isPaid: true, toJSON: () => ({ id: 1, isPaid: true }) },
        { id: 2, isPaid: false, toJSON: () => ({ id: 2, isPaid: false }) }
      ];
      
      mockRentalModel.findAll.mockResolvedValue(mockRentals);
      
      const result = await rentalRepository.getRentalsByStatus(
        isPaid.PAID.value, 
        isPaid.PENDING.value
      );
      
      expect(mockRentalModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            paymentProgress: {
              [require('sequelize').Op.or]: [isPaid.PAID.value, isPaid.PENDING.value]
            }
          }
        })
      );
      
      expect(result).toHaveLength(2);
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

    test('should throw error when client id is invalid', async () => {
      await expect(rentalRepository.getRentalsByClientId(null))
        .rejects
        .toThrow('Invalid client ID');
        
      await expect(rentalRepository.getRentalsByClientId('abc'))
        .rejects
        .toThrow('Invalid client ID');
        
      expect(mockRentalModel.findAll).not.toHaveBeenCalled();
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

    test('should throw RentalNotDefinedError when rental is not a Rental instance', async () => {
      const notARental = {
        id: 1,
        rentedCar: 1,
        rentedTo: 2
      };
      
      await expect(rentalRepository.delete(notARental))
        .rejects
        .toThrow(RentalNotDefinedError);
        
      expect(mockRentalModel.findByPk).not.toHaveBeenCalled();
    });
    
    test('should throw RentalNotFoundError when rental is not found', async () => {
      const rental = new Rental(
        999,
        1, 2, 50, new Date(), new Date(), 250, 'Card', 
        isPaid.PENDING, new Date(), new Date()
      );
      
      mockRentalModel.findByPk.mockResolvedValue(null);
      
      await expect(rentalRepository.delete(rental))
        .rejects
        .toThrow(RentalNotFoundError);
        
      expect(mockRentalModel.findByPk).toHaveBeenCalledWith(999);
    });
  });

  describe('restore', () => {
    test('should restore a deleted rental', async () => {
      const mockRentalInstance = {
        id: 1,
        rentedCar: 1,
        rentedTo: 2,
        deletedAt: new Date(),
        restore: jest.fn().mockResolvedValue({}),
        toJSON: () => ({
          id: 1,
          rentedCar: 1,
          rentedTo: 2,
          deletedAt: new Date()
        })
      };
      
      mockRentalModel.findByPk.mockResolvedValue(mockRentalInstance);
      
      const result = await rentalRepository.restore(1);
      
      expect(mockRentalModel.findByPk).toHaveBeenCalledWith(1, {
        paranoid: false,
        include: expect.arrayContaining([
          expect.objectContaining({ model: expect.anything() })
        ])
      });
      
      expect(mockRentalInstance.restore).toHaveBeenCalled();
      
      expect(result).toBeInstanceOf(Rental);
    });
    
    test('should throw error when rental is not deleted', async () => {
      const mockRentalInstance = {
        id: 1,
        deletedAt: null,
        restore: jest.fn(),
        toJSON: () => ({
          id: 1,
          deletedAt: null
        })
      };
      
      mockRentalModel.findByPk.mockResolvedValue(mockRentalInstance);
      
      await expect(rentalRepository.restore(1))
        .rejects
        .toThrow('Rental is not deleted.');
        
      expect(mockRentalInstance.restore).not.toHaveBeenCalled();
    });
    
    test('should throw RentalIdNotDefinedError when id is invalid', async () => {
      await expect(rentalRepository.restore(null))
        .rejects
        .toThrow(RentalIdNotDefinedError);
        
      await expect(rentalRepository.restore('abc'))
        .rejects
        .toThrow(RentalIdNotDefinedError);
        
      expect(mockRentalModel.findByPk).not.toHaveBeenCalled();
    });
    
    test('should throw RentalNotFoundError when rental not found', async () => {
      mockRentalModel.findByPk.mockResolvedValue(null);
      
      await expect(rentalRepository.restore(999))
        .rejects
        .toThrow(RentalNotFoundError);
    });
  });
});
