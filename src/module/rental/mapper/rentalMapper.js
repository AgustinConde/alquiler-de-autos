const Rental = require("../entity/Rental");
const clientMapper = require('../../client/mapper/clientMapper');
const { isPaid } = require('../entity/RentalIsPaid');

function determinePaymentStatus(statusValue) {
  if (statusValue === true || statusValue === 1 || statusValue === 'completed') {
    return isPaid.PAID;
  }
  return isPaid.PENDING; 
}

exports.modelToEntity = (
  model,
  carModelToEntityMapper,
) => {
  const {
    id,
    rentedCar,
    rentedTo,
    pricePerDay,
    rentalStart,
    rentalEnd,
    totalPrice,
    paymentMethod,
    paymentProgress,
    isPaid,
    createdAt,
    updatedAt,
    Car,
    Client
  } = model;

  console.log('📊 Mapping rental model to entity:', {
    id,
    hasClient: !!Client,
    clientData: Client ? {
      id: Client.id,
      name: Client.name,
      email: Client.email
    } : null
  });

  console.log('🔍 DEBUG - Raw model data:', JSON.stringify({
    id, 
    paymentProgress, 
    isPaid, 
    objectKeys: Object.keys(model.dataValues || model)
  }));
  
  let paymentValue = null;
  
  const rawIsPaid = model.isPaid;
  
  let paymentStatus;
  if (rawIsPaid === true || rawIsPaid === 1) {
    paymentStatus = require('../entity/RentalIsPaid').isPaid.PAID;
  } else {
    paymentStatus = require('../entity/RentalIsPaid').isPaid.PENDING;
  }
  
  console.log('💲 Payment status detection:', {
    foundRawValue: paymentValue,
    mapped: paymentStatus.name,
    value: paymentStatus.value
  });

  return new Rental(
    Number(id),
    Number(rentedCar),
    Number(rentedTo),
    Number(pricePerDay),
    rentalStart,
    rentalEnd,
    Number(totalPrice),
    paymentMethod,
    paymentStatus,
    createdAt,
    updatedAt,
    Car ? carModelToEntityMapper(Car) : {},
    Client ? clientMapper.modelToEntity(Client) : {}
  );
};

exports.formToEntity = ({
  id,
  'rented-car': rentedCar,
  'rented-to': rentedTo,
  'price-per-day': pricePerDay,
  'rental-start': rentalStart,
  'rental-end': rentalEnd,
  'total-price': totalPrice,
  'payment-method': paymentMethod,
  'is-paid': isPaidValue,
  'payment-status': paymentStatus,
  'created-at': createdAt,
}) => {
  const startDate = rentalStart ? new Date(rentalStart) : undefined;
  const endDate = rentalEnd ? new Date(rentalEnd) : undefined;
  
  const finalPaymentStatus = determinePaymentStatus(paymentStatus || isPaidValue);

  const finalPricePerDay = pricePerDay !== undefined ? Number(pricePerDay) : undefined;
  const finalTotalPrice = totalPrice !== undefined ? Number(totalPrice) : undefined;

  return new Rental(
    id,
    rentedCar !== undefined ? Number(rentedCar) : undefined,
    rentedTo !== undefined ? Number(rentedTo) : undefined,
    finalPricePerDay,
    startDate,
    endDate,
    finalTotalPrice,
    paymentMethod,
    finalPaymentStatus,
    createdAt
  );
};
