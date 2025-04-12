const request = require('supertest');
const express = require('express');
const { PaymentController } = require('../../../payment/paymentModule');

const mockPaymentService = {
  createPayment: jest.fn(),
  capturePayment: jest.fn()
};

jest.mock('../../../auth/middleware/authMiddleware', () => ({
  isAuthenticated: (req, res, next) => next(),
  isAdmin: (req, res, next) => next(),
}));

describe('PaymentController (Integration)', () => {
  let app;
  let paymentController;
  
  beforeEach(() => {
    app = express();
    
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    app.use((req, res, next) => {
      req.session = {
        clientId: 1,
        auth: { id: 1, username: 'test@example.com' },
        csrfToken: 'test-csrf-token'
      };
      req.flash = jest.fn();
      next();
    });
    
    app.use((req, res, next) => {
      const originalRedirect = res.redirect;
      res.redirect = function(url) {
        res.statusCode = 302;
        res.set('Location', url);
        res.end();
        return this;
      };
      next();
    });
    
    paymentController = new PaymentController(mockPaymentService);
    paymentController.configureRoutes(app);
    
    jest.clearAllMocks();
  });
  
  describe('GET /payment/initiate/:rentalId', () => {
    test('should initiate payment and redirect to PayPal', async () => {
      mockPaymentService.createPayment.mockResolvedValue({
        id: 'TEST_ORDER_ID',
        status: 'CREATED',
        approveUrl: 'https://www.sandbox.paypal.com/approve'
      });
      
      const response = await request(app).get('/payment/initiate/123');
      
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('https://www.sandbox.paypal.com/approve');
      expect(mockPaymentService.createPayment).toHaveBeenCalledWith(
        '123',
        expect.stringContaining('/payment/success'), 
        expect.stringContaining('/payment/cancel')
      );
    });
    
    test('should handle errors and redirect to rentals page', async () => {
      mockPaymentService.createPayment.mockRejectedValue(new Error('Payment creation failed'));
      
      const response = await request(app).get('/payment/initiate/123');
      
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/profile/rentals');
    });
  });
  
  describe('GET /payment/success', () => {
    test('should capture payment and redirect to rentals', async () => {
      mockPaymentService.capturePayment.mockResolvedValue({
        transactionId: 'TEST_ORDER_ID',
        status: 'completed'
      });
      
      const response = await request(app).get('/payment/success?rentalId=123&token=TEST_TOKEN');
      
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/profile/rentals');
      expect(mockPaymentService.capturePayment).toHaveBeenCalledWith('TEST_TOKEN', '123');
    });
    
    test('should handle missing parameters', async () => {
      const response = await request(app).get('/payment/success');
      
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/profile/rentals');
      expect(mockPaymentService.capturePayment).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /payment/cancel', () => {
    test('should handle cancelled payment and redirect to rentals', async () => {
      const response = await request(app).get('/payment/cancel?rentalId=123');
      
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/profile/rentals');
    });
  });
});