const { isPaid } = require('./RentalIsPaid');

module.exports = class Rental {
  /**
   * @param {number} id
   * @param {number} rentedCar
   * @param {number} rentedTo
   * @param {number} pricePerDay
   * @param {string} rentalStart
   * @param {string} rentalEnd
   * @param {number} totalPrice
   * @param {string} paymentMethod
   * @param {import('./RentalIsPaid').RentalIsPaid} isPaid
   * @param {string} createdAt
   * @param {string} updatedAt
   * @param {string} deletedAt
   * @param {import('../../car/entity/Car')} car
   * @param {import('../../client/entity/Client')} client
   */
  constructor(
    id,
    carId,
    clientId,
    pricePerDay,
    startDate,
    endDate,
    totalPrice,
    paymentMethod,
    paymentProgress,
    createdAt,
    updatedAt,
    car,
    client
  ) {
    this.id = id;
    this.rentedCar = carId;
    this.rentedTo = clientId;
    this.pricePerDay = pricePerDay;
    this.rentalStart = new Date(startDate);
    this.rentalEnd = new Date(endDate);
    this.formattedDates = this.formatDate();
    this.totalPrice = totalPrice;
    this.paymentMethod = paymentMethod;
    this.paymentProgress = paymentProgress;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = null;
    this.car = car;
    this.client = client;
  }

  formatDate() {
    const [startDate, endDate] = [this.startDate, this.endDate].map((date) =>
      new Date(date).toLocaleString(false, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })
    );
    return { startDate, endDate };
  }

  rentalLength() {
    const MILISECONDS_IN_A_DAY = 86400000;
    const finishDate = new Date(this.finishDate).getTime();
    const startDate = new Date(this.startDate).getTime();
    return Math.ceil((finishDate - startDate) / MILISECONDS_IN_A_DAY);
  }

  /**
   * @param {import('../../car/entity/Car')} car
   */
  reserve(car) {
    this.pricePerDay = this.pricePerDay || car.pricePerDay;
    this.totalPrice = this.pricePerDay * this.rentalLength();
    return this;
  }

  pay() {
    this.paymentProgress = isPaid.PAID;
    return this;
  }

  unblock() {
    this.paymentProgress = isPaid.PENDING;
  }

  get isPaid(){
    return this.paymentProgress.value === isPaid.PAID.value;
  }

  get status() {
    if (!this.paymentProgress) return 'pending';
    
    if (this.paymentProgress.value === isPaid.PAID.value) {
      return 'completed';
    } else if (this.paymentProgress.value === isPaid.PENDING.value) {
      return 'pending';
    }
    
    return 'pending';
  }

  get startDate() {
    return this.rentalStart;
  }

  get endDate() {
    return this.rentalEnd;
  }
};
