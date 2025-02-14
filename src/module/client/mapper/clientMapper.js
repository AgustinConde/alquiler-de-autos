const { modelToEntity: rentalModelToEntity } = require('../../rental/mapper/rentalMapper');
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
  createdAt,
  updatedAt,
  Rentals = []
}) =>
  new Client(
    Number(id),
    name,
    surname,
    idType,
    Number(idNumber),
    nationality,
    address,
    phone,
    email,
    birthDate,
    createdAt,
    updatedAt,
    Rentals.map(rentalModelToEntity)
  );

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
