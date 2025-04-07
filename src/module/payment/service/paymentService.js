const paypal = require('@paypal/checkout-server-sdk');
const { paymentStatus } = require('../entity/PaymentStatus');
const Payment = require('../entity/Payment');
const { PaymentNotDefinedError } = require('../error/paymentError');

module.exports = class PaymentService {
  /**
   * @param {import('../repository/paymentRepository')} paymentRepository 
   * @param {import('../../rental/service/rentalService')} rentalService
   */
  constructor(paymentRepository, rentalService) {
    this.paymentRepository = paymentRepository;
    this.rentalService = rentalService;
  }

  /**
   * @returns {paypal.core.PayPalHttpClient}
   */
  getPayPalClient() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    
    console.log('PayPal Client ID available:', !!clientId);
    if (clientId) {
      console.log('PayPal Client ID (first 5 characters):', clientId.substring(0, 5) + '...');
    } else {
      console.log('⚠️ WARNING: PayPal Client ID is not configured');
    }
    
    if (!clientSecret) {
      console.log('⚠️ WARNING: PayPal Client Secret is not configured');
    }
    
    const environment = process.env.NODE_ENV === 'production'
      ? new paypal.core.LiveEnvironment(clientId, clientSecret)
      : new paypal.core.SandboxEnvironment(clientId, clientSecret);

    return new paypal.core.PayPalHttpClient(environment);
  }

  /**
   * @param {number} rentalId
   * @param {string} returnUrl
   * @param {string} cancelUrl
   */
  async createPayment(rentalId, returnUrl, cancelUrl) {
    try {
      const rental = await this.rentalService.getRentalById(rentalId);
      if (!rental) {
        throw new Error('Rental not found');
      }
      
      const payment = new Payment(
        null,
        rentalId,
        rental.totalPrice,
        'PayPal',
        null,
        paymentStatus.PENDING,
        null,
        null
      );
      
      await this.paymentRepository.save(payment);
      
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: `rental_${rentalId}`,
          description: `Car rental: ${rental.car.brand} ${rental.car.model}`,
          amount: {
            currency_code: 'USD',
            value: rental.totalPrice.toString()
          }
        }],
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl
        }
      });
      
      const client = this.getPayPalClient();
      const response = await client.execute(request);
      
      console.log('💰 PayPal order created:', {
        id: response.result.id,
        status: response.result.status
      });
      
      const approveUrl = response.result.links.find(link => link.rel === 'approve').href;
      
      return {
        id: response.result.id,
        status: response.result.status,
        approveUrl
      };
    } catch (error) {
      console.error('❌ Error creating PayPal payment:', error);
      throw error;
    }
  }

  /**
   * @param {string} orderId
   * @param {number} rentalId
   */
  async capturePayment(orderId, rentalId) {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({});
      
      const client = this.getPayPalClient();
      const response = await client.execute(request);
      
      console.log('💰 PayPal payment captured:', {
        id: response.result.id,
        status: response.result.status
      });
      
      const payments = await this.paymentRepository.getByRentalId(rentalId);
      if (payments.length > 0) {
        const latestPayment = payments[0];
        latestPayment.status = paymentStatus.COMPLETED;
        latestPayment.transactionId = response.result.id;
        await this.paymentRepository.save(latestPayment);
      }
      
      await this.rentalService.updatePaymentStatus(rentalId, true);
      
      return {
        transactionId: response.result.id,
        status: 'completed'
      };
    } catch (error) {
      console.error('❌ Error capturing PayPal payment:', error);
      throw error;
    }
  }

  /**
   * @param {number} rentalId
   */
  async getPaymentsByRentalId(rentalId) {
    return this.paymentRepository.getByRentalId(rentalId);
  }
};