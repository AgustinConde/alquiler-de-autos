const { modelToEntity, formToEntity } = require('../paymentMapper');
const Payment = require('../../entity/Payment');
const { paymentStatus } = require('../../entity/PaymentStatus');

describe('paymentMapper', () => {
  describe('modelToEntity', () => {
    test('should map model to entity with all properties', () => {
      const now = new Date();
      const model = {
        id: 1,
        rentalId: 123,
        amount: 100.50,
        provider: 'PayPal',
        transactionId: 'txn_12345',
        status: 1, // COMPLETED
        createdAt: now,
        updatedAt: now,
        toJSON: function() {
          return {
            id: this.id,
            rentalId: this.rentalId,
            amount: this.amount,
            provider: this.provider,
            transactionId: this.transactionId,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
          };
        }
      };
      
      const result = modelToEntity(model);
      
      expect(result).toBeInstanceOf(Payment);
      expect(result.id).toBe(1);
      expect(result.rentalId).toBe(123);
      expect(result.amount).toBe(100.50);
      expect(result.provider).toBe('PayPal');
      expect(result.transactionId).toBe('txn_12345');
      expect(result.status).toBe(paymentStatus.COMPLETED);
      expect(result.createdAt).toEqual(now);
      expect(result.updatedAt).toEqual(now);
    });
    
    test('should handle null status', () => {
      const model = {
        id: 1,
        status: null,
        toJSON: () => ({ id: 1, status: null })
      };
      
      const result = modelToEntity(model);
      
      expect(result.status).toBe(paymentStatus.PENDING);
    });
    
    test('should handle model without toJSON method', () => {
      const now = new Date();
      const model = {
        id: 1,
        rentalId: 123,
        amount: 100.50,
        provider: 'PayPal',
        transactionId: 'txn_12345',
        status: 1,
        createdAt: now,
        updatedAt: now
      };
      
      const result = modelToEntity(model);
      
      expect(result).toBeInstanceOf(Payment);
      expect(result.id).toBe(1);
      expect(result.status).toBe(paymentStatus.COMPLETED);
    });
  });

  describe('formToEntity', () => {
    test('should map form data to entity', () => {
      const formData = {
        id: '1',
        rentalId: '123',
        amount: '100.50',
        provider: 'PayPal',
        transactionId: 'txn_12345',
        status: '1'
      };
      
      const result = formToEntity(formData);
      
      expect(result).toBeInstanceOf(Payment);
      expect(result.id).toBe(1);
      expect(result.rentalId).toBe(123);
      expect(result.amount).toBe(100.50);
      expect(result.provider).toBe('PayPal');
      expect(result.transactionId).toBe('txn_12345');
      expect(result.status).toBe(paymentStatus.COMPLETED);
    });
    
    test('should handle empty form data', () => {
      const result = formToEntity({});
      
      expect(result).toBeInstanceOf(Payment);
      expect(result.status).toBe(paymentStatus.PENDING);
    });
  });
});
