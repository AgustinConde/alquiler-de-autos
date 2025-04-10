module.exports = class Client {
  constructor({
    id,
    name,
    surname,
    idType,
    idNumber,
    nationality,
    address,
    phone,
    email,
    password,
    birthDate,
    role,
    createdAt,
    updatedAt,
    deletedAt
  }) {
    this.id = id;
    this.name = name;
    this.surname = surname;
    this.idType = idType;
    this.idNumber = idNumber;
    this.nationality = nationality;
    this.address = address;
    this.phone = phone;
    this.email = email;
    this.password = password;
    this.birthDate = birthDate;
    this.role = role;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }
};
