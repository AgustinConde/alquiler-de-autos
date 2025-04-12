const PaymentService = require('../../service/paymentService');
const Payment = require('../../entity/Payment');
const { paymentStatus } = require('../../entity/PaymentStatus');
const paypal = require('@paypal/checkout-server-sdk');

jest.mock('@paypal/checkout-server-sdk', () => {
  const mockOrdersCreateRequest = {
    prefer: jest.fn().mockReturnThis(),
    requestBody: jest.fn().mockReturnThis()
  };
  
  const mockOrdersCaptureRequest = {
    requestBody: jest.fn().mockReturnThis()
  };
  
  const mockExecute = jest.fn().mockImplementation(() => {
    return Promise.resolve({
      result: {
        id: 'TEST_ORDER_ID',
        status: 'COMPLETED',
        links: [
          {
            rel: 'approve',
            href: 'https://www.sandbox.paypal.com/approve'
          }
        ]
      }
    });
  });
  
  const mockClient = {
    execute: mockExecute
  };
  
  const mockEnvironment = {
    sandbox: {}
  };
  
  return {
    core: {
      SandboxEnvironment: jest.fn().mockImplementation(() => mockEnvironment),
      LiveEnvironment: jest.fn().mockImplementation(() => mockEnvironment),
      PayPalHttpClient: jest.fn().mockImplementation(() => mockClient)
    },
    orders: {
      OrdersCreateRequest: jest.fn().mockImplementation(() => mockOrdersCreateRequest),
      OrdersCaptureRequest: jest.fn().mockImplementation(() => mockOrdersCaptureRequest)
    }
  };
});

