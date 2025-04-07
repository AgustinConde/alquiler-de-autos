const PaymentStatus = {
    PENDING: { name: 'Pending', value: 0 },
    COMPLETED: { name: 'Completed', value: 1 },
    FAILED: { name: 'Failed', value: 2 },
    REFUNDED: { name: 'Refunded', value: 3 }
  };
  
  module.exports = {
    paymentStatus: PaymentStatus,
  
    /**
     * @param {number} statusId
     */
    getPaymentStatusById(statusId) {
      switch (statusId) {
        case PaymentStatus.COMPLETED.value:
          return PaymentStatus.COMPLETED;
        case PaymentStatus.FAILED.value:
          return PaymentStatus.FAILED;
        case PaymentStatus.REFUNDED.value:
          return PaymentStatus.REFUNDED;
        default:
          return PaymentStatus.PENDING;
      }
    }
  };