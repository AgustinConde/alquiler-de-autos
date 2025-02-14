module.exports = class Client {
    /**
     * @param {number} id
     * @param {string} name
     * @param {string} surname
     * @param {string} idType
     * @param {number} idNumber
     * @param {string} nationality
     * @param {string} address
     * @param {string} phone
     * @param {string} email
     * @param {string} birthDate
     * @param {string} createdAt
     * @param {string} updatedAt
     * @param {import('../../rental/entity/Rental')[]} rentals
     */
    constructor(
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
      rentals
    ) {
      this.id = id;
      this.name = name;
      this.surname = surname;
      this.idType = idType;
      this.idNumber = idNumber;
      this.nationality = nationality;
      this.address = address;
      this.phone = phone;
      this.email = email;
      this.birthDate = birthDate;
      this.formattedBirthDate = this.formatBirthdate();
      this.createdAt = createdAt;
      this.updatedAt = updatedAt;
      this.rentals = rentals;
    }
  
    formatBirthdate() {
      return new Date(this.birthDate).toLocaleString(false, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        timeZone: 'UTC',
      });
    }
  
    get fullName(){
      return `${this.name} ${this.surname}`;
    }
  };
