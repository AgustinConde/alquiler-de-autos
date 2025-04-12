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
    this.rentalStart = startDate instanceof Date ? 
    startDate : 
    new Date(typeof startDate === 'string' && !startDate.includes('T') ? 
      `${startDate}T12:00:00` : startDate);
    this.rentalEnd = endDate instanceof Date ? 
      endDate : 
      new Date(typeof endDate === 'string' && !endDate.includes('T') ? 
        `${endDate}T12:00:00` : endDate);
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
    const formatSingleDate = (date) => {
      if (!date) return '';
      try {
        return new Date(date).toLocaleString(false, {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric'
        });
      } catch (e) {
        console.error('Error formatting date:', e);
        return '';
      }
    };
  
    return {
      startDate: formatSingleDate(this.rentalStart),
      endDate: formatSingleDate(this.rentalEnd)
    };
  }

  rentalLength() {
    const MILISECONDS_IN_A_DAY = 86400000;
    const endDate = new Date(this.rentalEnd).getTime();
    const startDate = new Date(this.rentalStart).getTime();
    const daysDiff = Math.ceil((endDate - startDate) / MILISECONDS_IN_A_DAY);
    
    return daysDiff === 0 ? 1 : daysDiff;
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
    if (!this.paymentProgress) return 'Pending';
    
    if (this.paymentProgress.value === isPaid.PAID.value) {
      return 'Completed';
    } else if (this.paymentProgress.value === isPaid.PENDING.value) {
      return 'Pending';
    }
    
    return 'Pending';
  }

  get startDate() {
    return this.rentalStart;
  }

  get endDate() {
    return this.rentalEnd;
  }
};
