const PaymentRepository = require('../paymentRepository');
const Payment = require('../../entity/Payment');
const { paymentStatus } = require('../../entity/PaymentStatus');
const { PaymentNotDefinedError, PaymentIdNotDefinedError, PaymentNotFoundError } = require('../../error/paymentError');
const { build } = require('sequelize/lib/model');

describe('PaymentRepository', () => {
  let paymentRepository;
  let mockPaymentModel;
  
  beforeEach(() => {
    mockPaymentModel = {
      create: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      build: jest.fn(),
    };
    
    mockPaymentModel.build.mockReturnValue({
        save: jest.fn().mockResolvedValue({}),
        id: 1,
        rentalId: 1,
        amount: 100,
        provider: 'PayPal',
        transactionId: 'txn_123456',
        status: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: () => ({
          id: 1,
          rentalId: 1,
          amount: 100,
          provider: 'PayPal',
          transactionId: 'txn_123456',
          status: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });

    paymentRepository = new PaymentRepository(mockPaymentModel);
  });
  
  describe('save', () => {
    test('should create a new payment', async () => {
      const payment = new Payment(
        null, // id
        1,    // rentalId
        100,  // amount
        'PayPal', // provider
        'txn_123456', // transactionId
        paymentStatus.PENDING, // status
        null, // createdAt
        null  // updatedAt
      );
      
      const result = await paymentRepository.save(payment);
      
      expect(mockPaymentModel.build).toHaveBeenCalledWith(expect.anything(), {
        isNewRecord: true
      });
      
      expect(result).toBeInstanceOf(Payment);
      expect(result.id).toBe(1);
    });
    
    test('should throw PaymentNotDefinedError when payment is null', async () => {
      await expect(paymentRepository.save(null)).rejects.toThrow(PaymentNotDefinedError);
      expect(mockPaymentModel.create).not.toHaveBeenCalled();
    });
    
    test('should throw PaymentNotDefinedError when payment is not a Payment instance', async () => {
      await expect(paymentRepository.save({})).rejects.toThrow(PaymentNotDefinedError);
      expect(mockPaymentModel.create).not.toHaveBeenCalled();
    });
  });
  
  describe('getById', () => {
    test('should return payment by id', async () => {
      const paymentId = 1;
      const mockPayment = {
        id: paymentId,
        rentalId: 2,
        amount: 150,
        provider: 'PayPal',
        transactionId: 'txn_123',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      
      mockPaymentModel.findByPk.mockResolvedValue(mockPayment);
      
      const result = await paymentRepository.getById(paymentId);
      
      expect(mockPaymentModel.findByPk).toHaveBeenCalledWith(paymentId);
      expect(result).toBeInstanceOf(Payment);
      expect(result.id).toBe(paymentId);
      expect(result.status).toEqual(paymentStatus.COMPLETED);
    });
    
    test('should throw PaymentIdNotDefinedError when id is null', async () => {
      await expect(paymentRepository.getById(null)).rejects.toThrow(PaymentIdNotDefinedError);
      expect(mockPaymentModel.findByPk).not.toHaveBeenCalled();
    });
    
    test('should throw PaymentNotFoundError when payment not found', async () => {
      mockPaymentModel.findByPk.mockResolvedValue(null);
      
      await expect(paymentRepository.getById(999)).rejects.toThrow(PaymentNotFoundError);
      expect(mockPaymentModel.findByPk).toHaveBeenCalledWith(999);
    });
  });
  
  describe('getByRentalId', () => {
    test('should return payments for a rental', async () => {
      const rentalId = 5;
      const mockPayments = [
        {
          id: 1,
          rentalId: rentalId,
          amount: 100,
          provider: 'PayPal',
          transactionId: 'txn_123',
          status: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
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
        }
      ];
      
      mockPaymentModel.findAll.mockResolvedValue(mockPayments);
      
      const result = await paymentRepository.getByRentalId(rentalId);
      
      expect(mockPaymentModel.findAll).toHaveBeenCalledWith({
        where: { rentalId },
        order: [['createdAt', 'DESC']]
      });
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toBeInstanceOf(Payment);
      expect(result[0].rentalId).toBe(rentalId);
    });
    
    test('should return empty array when no payments found', async () => {
      mockPaymentModel.findAll.mockResolvedValue([]);
      
      const result = await paymentRepository.getByRentalId(123);
      
      expect(mockPaymentModel.findAll).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
    
    test('should handle undefined rentalId', async () => {
        mockPaymentModel.findAll.mockResolvedValue([]);
        
        const result = await paymentRepository.getByRentalId();
        
        expect(mockPaymentModel.findAll).toHaveBeenCalledWith({
          where: { rentalId: undefined },
          order: [['createdAt', 'DESC']]
        });
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      });
  });
});
