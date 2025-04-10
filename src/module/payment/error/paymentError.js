class PaymentNotDefinedError extends Error {
  constructor(message = 'Payment is not defined') {
    super(message);
    this.name = 'PaymentNotDefinedError';
  }
}

class PaymentIdNotDefinedError extends Error {
  constructor(message = 'Payment ID is not defined') {
    super(message);
    this.name = 'PaymentIdNotDefinedError';
  }
}

class PaymentNotFoundError extends Error {
  constructor(message = 'Payment not found') {
    super(message);
    this.name = 'PaymentNotFoundError';
  }
}

module.exports = {
  PaymentNotDefinedError,
  PaymentIdNotDefinedError,
  PaymentNotFoundError
};
