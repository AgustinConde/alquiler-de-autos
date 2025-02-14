const RentalModel = require("../../rental/model/rentalModel");
const { RentalNotDefinedError, RentalIdNotDefinedError, RentalNotFoundError } = require('../error/RentalError');



module.exports = class RentalService {
  /**
   * @param {import('../repository/RentalRepository')} RentalRepository
   * @param {import('../../car/repository/CarRepository')} CarRepository
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

  async getAllRentals() {
    return this.RentalRepository.getAll();
  }

  /**
   * 
   * @param  {...import('../entity/RentalIsPaid').RentalIsPaid} isPaid
   */
  async getByPaymentProgress(...isPaid){
    return this.RentalRepository.getByPaymentProgress(isPaid.map(r => r.value));
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
