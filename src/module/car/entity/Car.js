module.exports = class Car {
    /**
     * @param {number} id
     * @param {string} brand
     * @param {string} model
     * @param {number} year
     * @param {number} mileage
     * @param {string} color
     * @param {string} ac
     * @param {number} capacity
     * @param {string} transmission
     * @param {number} pricePerDay
     * @param {string} image
     * @param {string} createdAt
     * @param {string} updatedAt
     * @param {string} deletedAt
     * @param {import('../../rental/entity/Rental')[]} rentals
     */
    constructor(
      id,
      brand,
      model,
      year,
      mileage,
      color,
      ac,
      capacity,
      transmission,
      pricePerDay,
      image,
      createdAt,
      updatedAt,
      deletedAt,
      rentals
    ) {
      this.id = id;
      this.brand = brand;
      this.model = model;
      this.year = year;
      this.mileage = mileage;
      this.color = color;
      this.ac = ac;
      this.capacity = capacity;
      this.transmission = transmission;
      this.pricePerDay = pricePerDay;
      this.image = image;
      this.createdAt = createdAt;
      this.updatedAt = updatedAt;
      this.deletedAt = deletedAt;
      this.rentals = rentals;
    }
  
    get fullName(){
      const brand = this.brand || '';
      const model = this.model || '';
      return `${brand} ${model}`;
    }
  };
