const Client = require('../entity/Client');

exports.modelToEntity = ({
  id,
  name,
  surname,
  idType,
  idNumber,
  nationality,
  address,
  phone,
  email,
  birthDate,
  role,
  createdAt,
  updatedAt,
  Rentals = []
}) => {
  let formattedBirthDate = null;
  if (birthDate) {
    formattedBirthDate = new Date(birthDate);
    if (isNaN(formattedBirthDate.getTime())) {
      formattedBirthDate = null;
    }
  }

  const mappedRentals = Rentals.length > 0 
    ? Rentals.map(rental => {
        const { modelToEntity: rentalModelToEntity } = require('../../rental/mapper/rentalMapper');
        return rentalModelToEntity(rental);
      })
    : [];

  return new Client({
    id: Number(id),
    name,
    surname,
    idType,
    idNumber: Number(idNumber),
    nationality,
    address,
    phone,
    email,
    birthDate: formattedBirthDate,
    role,
    createdAt,
    updatedAt,
    deletedAt: null,
    rentals: mappedRentals
  });
};

exports.formToEntity = ({
  id,
  'name': name,
  'surname': surname,
  'id-type': idType,
  'id-number': idNumber,
  nationality,
  address,
  'phone': phone,
  email,
  birthDate,
  'created-at': createdAt,
}) =>
  new Client(
    id,
    name,
    surname,
    idType,
    idNumber,
    nationality,
    address,
    phone,
    email,
    birthDate,
    createdAt
  );
