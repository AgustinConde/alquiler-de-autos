const { paymentStatus, getPaymentStatusById } = require('../PaymentStatus');

describe('PaymentStatus', () => {
  describe('paymentStatus', () => {
    test('should have the correct status constants', () => {
      expect(paymentStatus.PENDING).toBeDefined();
      expect(paymentStatus.COMPLETED).toBeDefined();
      expect(paymentStatus.FAILED).toBeDefined();
      expect(paymentStatus.REFUNDED).toBeDefined();
      
      expect(paymentStatus.PENDING.name).toBe('Pending');
      expect(paymentStatus.COMPLETED.name).toBe('Completed');
      expect(paymentStatus.FAILED.name).toBe('Failed');
      expect(paymentStatus.REFUNDED.name).toBe('Refunded');
      
      expect(paymentStatus.PENDING.value).toBe(0);
      expect(paymentStatus.COMPLETED.value).toBe(1);
      expect(paymentStatus.FAILED.value).toBe(2);
      expect(paymentStatus.REFUNDED.value).toBe(3);
    });
  });
  
  describe('getPaymentStatusById', () => {
    test('should return PENDING status for value 0', () => {
      const result = getPaymentStatusById(0);
      expect(result).toBe(paymentStatus.PENDING);
    });
    
    test('should return COMPLETED status for value 1', () => {
      const result = getPaymentStatusById(1);
      expect(result).toBe(paymentStatus.COMPLETED);
    });
    
    test('should return FAILED status for value 2', () => {
      const result = getPaymentStatusById(2);
      expect(result).toBe(paymentStatus.FAILED);
    });
    
    test('should return REFUNDED status for value 3', () => {
      const result = getPaymentStatusById(3);
      expect(result).toBe(paymentStatus.REFUNDED);
    });
    
    test('should return undefined for invalid value', () => {
      const result = getPaymentStatusById(999);
      expect(result).toBe(paymentStatus.PENDING);
    });
    
    test('should handle null or undefined input', () => {
      expect(getPaymentStatusById(null)).toBe(paymentStatus.PENDING);
      expect(getPaymentStatusById(undefined)).toBe(paymentStatus.PENDING);
    });
  });
});
