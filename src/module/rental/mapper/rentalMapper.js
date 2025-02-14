const Rental = require('../entity/Rental');
const { RentalIsPaid, isPaid } = require('../entity/RentalIsPaid');

/**
 * 
 * @param {Number} progress
 * @returns {RentalIsPaid}
 */
function getRentalProgressById(progressId) {
  /**
   * @type {RentalIsPaid[]}
   */
  const progressList = Object.values(isPaid);
  return progressList.find(isPaid => isPaid.value == progressId);
}

exports.modelToEntity = ({
id,
rentedCar,
rentedTo,
pricePerDay,
rentalStart,
rentalEnd,
totalPrice,
paymentMethod,
paymentProgress,
createdAt,
updatedAt,
Car,
Client
}, carModelToEntityMapper, clientModelToEntityMapper) =>
  new Rental(
    id,
    rentedCar,
    rentedTo,
    pricePerDay,
    rentalStart,
    rentalEnd,
    totalPrice,
    paymentMethod,
    getRentalProgressById(paymentProgress),
    createdAt,
    updatedAt,
    Car ? carModelToEntityMapper(Car) : {},
    Client ? clientModelToEntityMapper(User) : {}
  );

exports.fromFormToEntity = ({
  id,
  'rented-car': rentedCar,
  'rented-to': rentedTo,
  'price-per-day': pricePerDay,
  'rental-start': rentalStart,
  'rental-end': rentalEnd,
  'total-price': totalPrice,
  'payment-method': paymentMethod,
  'is-paid': isPaid,
  'created-at': createdAt,
}) =>
  new Rental(
    id,
    Number(rentedCar),
    Number(rentedTo),
    pricePerDay,
    rentalStart,
    rentalEnd,
    totalPrice,
    paymentMethod,
    isPaid,
    createdAt
  );