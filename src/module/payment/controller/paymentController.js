module.exports = class PaymentController {
    /**
     * @param {import('../service/paymentService')} paymentService
     */
    constructor(paymentService) {
      this.paymentService = paymentService;
      this.ROUTE_BASE = '/payment';
    }
  
    /**
     * @param {import('express').Application} app
     */
    configureRoutes(app) {
      const ROUTE = this.ROUTE_BASE;
      app.get(`${ROUTE}/initiate/:rentalId`, this.initiatePayment.bind(this));
      app.get(`${ROUTE}/success`, this.processSuccess.bind(this));
      app.get(`${ROUTE}/cancel`, this.processCancel.bind(this));
    }
    
    /**
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async initiatePayment(req, res) {
      try {
        const rentalId = req.params.rentalId;
        
        const baseUrl = process.env.BASE_URL || `http://${req.get('host')}`;
        const returnUrl = `${baseUrl}${this.ROUTE_BASE}/success?rentalId=${rentalId}`;
        const cancelUrl = `${baseUrl}${this.ROUTE_BASE}/cancel?rentalId=${rentalId}`;
        
        console.log('💰 Creating payment for rental:', rentalId);
        const order = await this.paymentService.createPayment(rentalId, returnUrl, cancelUrl);
        
        res.redirect(order.approveUrl);
      } catch (error) {
        console.error('❌ Payment initiation error:', error);
        req.flash('error', 'Could not process payment. Please try again.');
        res.redirect('/profile/rentals');
      }
    }
    
    /**
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async processSuccess(req, res) {
      try {
        const { rentalId } = req.query;
        const { token } = req.query;
        
        if (!token || !rentalId) {
          throw new Error('Missing required parameters');
        }
        
        console.log('💰 Processing successful payment:', { token, rentalId });
        await this.paymentService.capturePayment(token, rentalId);
        
        req.flash('success', 'Payment successful! Your rental is now confirmed.');
        res.redirect('/profile/rentals');
      } catch (error) {
        console.error('❌ Payment processing error:', error);
        req.flash('error', 'Payment verification failed. Please contact support.');
        res.redirect('/profile/rentals');
      }
    }
    
    /**
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async processCancel(req, res) {
      const { rentalId } = req.query;
      console.log('💰 Payment cancelled for rental:', rentalId);
      req.flash('info', 'Payment was cancelled.');
      res.redirect('/profile/rentals');
    }
  };