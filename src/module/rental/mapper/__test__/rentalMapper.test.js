const { modelToEntity, formToEntity } = require('../rentalMapper');
const Rental = require('../../entity/Rental');
const { isPaid } = require('../../entity/RentalIsPaid');
const carMapperMock = require('../../../car/mapper/carMapper');

jest.mock('../../../car/mapper/carMapper', () => ({
  modelToEntity: jest.fn().mockReturnValue({ id: 1, brand: 'Toyota', model: 'Corolla' })
}));

jest.mock('../../../client/mapper/clientMapper', () => ({
  modelToEntity: jest.fn().mockReturnValue({ id: 1, name: 'John', surname: 'Doe' })
}));

describe('rentalMapper', () => {
  describe('modelToEntity', () => {
    test('should map model to entity with all properties', () => {
      const now = new Date();
      const model = {
        id: 1,
        rentedCar: 2,
        rentedTo: 3,
        pricePerDay: 50.5,
        rentalStart: '2023-05-01',
        rentalEnd: '2023-05-05',
        totalPrice: 202,
        paymentMethod: 'Card',
        isPaid: true,
        createdAt: now,
        updatedAt: now,
        Car: { id: 1, brand: 'Toyota', model: 'Corolla' },
        Client: { id: 3, name: 'John', surname: 'Doe' },
        dataValues: {
          id: 1,
          isPaid: true
        }
      };
      
      model.toJSON = function() {
        return {
          id: this.id,
          rentedCar: this.rentedCar,
          rentedTo: this.rentedTo,
          pricePerDay: this.pricePerDay,
          rentalStart: this.rentalStart,
          rentalEnd: this.rentalEnd,
          totalPrice: this.totalPrice,
          paymentMethod: this.paymentMethod,
          isPaid: this.isPaid,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        };
      };
      
      const result = modelToEntity(
        model, 
        carMapperMock.modelToEntity, 
        require('../../../client/mapper/clientMapper').modelToEntity
      );
      
      expect(result).toBeInstanceOf(Rental);
      expect(result.id).toBe(1);
      expect(result.rentedCar).toBe(2);
      expect(result.rentedTo).toBe(3);
      expect(result.pricePerDay).toBe(50.5);
      expect(result.totalPrice).toBe(202);
      expect(result.paymentMethod).toBe('Card');
      expect(result.paymentProgress).toEqual(isPaid.PAID);
      expect(result.createdAt).toEqual(now);
      expect(result.updatedAt).toEqual(now);
      expect(result.car).toBeDefined();
      expect(result.client).toBeDefined();
    });
    
    test('should handle model without Car and Client data', () => {
      const model = {
        id: 1,
        rentedCar: 2,
        rentedTo: 3,
        pricePerDay: 50,
        rentalStart: '2023-05-01',
        rentalEnd: '2023-05-05',
        totalPrice: 250,
        paymentMethod: 'Cash',
        isPaid: false,
        dataValues: { id: 1, isPaid: false }
      };
      
      model.toJSON = () => ({
        id: model.id,
        rentedCar: model.rentedCar,
        rentedTo: model.rentedTo,
        isPaid: model.isPaid
      });
      
      const result = modelToEntity(
        model, 
        carMapperMock.modelToEntity, 
        require('../../../client/mapper/clientMapper').modelToEntity
      );
      
      expect(result).toBeInstanceOf(Rental);
      expect(result.paymentProgress).toEqual(isPaid.PENDING);
      expect(result.car).toEqual({});
      expect(result.client).toEqual({});
    });
  });

  describe('formToEntity', () => {
    test('should map form data to entity', () => {
      const formData = {
        id: '1',
        'rented-car': '2',
        'rented-to': '3',
        'price-per-day': '50',
        'rental-start': '2023-05-01',
        'rental-end': '2023-05-05',
        'total-price': '250',
        'payment-method': 'Card',
        'is-paid': isPaid.PENDING,
        'created-at': '2023-04-30'
      };
      
      const result = formToEntity(formData);
      
      expect(result).toBeInstanceOf(Rental);
      expect(result.id).toBe('1');
      expect(result.rentedCar).toBe(2);
      expect(result.rentedTo).toBe(3);
      expect(result.pricePerDay).toBe(50);
      
      if (result.rentalStart instanceof Date) {
        expect(result.rentalStart.toISOString()).toContain('2023-05-01');
      } else {
        expect(result.rentalStart).toBe('2023-05-01');
      }
      if (result.rentalEnd instanceof Date) {
        expect(result.rentalEnd.toISOString()).toContain('2023-05-05');
      } else {
        expect(result.rentalEnd).toBe('2023-05-05');
      }

      expect(result.totalPrice).toBe(250);
      expect(result.paymentMethod).toBe('Card');
      expect(result.paymentProgress).toBe(isPaid.PENDING);
    });
    
    test('should handle minimal form data', () => {
      const formData = {
        'rented-car': '1',
        'rented-to': '2'
      };
      
      const result = formToEntity(formData);
      
      expect(result).toBeInstanceOf(Rental);
      expect(result.id).toBeUndefined();
      expect(result.rentedCar).toBe(1);
      expect(result.rentedTo).toBe(2);
    });

    test('should handle advanced form data conversion and validation', () => {
      const formData = {
        'rented-car': '1',
        'rented-to': '2',
        'price-per-day': '50.5',
        'rental-start': '2023-05-01',
        'rental-end': '2023-05-05',
        'total-price': '252.5',
        'payment-method': 'Bank Transfer',
        'payment-status': 'completed'
      };
      
      const result = formToEntity(formData);
      
      expect(result).toBeInstanceOf(Rental);
      expect(result.rentedCar).toBe(1);
      expect(result.rentedTo).toBe(2);
      expect(result.pricePerDay).toBe(50.5);
      expect(result.totalPrice).toBe(252.5);
      expect(result.paymentMethod).toBe('Bank Transfer');
      expect(result.paymentProgress).toBe(isPaid.PAID);
      
      expect(result.rentalStart.toISOString().split('T')[0]).toBe('2023-05-01');
      expect(result.rentalEnd.toISOString().split('T')[0]).toBe('2023-05-05');
    });
    
    test('should set default payment status when invalid value provided', () => {
      const formData = {
        'rented-car': '1',
        'rented-to': '2',
        'payment-status': 'invalid-status'
      };
      
      const result = formToEntity(formData);
      
      expect(result.paymentProgress).toBe(isPaid.PENDING);
    });
    
    test('should handle null or undefined payment status', () => {
      const formData = {
        'rented-car': '1',
        'rented-to': '2',
        'payment-status': null
      };
      
      const result = formToEntity(formData);
      
      expect(result.paymentProgress).toBe(isPaid.PENDING);
      
      const formData2 = {
        'rented-car': '1',
        'rented-to': '2'
      };
      
      const result2 = formToEntity(formData2);
      
      expect(result2.paymentProgress).toBe(isPaid.PENDING);
    });
  });
});
