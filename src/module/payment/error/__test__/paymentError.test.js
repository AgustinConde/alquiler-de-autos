const {
  PaymentNotDefinedError,
  PaymentIdNotDefinedError,
  PaymentNotFoundError
} = require('../paymentError');

describe('Payment Errors', () => {
  describe('PaymentNotDefinedError', () => {
    test('should create error with default message', () => {
      const error = new PaymentNotDefinedError();
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Payment is not defined');
      expect(error.name).toBe('PaymentNotDefinedError');
    });
    
    test('should create error with custom message', () => {
      const customMessage = 'Custom payment not defined error';
      const error = new PaymentNotDefinedError(customMessage);
      expect(error.message).toBe(customMessage);
    });
  });
  
  describe('PaymentIdNotDefinedError', () => {
    test('should create error with default message', () => {
      const error = new PaymentIdNotDefinedError();
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Payment ID is not defined');
      expect(error.name).toBe('PaymentIdNotDefinedError');
    });
    
    test('should create error with custom message', () => {
      const customMessage = 'Custom payment ID error';
      const error = new PaymentIdNotDefinedError(customMessage);
      expect(error.message).toBe(customMessage);
    });
  });
  
  describe('PaymentNotFoundError', () => {
    test('should create error with default message', () => {
      const error = new PaymentNotFoundError();
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Payment not found');
      expect(error.name).toBe('PaymentNotFoundError');
    });
    
    test('should create error with custom message', () => {
      const customMessage = 'Custom payment not found error';
      const error = new PaymentNotFoundError(customMessage);
      expect(error.message).toBe(customMessage);
    });
  });
});
