const RentalService = require('../../service/rentalService');
const Rental = require('../../entity/Rental');
const { isPaid } = require('../../entity/RentalIsPaid');
const { RentalNotDefinedError, RentalIdNotDefinedError, RentalNotFoundError } = require('../../error/RentalError');

describe('RentalService', () => {
  const mockRentalRepository = {
    save: jest.fn(),
    getAllRentals: jest.fn(),
    getRentalById: jest.fn(),
    getRentalsByStatus: jest.fn(),
    getRentalsByCarId: jest.fn(),
    getRentalsByClientId: jest.fn(),
    delete: jest.fn(),
    restore: jest.fn(),
    getOverlappingRentals: jest.fn(),
    updatePaymentStatus: jest.fn(),
  };
  
  const mockCarRepository = {
    getCarById: jest.fn(),
  };
  
  let rentalService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    rentalService = new RentalService(mockRentalRepository, mockCarRepository);
  });
  
  describe('pay', () => {
    test('should throw RentalNotDefinedError when rental is not an instance of Rental', async () => {
      const invalidRental = { id: 1, totalPrice: 100 };
      
      await expect(rentalService.pay(invalidRental))
        .rejects
        .toThrow(RentalNotDefinedError);
      
      expect(mockRentalRepository.save).not.toHaveBeenCalled();
    });
    
    test('should call pay on rental and save it', async () => {
      const rental = new Rental(
        1, // id
        1, // carId
        1, // clientId
        50, // pricePerDay
        new Date('2023-01-01'), // startDate
        new Date('2023-01-10'), // endDate
        500, // totalPrice
        'Card', // paymentMethod
        isPaid.PENDING, // paymentProgress
        new Date(), // createdAt
        new Date(), // updatedAt
        { brand: 'Toyota', model: 'Corolla' }, // car
        { name: 'John', surname: 'Doe' } // client
      );
      
      const payMethod = jest.spyOn(rental, 'pay');
      mockRentalRepository.save.mockResolvedValue(rental);
      
      const result = await rentalService.pay(rental);
      
      expect(payMethod).toHaveBeenCalled();
      expect(mockRentalRepository.save).toHaveBeenCalledWith(rental);
      expect(result).toEqual(rental);
      expect(result.paymentProgress).toEqual(isPaid.PAID);
    });
  });
  
  describe('getRentalById', () => {
    test('should throw RentalIdNotDefinedError when id is invalid', async () => {
      await expect(rentalService.getRentalById(null))
        .rejects
        .toThrow(RentalIdNotDefinedError);
      
      expect(mockRentalRepository.getRentalById).not.toHaveBeenCalled();
    });
    
    test('should return rental when found by id', async () => {
      const rental = new Rental(
        1, // id
        1, // carId
        1, // clientId
        50, // pricePerDay
        new Date('2023-01-01'), // startDate
        new Date('2023-01-10'), // endDate
        500, // totalPrice
        'Card', // paymentMethod
        isPaid.PAID, // paymentProgress
        new Date(), // createdAt
        new Date(), // updatedAt
        { brand: 'Toyota', model: 'Corolla' }, // car
        { name: 'John', surname: 'Doe' } // client
      );
      mockRentalRepository.getRentalById.mockResolvedValue(rental);
      
      const result = await rentalService.getRentalById(1);
      
      expect(mockRentalRepository.getRentalById).toHaveBeenCalledWith(1);
      expect(result).toEqual(rental);
    });
    
    test('should throw error when rental not found', async () => {
      mockRentalRepository.getRentalById.mockResolvedValue(null);

      const invalidRentalId = 999;
      
      await expect(rentalService.getRentalById(invalidRentalId))
        .rejects
        .toThrow(`Rental with ID ${invalidRentalId} not found`);
    });

    test('should handle error details in getRentalById', async () => {
      mockRentalRepository.getRentalById.mockImplementation(() => {
        const error = new Error('Database connection failed');
        error.code = 'ECONNREFUSED';
        throw error;
      });
      
      await expect(rentalService.getRentalById(1))
        .rejects
        .toThrow('Database connection failed');
    });
  });
  
  describe('checkCarAvailability', () => {
    test('should return true when car is available', async () => {
      mockRentalRepository.getRentalsByCarId.mockResolvedValue([]);
      
      const carId = 1;
      const startDate = '2025-01-01';
      const endDate = '2025-01-05';
      
      const result = await rentalService.checkCarAvailability(carId, startDate, endDate);
      
      expect(result).toBe(true);
      expect(mockRentalRepository.getRentalsByCarId).toHaveBeenCalledWith(carId);
    });
    
    test('should throw error when car is not available', async () => {
      const overlappingRental = new Rental(
        1, // id
        1, // carId
        1, // clientId
        50, // pricePerDay
        new Date('2025-01-02'), // startDate
        new Date('2025-01-04'), // endDate
        100,
        'Card',
        isPaid.PENDING,
        new Date(),
        new Date()
      );
      
      mockRentalRepository.getRentalsByCarId.mockResolvedValue([overlappingRental]);
      
      const carId = 1;
      const startDate = '2025-01-01';
      const endDate = '2025-01-05';
      
      await expect(rentalService.checkCarAvailability(carId, startDate, endDate))
        .rejects
        .toThrow('This car is not available for the selected dates');
    });
  });

  describe('updatePaymentStatus', () => {
    test('should update payment status correctly', async () => {
      const updateSpy = jest.spyOn(rentalService, 'update');
      updateSpy.mockResolvedValue({});
      
      await rentalService.updatePaymentStatus(1, true);
      
      expect(updateSpy).toHaveBeenCalledWith(1, {
        paymentStatus: 'completed'
      });
      
      updateSpy.mockRestore();
    });
    
    test('should set payment status to pending when isPaidStatus is false', async () => {
      const rentalId = 1;
      const isPaidStatus = false;
      
      const updateSpy = jest.spyOn(rentalService, 'update').mockImplementation(async () => {
        return {
          id: rentalId,
          paymentProgress: isPaid.PENDING
        };
      });
      
      const result = await rentalService.updatePaymentStatus(rentalId, isPaidStatus);
      
      expect(updateSpy).toHaveBeenCalledWith(rentalId, {
        paymentStatus: 'pending'
      });
      
      expect(result.paymentProgress).toEqual(isPaid.PENDING);
      
      updateSpy.mockRestore();
    });
  });

  describe('saveRental', () => {
    test('should save new rental successfully', async () => {
      const rentalData = {
        rentedCar: 1,
        rentedTo: 1,
        pricePerDay: 50,
        rentalStart: '2023-05-01',
        rentalEnd: '2023-05-05',
        totalPrice: 250,
        paymentMethod: 'Card',
        paymentProgress: isPaid.PENDING
      };
      
      jest.spyOn(rentalService, 'checkCarAvailability').mockResolvedValue(true);
      
      const savedRental = new Rental(
        1, // id
        rentalData.rentedCar,
        rentalData.rentedTo,
        rentalData.pricePerDay,
        new Date(rentalData.rentalStart),
        new Date(rentalData.rentalEnd),
        rentalData.totalPrice,
        rentalData.paymentMethod,
        rentalData.paymentProgress,
        new Date(), // createdAt
        new Date(), // updatedAt
        { id: 1, brand: 'Toyota', model: 'Corolla' }, // car
        { id: 1, name: 'Test Client' } // client
      );
      
      mockRentalRepository.save.mockResolvedValue(savedRental);
      
      const result = await rentalService.saveRental(rentalData);
      
      expect(rentalService.checkCarAvailability).toHaveBeenCalledWith(
        rentalData.rentedCar,
        rentalData.rentalStart,
        rentalData.rentalEnd
      );
      expect(mockRentalRepository.save).toHaveBeenCalled();
      expect(result).toEqual(savedRental);
    });
    
    test('should throw error when service fails', async () => {
      const rentalData = {
        rentedCar: 1,
        rentedTo: 1,
        pricePerDay: 50,
        rentalStart: '2023-05-01',
        rentalEnd: '2023-05-05'
      };
      
      const errorMessage = 'Test error';
      jest.spyOn(rentalService, 'checkCarAvailability').mockRejectedValue(new Error(errorMessage));
      
      await expect(rentalService.saveRental(rentalData))
        .rejects
        .toThrow(`Failed to create rental: ${errorMessage}`);
    });
  });
  
  describe('cancelRental', () => {
    test('should delete rental when client is the owner', async () => {
      const rentalId = 1;
      const clientId = 1;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 2);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 3);

      const rental = new Rental(
        rentalId, // id
        1, // carId
        clientId, // clientId
        50, // pricePerDay
        startDate,
        endDate,
        250, // totalPrice
        'Card',
        isPaid.PENDING,
        new Date(),
        new Date(),
        { brand: 'Toyota', model: 'Corolla' },
        { id: clientId, name: 'Test Client' }
      );
      
      mockRentalRepository.getRentalById.mockResolvedValue(rental);
      mockRentalRepository.delete.mockResolvedValue(rental);

      const expectedResponse = {
        success: true,
        message: "Rental cancelled successfully."
      };
      
      const result = await rentalService.cancelRental(rentalId, clientId);
      
      expect(mockRentalRepository.getRentalById).toHaveBeenCalledWith(rentalId);
      expect(mockRentalRepository.delete).toHaveBeenCalledWith(rental);
      expect(result).toEqual(expectedResponse);
    });
    
    test('should throw error when client is not the owner', async () => {
      const rentalId = 1;
      const clientId = 1;
      const wrongClientId = 2;
      
      const rental = new Rental(
        rentalId,
        1,
        clientId,
        50,
        new Date('2023-05-01'),
        new Date('2023-05-05'),
        250,
        'Card',
        isPaid.PENDING,
        new Date(),
        new Date(),
        { brand: 'Toyota', model: 'Corolla' },
        { id: clientId, name: 'Test Client' }
      );
      
      mockRentalRepository.getRentalById.mockResolvedValue(rental);
      
      await expect(rentalService.cancelRental(rentalId, wrongClientId))
        .rejects
        .toThrow('Unauthorized');
    });

    test('should throw an error when rental date is too close to cancel', async () => {
      const rentalId = 1;
      const clientId = 1;
      const now = new Date();
      
      const startDate = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      
      const rental = new Rental(
        rentalId,
        1,
        clientId,
        50,
        startDate, 
        new Date(startDate.getTime() + 86400000), // 1 day later
        250,
        'Card',
        isPaid.PENDING,
        now,
        null,
        {},
        { id: clientId }
      );
      
      mockRentalRepository.getRentalById.mockResolvedValue(rental);
      
      await expect(rentalService.cancelRental(rentalId, clientId))
        .rejects
        .toThrow("Cannot cancel a rental with less than 24 hours of anticipation.");
    });

    test('should throw RentalIdNotDefinedError for invalid rental ID', async () => {
      await expect(rentalService.cancelRental(null, 1))
        .rejects
        .toThrow(RentalIdNotDefinedError);
      
      expect(mockRentalRepository.getRentalById).not.toHaveBeenCalled();
    });
  });
  
  describe('getRentalsByClientId', () => {
    test('should return rentals for a client', async () => {
      const clientId = 1;
      const mockRentals = [
        new Rental(1, 1, clientId, 50, new Date(), new Date(), 100, 'Card', isPaid.PENDING, new Date(), new Date())
      ];
      
      mockRentalRepository.getRentalsByClientId.mockResolvedValue(mockRentals);
      
      const result = await rentalService.getRentalsByClientId(clientId);
      
      expect(result).toEqual(mockRentals);
      expect(mockRentalRepository.getRentalsByClientId).toHaveBeenCalledWith(clientId);
    });
    
    test('should throw error if clientId is not provided', async () => {
      await expect(rentalService.getRentalsByClientId()).rejects.toThrow();
    });
  });
  
  describe('getAll', () => {
    test('should return all rentals', async () => {
      const mockRentals = [
        new Rental(1, 1, 1, 50, new Date(), new Date(), 100, 'Card', isPaid.PENDING, new Date(), new Date())
      ];
      
      mockRentalRepository.getAllRentals.mockResolvedValue(mockRentals);
      
      const result = await rentalService.getAll();
      
      expect(result).toEqual(mockRentals);
      expect(mockRentalRepository.getAllRentals).toHaveBeenCalled();
    });
  });
  
  describe('getByPaymentProgress', () => {
    test('should return rentals with specific payment status', async () => {
      const mockRentals = [
        new Rental(1, 1, 1, 50, new Date(), new Date(), 100, 'Card', isPaid.PAID, new Date(), new Date())
      ];
      
      mockRentalRepository.getRentalsByStatus.mockResolvedValue(mockRentals);
      
      const result = await rentalService.getByPaymentProgress(isPaid.PAID);
      
      expect(mockRentalRepository.getRentalsByStatus).toHaveBeenCalledWith(
        expect.arrayContaining([isPaid.PAID.value])
      );
      expect(result).toEqual(mockRentals);
    });
    
    test('should pass multiple payment statuses', async () => {
      mockRentalRepository.getRentalsByStatus.mockResolvedValue([]);
      
      await rentalService.getByPaymentProgress(isPaid.PAID, isPaid.PENDING);
      
      expect(mockRentalRepository.getRentalsByStatus).toHaveBeenCalledWith(
        expect.arrayContaining([isPaid.PAID.value, isPaid.PENDING.value])
      );
    });
  });
  
  describe('delete', () => {
    test('should delete rental by id', async () => {
      const rentalId = 1;
      const mockRental = new Rental(
        rentalId, 1, 1, 50, new Date(), new Date(), 100, 'Card', isPaid.PENDING, new Date(), new Date()
      );
      
      mockRentalRepository.getRentalById.mockResolvedValue(mockRental);
      mockRentalRepository.delete.mockResolvedValue(mockRental);
      
      const result = await rentalService.delete(rentalId);
      
      expect(mockRentalRepository.getRentalById).toHaveBeenCalledWith(rentalId);
      expect(mockRentalRepository.delete).toHaveBeenCalledWith(mockRental);
      expect(result).toEqual(mockRental);
    });
    
    test('should throw error when rental not found', async () => {
      mockRentalRepository.getRentalById.mockResolvedValue(null);
      
      await expect(rentalService.delete(999)).rejects.toThrow(RentalNotFoundError);
    });
    
    test('should throw error for invalid rental id', async () => {
      await expect(rentalService.delete(null)).rejects.toThrow(RentalIdNotDefinedError);
      expect(mockRentalRepository.getRentalById).not.toHaveBeenCalled();
    });
  });
  
  describe('update', () => {
    test('should update rental with new data', async () => {
      const rentalId = 1;
      const now = new Date();
      const existingRental = new Rental(
        rentalId,
        1, // car id
        1, // client id
        50, // price per day
        new Date('2023-05-01'), // start date
        new Date('2023-05-05'), // end date
        250, // total price
        'Card', // payment method
        isPaid.PENDING, // payment status
        now, // created at
        now, // updated at
        { id: 1, brand: 'Toyota' }, // car
        { id: 1, name: 'John' } // client
      );
      
      const updateData = {
        startDate: '2023-05-02',
        endDate: '2023-05-06',
        totalPrice: 300,
        paymentStatus: 'completed'
      };
      
      mockRentalRepository.getRentalById.mockResolvedValue(existingRental);
      mockRentalRepository.save.mockImplementation(rental => Promise.resolve(rental));
      
      const result = await rentalService.update(rentalId, updateData);
      
      expect(mockRentalRepository.getRentalById).toHaveBeenCalledWith(rentalId);
      expect(mockRentalRepository.save).toHaveBeenCalled();
      expect(result.rentalStart).toEqual(new Date('2023-05-02T12:00:00'));
      expect(result.rentalEnd).toEqual(new Date('2023-05-06T12:00:00'));
      expect(result.totalPrice).toBe(300);
      expect(result.paymentProgress).toEqual(isPaid.PAID);
    });
    
    test('should update only payment status', async () => {
      const rentalId = 1;
      const now = new Date();
      const existingRental = new Rental(
        rentalId,
        1, // car id
        1, // client id
        50, // price per day
        new Date('2023-05-01'), // start date
        new Date('2023-05-05'), // end date
        250, // total price
        'Card', // payment method
        isPaid.PENDING, // payment status
        now, // created at
        now, // updated at
        { id: 1, brand: 'Toyota' }, // car
        { id: 1, name: 'John' } // client
      );
      
      const updateData = {
        paymentStatus: 'pending'
      };
      
      mockRentalRepository.getRentalById.mockResolvedValue(existingRental);
      mockRentalRepository.save.mockImplementation(rental => Promise.resolve(rental));
      
      const result = await rentalService.update(rentalId, updateData);
      
      expect(result.paymentProgress).toEqual(isPaid.PENDING);
      expect(result.rentalStart).toEqual(existingRental.rentalStart);
      expect(result.rentalEnd).toEqual(existingRental.rentalEnd);
    });
    
    test('should handle update with different payment status', async () => {
      const rentalId = 1;
      const existingRental = new Rental(
        rentalId, 1, 1, 50, new Date(), new Date(), 100, 'Card', 
        { value: 999, name: 'Custom' },
        new Date(), new Date()
      );
      
      mockRentalRepository.getRentalById.mockResolvedValue(existingRental);
      mockRentalRepository.save.mockImplementation(rental => Promise.resolve(rental));
      
      const result = await rentalService.update(rentalId, {
        paymentStatus: 'unknown' 
      });
      
      expect(result.paymentProgress).toEqual(existingRental.paymentProgress);
    });

    test('should properly handle console logs in update method', async () => {
      const rentalId = 1;
      const existingRental = new Rental(
        rentalId, 1, 1, 50, new Date(), new Date(), 100, 'Card',
        isPaid.PENDING, new Date(), new Date()
      );
      
      const originalConsoleLog = console.log;
      
      console.log = jest.fn();
      
      mockRentalRepository.getRentalById.mockResolvedValue(existingRental);
      mockRentalRepository.save.mockImplementation(rental => Promise.resolve(rental));
      
      await rentalService.update(rentalId, {
        paymentStatus: 'completed'
      });
      
      expect(console.log).toHaveBeenCalledWith(
        '💰 Updated payment progress:',
        expect.any(String)
      );
      
      console.log = originalConsoleLog;
    });

    test('should throw RentalIdNotDefinedError for invalid rental ID in update', async () => {
      await expect(rentalService.update(null, { paymentStatus: 'completed' }))
        .rejects
        .toThrow(RentalIdNotDefinedError);
      
      await expect(rentalService.update('abc', { paymentStatus: 'completed' }))
        .rejects
        .toThrow(RentalIdNotDefinedError);
      
      expect(mockRentalRepository.getRentalById).not.toHaveBeenCalled();
    });

    test('should throw RentalNotFoundError when rental not found in update method', async () => {
      const rentalId = 999;
      
      const originalGetById = rentalService.getRentalById;
      
      rentalService.getRentalById = jest.fn().mockImplementation(() => {
        throw new RentalNotFoundError(`Rental with ID ${rentalId} not found`);
      });
      
      await expect(rentalService.update(rentalId, { paymentStatus: 'completed' }))
        .rejects
        .toThrow(new RentalNotFoundError(`Rental with ID ${rentalId} not found`).message);
      
      expect(rentalService.getRentalById).toHaveBeenCalledWith(rentalId);
      
      rentalService.getRentalById = originalGetById;
    });
  });
});
