const Rental = require('../entity/Rental');
const CarModel = require('../../car/model/carModel');
const ClientModel = require('../../client/model/clientModel');
const { Op } = require('sequelize');
const { modelToEntity } = require('../mapper/rentalMapper');
const { modelToEntity: carModelToEntity } = require('../../car/mapper/carMapper');
const { modelToEntity: clientModelToEntity } = require('../../client/mapper/clientMapper');
const { RentalNotDefinedError, RentalIdNotDefinedError, RentalNotFoundError } = require('../error/RentalError');

module.exports = class RentalRepository {
  /**
   * @param {typeof import('../model/rentalModel')} RentalModel
   */
  constructor(RentalModel) {
    this.RentalModel = RentalModel;
  }

  /**
   * @param {import('../entity/Rental')} rental
   */
  async save(rental) {
    if (!(rental instanceof Rental)) {
      throw new RentalNotDefinedError();
    }
    const rentalInfo = Object.assign({}, rental);
    rentalInfo.isPaid = rental.isPaid.value;

    const rentalInstance = this.RentalModel.build(rentalInfo, {
      isNewRecord: !rentalInfo.id,
    });
    await rentalInstance.save();
    return modelToEntity(rentalInstance, carModelToEntity, clientModelToEntity);
  }

  /**
 * @param {import('../entity/Rental')} rental
 */
async delete(rental) {
  if (!(rental instanceof Rental)) {
    throw new RentalNotDefinedError();
  }
  
  const rentalInstance = await this.RentalModel.findByPk(rental.id);
  if (!rentalInstance) {
    throw new RentalNotFoundError();
  }
  
  await rentalInstance.destroy();
  return rental;
}

  async getAllRentals() {
    const rentals = await this.RentalModel.findAll({
      include: [
        {model: CarModel, paranoid: false},
        {model: ClientModel, paranoid: false},
      ],
    });
    return rentals.map(rental => modelToEntity(rental, carModelToEntity, clientModelToEntity));
  }

  /**
   * @param {number} rentalId
   */
  async getRentalById(rentalId) {
    if (!Number(rentalId)) {
      throw new RentalIdNotDefinedError();
    }

    const CarModel = require('../../car/model/carModel');
    const ClientModel = require('../../client/model/clientModel');
    const { modelToEntity: carModelToEntity } = require('../../car/mapper/carMapper');
    const { modelToEntity: clientModelToEntity } = require('../../client/mapper/clientMapper');

    const rental = await this.RentalModel.findByPk(rentalId, {
      include: [
        {
          model: CarModel,
          paranoid: false
        },
        {
          model: ClientModel,
          paranoid: false
        }
      ]
    });

    if (!rental) {
      throw new RentalNotFoundError();
    }
    
    console.log('🔍 Database data for rental:', {
      id: rental.id,
      client: rental.Client ? {
        id: rental.Client.id,
        name: rental.Client.name
      } : 'No client data'
    });

    return modelToEntity(rental, carModelToEntity, clientModelToEntity);
  }

  async getRentalsByStatus(...paymentProgress) {
    const rentals = await this.RentalModel.findAll({
      include: [
        {model: CarModel, paranoid: false},
        {model: ClientModel, paranoid: false},
      ],
      where: {
        paymentProgress: {
          [Op.or]: paymentProgress
        }
      }
    });

    return rentals.map((rental) => modelToEntity(rental, carModelToEntity, clientModelToEntity));
  }



  /**
 * @param {number} carId
 */
async getRentalsByCarId(carId) {
  if (!Number(carId)) {
    throw new Error('Invalid car ID');
  }
  
  const rentals = await this.RentalModel.findAll({
    where: {
      rentedCar: carId,
      deletedAt: null
    },
    include: [
      {model: CarModel, paranoid: false},
      {model: ClientModel, paranoid: false}
    ]
  });
  
  return rentals.map(rental => 
    modelToEntity(rental, carModelToEntity, clientModelToEntity)
  );
}

/**
 * @param {number} clientId
 */
async getRentalsByClientId(clientId) {
  if (!Number(clientId)) {
    throw new Error('Invalid client ID');
  }
  
  const CarModel = require('../../car/model/carModel');
  const ClientModel = require('../../client/model/clientModel');
  const { modelToEntity: carModelToEntity } = require('../../car/mapper/carMapper');
  const { modelToEntity: clientModelToEntity } = require('../../client/mapper/clientMapper');
  
  const rentals = await this.RentalModel.findAll({
    where: {
      rentedTo: clientId,
      deletedAt: null
    },
    include: [
      {model: CarModel, paranoid: false},
      {model: ClientModel, paranoid: false}
    ],
    order: [['rentalStart', 'DESC']]
  });
  
  return rentals.map(rental => 
    modelToEntity(rental, carModelToEntity, clientModelToEntity)
  );
}

/**
 * @param {Object} rentalData
 */
async createFromBackup(rentalData) {
  try {
    const requiredFields = ['rentedCar', 'rentedTo', 'rentalStart', 'rentalEnd'];
    for (const field of requiredFields) {
      if (!rentalData[field]) {
        throw new Error(`Missing required field for rental: ${field}`);
      }
    }

    const rental = await this.RentalModel.create({
      rentedCar: rentalData.rentedCar,
      rentedTo: rentalData.rentedTo,
      pricePerDay: rentalData.pricePerDay || 0,
      rentalStart: rentalData.rentalStart,
      rentalEnd: rentalData.rentalEnd,
      totalPrice: rentalData.totalPrice || 0,
      paymentMethod: rentalData.paymentMethod || 'Card',
      paymentProgress: rentalData.paymentProgress || 0,
    });

    console.log(`✓ Alquiler restaurado con ID: ${rental.id}`);
    
    const CarModel = require('../../car/model/carModel');
    const ClientModel = require('../../client/model/clientModel');
    const { modelToEntity: carModelToEntity } = require('../../car/mapper/carMapper');
    const { modelToEntity: clientModelToEntity } = require('../../client/mapper/clientMapper');
    
    const completeRental = await this.RentalModel.findByPk(rental.id, {
      include: [
        { model: CarModel, paranoid: false },
        { model: ClientModel, paranoid: false }
      ]
    });
    
    return modelToEntity(completeRental, carModelToEntity, clientModelToEntity);
  } catch (error) {
    console.error('❌ Error al restaurar alquiler:', error);
    throw new Error(`Failed to restore rental: ${error.message}`);
  }
}
};
