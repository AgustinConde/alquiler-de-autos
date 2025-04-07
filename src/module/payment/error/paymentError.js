class PaymentNotDefinedError extends Error {
    constructor() {
      super('Payment is not defined');
    }
  }
  
  class PaymentIdNotDefinedError extends Error {
    constructor() {
      super('Payment ID is not defined');
    }
  }
  
  class PaymentNotFoundError extends Error {
    constructor(message = 'Payment not found') {
      super(message);
    }
  }
  
  module.exports = {
    PaymentNotDefinedError,
    PaymentIdNotDefinedError,
    PaymentNotFoundError
  };