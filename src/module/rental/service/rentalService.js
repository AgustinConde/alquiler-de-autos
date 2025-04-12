const { RentalNotDefinedError, RentalIdNotDefinedError, RentalNotFoundError } = require('../error/RentalError');
const Rental = require('../entity/Rental');
const { isPaid } = require('../entity/RentalIsPaid');

module.exports = class RentalService {
  /**
   * @param {import('../repository/rentalRepository')} RentalRepository
   * @param {import('../../car/repository/carRepository')} CarRepository
   */
  constructor(RentalRepository, CarRepository) {
    this.RentalRepository = RentalRepository;
    this.CarRepository = CarRepository;
  }

  /**
   * @param {import('../entity/Reservation')} reservation
   */
  async pay(rental) {
    if (!(rental instanceof Rental)) {
      throw new RentalNotDefinedError();
    }

    rental.pay();
    return this.RentalRepository.save(rental);
  }

  async getAll() {
    return this.RentalRepository.getAllRentals();
  }

  /**
   * 
   * @param  {...import('../entity/RentalIsPaid').RentalIsPaid} isPaid
   */
  async getByPaymentProgress(...isPaid){
    return this.RentalRepository.getRentalsByStatus(isPaid.map(r => r.value));
  }

  /**
   * @param {Number} rentalId
   */
  async getRentalById(rentalId) {
    if (!Number(rentalId)) {
      throw new RentalIdNotDefinedError();
    }

    const rental = await this.RentalRepository.getRentalById(rentalId);
    if (!rental) {
      throw new RentalNotFoundError(`Rental with ID ${rentalId} not found`);
    }
    
    return rental;
  }

  /**
 * @param {Object} rentalData
 * @returns {Promise<Rental>}
 */
async saveRental(rentalData) {
  try {
    await this.checkCarAvailability(
      rentalData.rentedCar, 
      rentalData.rentalStart, 
      rentalData.rentalEnd
    );
    
    const rental = new Rental(
      null,
      rentalData.rentedCar,
      rentalData.rentedTo,
      rentalData.pricePerDay,
      rentalData.rentalStart,
      rentalData.rentalEnd,
      rentalData.totalPrice,
      rentalData.paymentMethod,
      rentalData.paymentProgress || isPaid.PENDING,
      null,
      null,
      {}, 
      {}  
    );
    
    return this.RentalRepository.save(rental);
  } catch (error) {
    throw new Error(`Failed to create rental: ${error.message}`);
  }
}

/**
 * @param {number} carId 
 * @param {string} startDate
 * @param {string} endDate
 */
async checkCarAvailability(carId, startDate, endDate) {
  const rentals = await this.RentalRepository.getRentalsByCarId(carId);
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const conflictingRental = rentals.find(rental => {
    const rentalStart = new Date(rental.rentalStart);
    const rentalEnd = new Date(rental.rentalEnd);
    
    return (
      (start >= rentalStart && start <= rentalEnd) || 
      (end >= rentalStart && end <= rentalEnd) ||     
      (start <= rentalStart && end >= rentalEnd)
    );
  });
  
  if (conflictingRental) {
    throw new Error('This car is not available for the selected dates');
  }
  
  return true;
}

  async cancelRental(rentalId, clientId) {
    if (!Number(rentalId)) {
      throw new RentalIdNotDefinedError();
    }
  
    try {
      const rental = await this.RentalRepository.getRentalById(rentalId);
  
      if (!rental || rental.rentedTo !== clientId) {
        throw new RentalNotFoundError("Unauthorized.");
      }
  
      const now = new Date();
      const rentalStartDate = new Date(rental.rentalStart);
      const hoursDiff = (rentalStartDate - now) / (1000 * 60 * 60);
  
      if (hoursDiff < 24) {
        throw new Error("Cannot cancel a rental with less than 24 hours of anticipation.");
      }
  
      await this.RentalRepository.delete(rental);
      return { success: true, message: "Rental cancelled successfully." };
  
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * @param {number} rentalId
   */
  async delete(rentalId) {
    if (!Number(rentalId)) {
      throw new RentalIdNotDefinedError();
    }
    
    const rental = await this.RentalRepository.getRentalById(rentalId);
    if (!rental) {
      throw new RentalNotFoundError();
    }
    
    return this.RentalRepository.delete(rental);
  }

  /**
   * @param {number} id
   * @param {object} rentalData
   * @returns {Promise<Rental>}
   */
  async update(id, rentalData) {
    if (!Number(id)) {
      throw new RentalIdNotDefinedError();
    }
    
    const existingRental = await this.getRentalById(id);

    const startDate = rentalData.startDate || existingRental.rentalStart;
    const endDate = rentalData.endDate || existingRental.rentalEnd;

    console.log('💰 Payment status from form:', rentalData.paymentStatus);

    let paymentProgress = existingRental.paymentProgress;
    if (rentalData.paymentStatus === 'completed') {
      paymentProgress = {...isPaid.PAID};
    } else if (rentalData.paymentStatus === 'pending') {
      paymentProgress = {...isPaid.PENDING};
    }

    console.log('💰 Updated payment progress:', JSON.stringify(paymentProgress));
    
    const updatedRental = new Rental(
      existingRental.id,
      existingRental.rentedCar,
      existingRental.rentedTo,                 
      existingRental.pricePerDay,
      startDate,
      endDate,
      rentalData.totalPrice || existingRental.totalPrice,
      existingRental.paymentMethod,
      paymentProgress,
      existingRental.createdAt,
      new Date(),
      existingRental.car,
      existingRental.client
    );
    
    return this.RentalRepository.save(updatedRental);
  }

  /**
 * @param {number} rentalId
 * @param {boolean} isPaidStatus
 * @returns {Promise<Rental>}
 */
async updatePaymentStatus(rentalId, isPaidStatus) {
  console.log('📝 Updating rental payment status:', { rentalId, isPaidStatus });
  
  return this.update(rentalId, {
    paymentStatus: isPaidStatus ? 'completed' : 'pending'
  });
}

  /**
   * @param {number} clientId
   */
  async getRentalsByClientId(clientId) {
    if (!Number(clientId)) {
      throw new Error('Client ID is not valid');
    }
    
    return this.RentalRepository.getRentalsByClientId(clientId);
  }
};
