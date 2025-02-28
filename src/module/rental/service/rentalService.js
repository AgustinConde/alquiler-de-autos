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
   * @param {Request} req
   * @param {Response} res
   */
  async createRental(req, res) {
    try {
      if (!req.session.user?.id) {
        return res.status(401).json({ error: "You must be logged in to rent a car." });
      }

      const { carId, rentalStart, rentalEnd, paymentMethod } = req.body;
      if (!carId || !rentalStart || !rentalEnd || !paymentMethod) {
        return res.status(400).json({ error: "Missing rental information." });
      }

      const car = await this.CarRepository.getCarById(carId);
      if (!car) {
        return res.status(404).json({ error: "Car not found." });
      }

      const rental = new Rental({
        rentedCar: car.id,
        rentedTo: req.session.user.id,
        rentalStart,
        rentalEnd,
        paymentMethod,
        pricePerDay: car.pricePerDay,
        totalPrice: car.pricePerDay * ((new Date(rentalEnd) - new Date(rentalStart)) / (1000 * 60 * 60 * 24)),
        isPaid: false
      });

      await this.RentalRepository.save(rental);

      return res.redirect("/account/rents");

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
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

    return this.RentalRepository.getRentalById(rentalId);
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
      rentalData.rentedCar,
      rentalData.rentedTo,
      rentalData.pricePerDay,
      rentalData.rentalStart,
      rentalData.rentalEnd,
      rentalData.totalPrice,
      rentalData.paymentMethod,
      isPaid.PENDING,
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
};
