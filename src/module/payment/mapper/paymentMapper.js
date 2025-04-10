const Payment = require('../entity/Payment');
const { getPaymentStatusById } = require('../entity/PaymentStatus');

/**
 * @param {import('../model/paymentModel')} model
 */
exports.modelToEntity = (model) => {
  const {
    id,
    rentalId,
    amount,
    provider,
    transactionId,
    status,
    createdAt,
    updatedAt
  } = model;

  return new Payment(
    Number(id),
    Number(rentalId),
    Number(amount),
    provider,
    transactionId,
    getPaymentStatusById(status),
    createdAt,
    updatedAt
  );
};

exports.formToEntity = ({
  id,
  rentalId,
  amount,
  provider,
  transactionId,
  status,
  createdAt,
  updatedAt
}) => {
  return new Payment(
    Number(id),
    Number(rentalId),
    Number(amount),
    provider,
    transactionId,
    getPaymentStatusById(Number(status)),
    createdAt,
    updatedAt
  );
};
