const { modelToEntity: rentalModelToEntityMapper } = require('../../rental/mapper/rentalMapper');
const Car = require('../entity/Car');

exports.modelToEntity = ({
    id,
    brand,
    model,
    year,
    mileage,
    colour,
    ac,
    capacity,
    transmission,
    pricePerDay,
    image,
    createdAt = null,
    updatedAt = null,
    deletedAt = null,
    rentals = [],
}) =>
  new Car(
    Number(id),
    brand,
    model,
    Number(year),
    Number(mileage),
    colour,
    ac,
    Number(capacity),
    transmission,
    Number(pricePerDay),
    image,
    createdAt,
    updatedAt,
    deletedAt,
    rentals.map(rentalModelToEntityMapper)
  );

exports.formToEntity = ({
  id,
  brand,
  model,
  year,
  mileage,
  colour,
  ac,
  capacity,
  transmission,
  pricePerDay,
  image,
  'created-at': createdAt,
}) =>
  new Car(id, brand, model, year, mileage, colour, ac, capacity, transmission, pricePerDay, image, createdAt);