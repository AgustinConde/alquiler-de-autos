module.exports = class Payment {
    /**
     * @param {number} id
     * @param {number} rentalId
     * @param {number} amount
     * @param {string} provider
     * @param {string} transactionId
     * @param {import('./PaymentStatus').PaymentStatus} status
     * @param {string} createdAt
     * @param {string} updatedAt
     */
    constructor(
      id,
      rentalId,
      amount,
      provider,
      transactionId,
      status,
      createdAt,
      updatedAt
    ) {
      this.id = id;
      this.rentalId = rentalId;
      this.amount = amount;
      this.provider = provider;
      this.transactionId = transactionId;
      this.status = status;
      this.createdAt = createdAt;
      this.updatedAt = updatedAt;
    }
  };