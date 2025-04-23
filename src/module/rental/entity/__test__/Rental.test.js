const Rental = require('../Rental');
const { isPaid } = require('../RentalIsPaid');

describe('Rental', () => {
  describe('constructor', () => {
    test('should create a rental with all properties', () => {
      const now = new Date();
      const startDate = new Date(now);
      const endDate = new Date(now.setDate(now.getDate() + 5));
      
      const rental = new Rental(
        1, 2, 3, 50.5, startDate, endDate, 252.5, 'Credit Card',
        isPaid.PAID, now, now, { id: 2, brand: 'Toyota' }, { id: 3, name: 'John' }
      );
      
      expect(rental.id).toBe(1);
      expect(rental.rentedCar).toBe(2);
      expect(rental.rentedTo).toBe(3);
      expect(rental.pricePerDay).toBe(50.5);
      expect(rental.rentalStart).toEqual(startDate);
      expect(rental.rentalEnd).toEqual(endDate);
      expect(rental.totalPrice).toBe(252.5);
      expect(rental.paymentMethod).toBe('Credit Card');
      expect(rental.paymentProgress).toBe(isPaid.PAID);
    });
    
    test('should initialize with default values', () => {
      const rental = new Rental();
      expect(rental.id).toBeUndefined();
    });
    
    test('should handle string dates without T', () => {
      const rental = new Rental(
        1, 2, 3, 50, '2023-05-01', '2023-05-05', 200, 'Cash'
      );
      expect(rental.rentalStart instanceof Date).toBe(true);
      expect(rental.rentalEnd instanceof Date).toBe(true);
    });
    
    test('should handle string dates with T', () => {
      const rental = new Rental(
        1, 2, 3, 50, '2023-05-01T10:00:00', '2023-05-05T10:00:00', 200, 'Cash'
      );
      expect(rental.rentalStart instanceof Date).toBe(true);
      expect(rental.rentalEnd instanceof Date).toBe(true);
    });
  });

  describe('formatDate method', () => {
    test('should format dates correctly', () => {
      const startDate = new Date('2023-05-01T12:00:00');
      const endDate = new Date('2023-05-05T12:00:00');
      
      const rental = new Rental(
        1, 101, 201, 50, startDate, endDate, 200, 'Cash',
        isPaid.PENDING, new Date(), null, {}, {}
      );
      
      expect(rental.formattedDates).toHaveProperty('startDate');
      expect(rental.formattedDates).toHaveProperty('endDate');
      expect(rental.formattedDates.startDate).toContain('5/1/2023');
      expect(rental.formattedDates.endDate).toContain('5/5/2023');
    });
    
    test('should handle null date values directly in formatDate', () => {
      const rental = new Rental(
        1, 101, 201, 50, new Date(), new Date(), 200, 'Cash',
        isPaid.PENDING, new Date(), null, {}, {}
      );
      
      rental.rentalStart = null;
      rental.rentalEnd = undefined;
      
      const result = rental.formatDate();
      
      expect(result.startDate).toBe('');
      expect(result.endDate).toBe('');
    });

    test('should handle invalid date formats', () => {
      const rental = new Rental(
        1, 101, 201, 50, 'invalid-date', 'also-invalid', 200, 'Cash',
        isPaid.PENDING, new Date(), null, {}, {}
      );
      
      expect(rental.formattedDates.startDate).toBe('Invalid Date');
      expect(rental.formattedDates.endDate).toBe('Invalid Date');
    });

    test('should handle exception in toLocaleString', () => {
      const rental = new Rental(
        1, 101, 201, 50, new Date(), new Date(), 200, 'Cash',
        isPaid.PENDING, new Date(), null, {}, {}
      );
      
      const originalToLocaleString = Date.prototype.toLocaleString;
      const originalConsoleError = console.error;
      
      Date.prototype.toLocaleString = function() {
        const error = new Error('Test error');
        error.name = 'RangeError';
        throw error;
      };
      
      console.error = jest.fn();
      
      const result = rental.formatDate();
      
      expect(console.error).toHaveBeenCalledWith('Error formatting date:', expect.any(Error));
      expect(result).toEqual({startDate: '', endDate: ''});
      
      Date.prototype.toLocaleString = originalToLocaleString;
      console.error = originalConsoleError;
    });
  });
  
  describe('Status getter', () => {
    test('should handle case with undefined paymentProgress', () => {
      const rental = new Rental(
        1, 101, 201, 50, new Date(), new Date(), 200, 'Cash',
        undefined, new Date(), null, {}, {}
      );
      
      expect(rental.status).toBe('Pending');
    });
    
    test('should return correct status for different payment progress values', () => {
      const paidRental = new Rental(
        1, 101, 201, 50, new Date(), new Date(), 200, 'Cash', 
        isPaid.PAID, new Date(), null, {}, {}
      );
      
      const pendingRental = new Rental(
        2, 101, 201, 50, new Date(), new Date(), 200, 'Cash', 
        isPaid.PENDING, new Date(), null, {}, {}
      );
      
      expect(paidRental.status).toBe('Completed');
      expect(pendingRental.status).toBe('Pending');
    });

    test('should handle invalid payment progress value', () => {
      const rental = new Rental(
        1, 101, 201, 50, new Date(), new Date(), 200, 'Cash',
        { value: 999, name: 'Unknown' }, new Date(), null, {}, {}
      );
      
      expect(rental.status).toBe('Pending');
    });
  });
  
  describe('rentalLength', () => {
    test('should calculate correct rental length', () => {
      const startDate = new Date('2023-05-01');
      const endDate = new Date('2023-05-05');
      
      const rental = new Rental(
        null, 2, 3, 50, startDate, endDate, 0, 'Credit Card'
      );
      
      const length = rental.rentalLength();
      expect(length).toBe(4);
    });
    
    test('should handle same day rental', () => {
      const startDate = new Date('2023-05-01');
      const endDate = new Date('2023-05-01');
      
      const rental = new Rental(
        null, 2, 3, 50, startDate, endDate, 0, 'Credit Card'
      );
      
      const length = rental.rentalLength();
      expect(length).toBe(1);
    });
  });
  
  describe('reserve', () => {
    test('should calculate correct total price', () => {
      const startDate = new Date('2023-05-01');
      const endDate = new Date('2023-05-05');
      
      const rental = new Rental(
        null, 2, 3, 50, startDate, endDate, 0, 'Credit Card'
      );
      
      const mockCar = { id: 2, pricePerDay: 50 };
      
      const result = rental.reserve(mockCar);
      
      expect(result.totalPrice).toBe(200);
    });
    
    test('should use car price if rental price is not set', () => {
      const startDate = new Date('2023-05-01');
      const endDate = new Date('2023-05-01');
      
      const rental = new Rental(
        null, 2, 3, null, startDate, endDate, 0, 'Credit Card'
      );
      
      const mockCar = { id: 2, pricePerDay: 75 };
      
      const result = rental.reserve(mockCar);
      
      expect(result.pricePerDay).toBe(75);
      expect(result.totalPrice).toBe(75);
    });
  });
  
  describe('pay and unblock methods', () => {
    test('should mark rental as paid and unblock correctly', () => {
      const rental = new Rental(
        1, 2, 3, 50, new Date(), new Date(), 50, 'Credit Card', isPaid.PENDING
      );
      
      expect(rental.paymentProgress).toBe(isPaid.PENDING);
      rental.pay();
      expect(rental.paymentProgress).toBe(isPaid.PAID);
      rental.unblock();
      expect(rental.paymentProgress).toBe(isPaid.PENDING);
    });
  });
  
  describe('isPaid getter', () => {
    test('should return true when rental is paid', () => {
      const rental = new Rental(
        1, 2, 3, 50, new Date(), new Date(), 50, 'Credit Card', isPaid.PAID
      );
      
      expect(rental.isPaid).toBe(true);
    });
    
    test('should return false when rental is not paid', () => {
      const rental = new Rental(
        1, 2, 3, 50, new Date(), new Date(), 50, 'Credit Card', isPaid.PENDING
      );
      
      expect(rental.isPaid).toBe(false);
    });
  });
  
  describe('date getters', () => {
    test('should provide access to rental dates', () => {
      const startDate = new Date('2023-05-01');
      const endDate = new Date('2023-05-05');
      
      const rental = new Rental(
        null, 2, 3, 50, startDate, endDate, 200, 'Credit Card'
      );
      
      expect(rental.startDate).toEqual(rental.rentalStart);
      expect(rental.endDate).toEqual(rental.rentalEnd);
    });
  });
});