describe('PaymentService', () => {
  let paymentService;
  let mockPaymentRepository;
  let mockRentalService;
  let originalEnv;
  
  beforeEach(() => {
    originalEnv = { ...process.env };
    
    mockPaymentRepository = {
      save: jest.fn(),
      getById: jest.fn(),
      getByRentalId: jest.fn(),
      getAll: jest.fn(),
      delete: jest.fn()
    };
    
    mockRentalService = {
      getRentalById: jest.fn(),
      updatePaymentStatus: jest.fn()
    };
    
    paymentService = new PaymentService(mockPaymentRepository, mockRentalService);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
  });
  
  describe('getPayPalClient', () => {
    test('should return a PayPal client', () => {
      process.env.PAYPAL_CLIENT_ID = 'test_client_id';
      process.env.PAYPAL_CLIENT_SECRET = 'test_secret';
      
      const client = paymentService.getPayPalClient();
      
      expect(paypal.core.PayPalHttpClient).toHaveBeenCalled();
      expect(client).toBeDefined();
    });
    
    test('should handle missing PayPal client ID', () => {
      delete process.env.PAYPAL_CLIENT_ID;
      process.env.PAYPAL_CLIENT_SECRET = 'test_secret';
      
      const consoleSpy = jest.spyOn(console, 'log');
      
      const client = paymentService.getPayPalClient();
      
      expect(consoleSpy).toHaveBeenCalledWith('PayPal Client ID available:', false);
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ WARNING: PayPal Client ID is not configured');
      expect(client).toBeDefined();
      
      consoleSpy.mockRestore();
    });
    
    test('should handle missing PayPal client secret', () => {
      process.env.PAYPAL_CLIENT_ID = 'test_client_id';
      delete process.env.PAYPAL_CLIENT_SECRET;
      
      const consoleSpy = jest.spyOn(console, 'log');
      
      const client = paymentService.getPayPalClient();
      
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ WARNING: PayPal Client Secret is not configured');
      expect(client).toBeDefined();
      
      consoleSpy.mockRestore();
    });
    
    test('should use live environment in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.PAYPAL_CLIENT_ID = 'test_client_id';
      process.env.PAYPAL_CLIENT_SECRET = 'test_secret';
      
      paymentService.getPayPalClient();
      
      expect(paypal.core.LiveEnvironment).toHaveBeenCalled();
      expect(paypal.core.SandboxEnvironment).not.toHaveBeenCalled();
    });
  });
  
  describe('createPayment', () => {
    test('should create payment and return order data', async () => {
      const rentalId = 123;
      const returnUrl = 'http://localhost:3000/payment/success';
      const cancelUrl = 'http://localhost:3000/payment/cancel';
      
      const mockRental = {
        id: rentalId,
        totalPrice: 100,
        car: {
          brand: 'Toyota',
          model: 'Corolla'
        }
      };
      
      mockRentalService.getRentalById.mockResolvedValue(mockRental);
      mockPaymentRepository.save.mockResolvedValue({});
      
      const result = await paymentService.createPayment(rentalId, returnUrl, cancelUrl);
      
      expect(mockRentalService.getRentalById).toHaveBeenCalledWith(rentalId);
      expect(mockPaymentRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'TEST_ORDER_ID',
        status: 'COMPLETED',
        approveUrl: 'https://www.sandbox.paypal.com/approve'
      });
    });
    
    test('should throw error when rental not found', async () => {
      mockRentalService.getRentalById.mockResolvedValue(null);
      
      await expect(paymentService.createPayment(999, 'url', 'url'))
        .rejects
        .toThrow('Rental not found');
    });
    
    test('should handle PayPal errors during payment creation', async () => {
      const rentalId = 123;
      const mockRental = {
        id: rentalId,
        totalPrice: 100,
        car: {
          brand: 'Toyota',
          model: 'Corolla'
        }
      };
      
      mockRentalService.getRentalById.mockResolvedValue(mockRental);
      mockPaymentRepository.save.mockResolvedValue({});
      
      const mockError = new Error('PayPal API error');
      const mockClient = {
        execute: jest.fn().mockRejectedValue(mockError)
      };
      jest.spyOn(paymentService, 'getPayPalClient').mockReturnValue(mockClient);
      
      const consoleSpy = jest.spyOn(console, 'error');
      
      await expect(paymentService.createPayment(rentalId, 'returnUrl', 'cancelUrl'))
        .rejects
        .toThrow('PayPal API error');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Error creating PayPal payment:', 
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('capturePayment', () => {
    test('should capture payment and update rental status', async () => {
      const orderId = 'TEST_ORDER_ID';
      const rentalId = 123;
      
      mockPaymentRepository.getByRentalId.mockResolvedValue([
        new Payment(1, rentalId, 100, 'PayPal', null, paymentStatus.PENDING, new Date(), new Date())
      ]);
      
      const result = await paymentService.capturePayment(orderId, rentalId);
      
      expect(mockPaymentRepository.getByRentalId).toHaveBeenCalledWith(rentalId);
      expect(mockPaymentRepository.save).toHaveBeenCalled();
      expect(mockRentalService.updatePaymentStatus).toHaveBeenCalledWith(rentalId, true);
      expect(result).toEqual({
        transactionId: 'TEST_ORDER_ID',
        status: 'completed'
      });
    });
    
    test('should handle case when no payments found for rental', async () => {
      const orderId = 'TEST_ORDER_ID';
      const rentalId = 123;
      
      mockPaymentRepository.getByRentalId.mockResolvedValue([]);
      
      const result = await paymentService.capturePayment(orderId, rentalId);
      
      expect(mockPaymentRepository.getByRentalId).toHaveBeenCalledWith(rentalId);
      expect(mockPaymentRepository.save).not.toHaveBeenCalled();
      expect(mockRentalService.updatePaymentStatus).toHaveBeenCalledWith(rentalId, true);
      expect(result).toEqual({
        transactionId: 'TEST_ORDER_ID',
        status: 'completed'
      });
    });
    
    test('should handle PayPal errors during payment capture', async () => {
      const orderId = 'TEST_ORDER_ID';
      const rentalId = 123;
      
      const mockError = new Error('PayPal capture error');
      const mockClient = {
        execute: jest.fn().mockRejectedValue(mockError)
      };
      jest.spyOn(paymentService, 'getPayPalClient').mockReturnValue(mockClient);
      
      const consoleSpy = jest.spyOn(console, 'error');
      
      await expect(paymentService.capturePayment(orderId, rentalId))
        .rejects
        .toThrow('PayPal capture error');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Error capturing PayPal payment:', 
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('getPaymentsByRentalId', () => {
    test('should return payments by rental ID', async () => {
      const rentalId = 123;
      const mockPayments = [
        new Payment(1, rentalId, 100, 'PayPal', 'tx123', paymentStatus.COMPLETED, new Date(), new Date())
      ];
      
      mockPaymentRepository.getByRentalId.mockResolvedValue(mockPayments);
      
      const result = await paymentService.getPaymentsByRentalId(rentalId);
      
      expect(mockPaymentRepository.getByRentalId).toHaveBeenCalledWith(rentalId);
      expect(result).toBe(mockPayments);
    });
    
    test('should return empty array when no payments found', async () => {
      mockPaymentRepository.getByRentalId.mockResolvedValue([]);
      
      const result = await paymentService.getPaymentsByRentalId(999);
      
      expect(result).toEqual([]);
    });
  });
});