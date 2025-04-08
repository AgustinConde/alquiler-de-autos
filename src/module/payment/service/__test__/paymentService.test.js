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
  
  beforeEach(() => {
    mockPaymentRepository = {
      save: jest.fn(),
      getById: jest.fn(),
      getByRentalId: jest.fn()
    };
    
    mockRentalService = {
      getRentalById: jest.fn(),
      updatePaymentStatus: jest.fn()
    };
    
    paymentService = new PaymentService(mockPaymentRepository, mockRentalService);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getPayPalClient', () => {
    test('should return a PayPal client', () => {
      process.env.PAYPAL_CLIENT_ID = 'test_client_id';
      process.env.PAYPAL_CLIENT_SECRET = 'test_secret';
      
      const client = paymentService.getPayPalClient();
      
      expect(paypal.core.PayPalHttpClient).toHaveBeenCalled();
      expect(client).toBeDefined();
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
  });
});