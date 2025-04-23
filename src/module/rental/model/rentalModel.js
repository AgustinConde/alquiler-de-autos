const { DataTypes, Model } = require("sequelize");
const CarModel = require("../../car/model/carModel");
const ClientModel = require("../../client/model/clientModel");

module.exports = class RentalModel extends Model {
  /**
   * @param {import('sequelize').Sequelize} sequelizeInstance
   */
  static setup(sequelizeInstance) {
    RentalModel.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          unique: true,
        },
        rentedCar: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: CarModel,
            key: 'id',
          },
        },
        rentedTo: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: ClientModel,
            key: 'id',
          },
        },
        pricePerDay: {
          type: DataTypes.FLOAT,
          allowNull: false,
          validate: {
            min: 0,
          },
        },
        rentalStart: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          validate: {
            isDate: true,
          },
        },
        rentalEnd: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          validate: {
            isDate: true,
            isAfterStart(value) {
              const rentalStart = this.getDataValue("rentalStart");
              if (rentalStart && new Date(value) <= new Date(rentalStart)) {
                throw new Error("Rental end must be after rental start.");
              }
            },
          },
        },
        totalPrice: {
          type: DataTypes.FLOAT,
          allowNull: false,
          validate: {
            min: 0,
          },
        },
        paymentMethod: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isIn: [["Card", "Cash"]],
          },
        },
        isPaid: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        deletedAt: {
          type: DataTypes.DATE,
        },
      },
      {
        sequelize: sequelizeInstance,
        modelName: "Rental",
        tableName: "rentals",
        underscored: true,
        paranoid: true,
        timestamps: true,
      }
    );

    return RentalModel;
  }

  /**
   * @param {typeof import('../../car/model/carModel')} CarModel
   * @param {typeof import('../../client/model/clientModel')} ClientModel
   */
  static setAssociations(CarModel, ClientModel) {
    CarModel.hasMany(RentalModel, {
      foreignKey: "rentedCar",
      onDelete: "CASCADE",
    });
    RentalModel.belongsTo(CarModel, {
      foreignKey: "rentedCar",
    });

    ClientModel.hasMany(RentalModel, {
      foreignKey: "rentedTo",
      onDelete: "CASCADE",
    });
    RentalModel.belongsTo(ClientModel, {
      foreignKey: "rentedTo",
    });

    return RentalModel;
  }
}
