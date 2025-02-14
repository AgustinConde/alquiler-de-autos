const BackupModel = require("../model/backupModel");
const RentalModel = require("../model/rentalModel");

module.exports = class BackupRepository {
  async backupByCarId(carId) {
    try {
      const rentals = await RentalModel.findAll({ where: { rentedCar: carId } });

      if (rentals.length === 0) return;

      await BackupModel.bulkCreate(rentals.map(r => r.toJSON()));

      console.log(`Backup successfully made for ${rentals.length} rentals of carId: ${carId}`);
    } catch (error) {
      console.error("Error making rental backup:", error);
    }
  }

  async backupByClientId(clientId) {
    try {
      const rentals = await RentalModel.findAll({ where: { rentedTo: clientId } });

      if (rentals.length === 0) return;

      await BackupModel.bulkCreate(rentals.map(r => r.toJSON()));

      console.log(`Backup successfully made for ${rentals.length} rentals of clientId: ${clientId}`);
    } catch (error) {
      console.error("Error making rental backup:", error);
    }
  }
};
