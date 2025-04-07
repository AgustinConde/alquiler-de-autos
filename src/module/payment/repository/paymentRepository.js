const { modelToEntity } = require('../mapper/paymentMapper');
const Payment = require('../entity/Payment');
const { PaymentNotDefinedError, PaymentIdNotDefinedError, PaymentNotFoundError } = require('../error/paymentError');

module.exports = class PaymentRepository {
  /**
   * @param {typeof import('../model/paymentModel')} PaymentModel
   */
  constructor(PaymentModel) {
    this.PaymentModel = PaymentModel;
  }

  /**
   * @param {Payment} payment
   */
  async save(payment) {
    if (!(payment instanceof Payment)) {
      throw new PaymentNotDefinedError();
    }

    const paymentInstance = await this.PaymentModel.build(payment, {
      isNewRecord: !payment.id
    });
    
    await paymentInstance.save();
    return modelToEntity(paymentInstance);
  }

  /**
   * @param {number} paymentId
   */
  async getById(paymentId) {
    if (!Number(paymentId)) {
      throw new PaymentIdNotDefinedError();
    }

    const paymentInstance = await this.PaymentModel.findByPk(paymentId);
    if (!paymentInstance) {
      throw new PaymentNotFoundError(`Payment with ID ${paymentId} not found.`);
    }

    return modelToEntity(paymentInstance);
  }

  /**
   * @param {number} rentalId
   */
  async getByRentalId(rentalId) {
    const payments = await this.PaymentModel.findAll({
      where: { rentalId },
      order: [['createdAt', 'DESC']]
    });

    return payments.map(payment => modelToEntity(payment));
  }
};