const RentalService = require('../../service/rentalService');
const Rental = require('../../entity/Rental');
const { isPaid } = require('../../entity/RentalIsPaid');
const { RentalNotDefinedError, RentalIdNotDefinedError } = require('../../error/RentalError');

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
  });
  
  describe('checkCarAvailability', () => {
    test('should return true when car is available', async () => {
      mockRentalRepository.getRentalsByCarId.mockResolvedValue([]);
      
      const carId = 1;
      const startDate = '2023-01-01';
      const endDate = '2023-01-05';
      
      const result = await rentalService.checkCarAvailability(carId, startDate, endDate);
      
      expect(result).toBe(true);
      expect(mockRentalRepository.getRentalsByCarId).toHaveBeenCalledWith(carId);
    });
    
    test('should return false when car is not available', async () => {
      const overlappingRental = new Rental(
        1, // id
        1, // carId
        1, // clientId
        50, // pricePerDay
        new Date('2023-01-02'), // startDate
        new Date('2023-01-04'), // endDate
        100,
        'Card',
        isPaid.PENDING,
        new Date(),
        new Date()
      );
      
      mockRentalRepository.getRentalsByCarId.mockResolvedValue([overlappingRental]);
      
      const carId = 1;
      const startDate = '2023-01-01';
      const endDate = '2023-01-05';
      
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
  
  describe('getRentalById', () => {
    test('should return rental by id', async () => {
      const rentalId = 1;
      const mockRental = new Rental(
        rentalId, 1, 1, 50, new Date(), new Date(), 100, 'Card', isPaid.PENDING, new Date(), new Date()
      );
      
      mockRentalRepository.getRentalById.mockResolvedValue(mockRental);
      
      const result = await rentalService.getRentalById(rentalId);
      
      expect(result).toEqual(mockRental);
      expect(mockRentalRepository.getRentalById).toHaveBeenCalledWith(rentalId);
    });
    
    test('should throw error if rentalId is not provided', async () => {
      await expect(rentalService.getRentalById()).rejects.toThrow();
    });
  });
  
  describe('updatePaymentStatus', () => {
    test('should update payment status of a rental', async () => {
      const rentalId = 1;
      const isPaidStatus = true;
      
      const updateSpy = jest.spyOn(rentalService, 'update').mockImplementation(async () => {
        return {
          id: rentalId,
          paymentProgress: isPaidStatus ? isPaid.PAID : isPaid.PENDING
        };
      });
      
      await rentalService.updatePaymentStatus(rentalId, isPaidStatus);
      
      expect(updateSpy).toHaveBeenCalledWith(
        rentalId, 
        expect.objectContaining({
          paymentStatus: isPaidStatus ? 'completed' : 'pending'
        })
      );
      
      updateSpy.mockRestore();
    });
  });
});
