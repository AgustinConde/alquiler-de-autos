const { Model, DataTypes } = require('sequelize');
const RentalModel = require('../../rental/model/rentalModel');

module.exports = class PaymentModel extends Model {
  /**
   * @param {import('sequelize').Sequelize} sequelizeInstance
   */
  static setup(sequelizeInstance) {
    PaymentModel.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        rentalId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'rentals',
            key: 'id'
          },
          field: 'rental_id'
        },
        amount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false
        },
        provider: {
          type: DataTypes.STRING,
          allowNull: false
        },
        transactionId: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'transaction_id'
        },
        status: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        }
      },
      {
        sequelize: sequelizeInstance,
        modelName: 'Payment',
        tableName: 'payments',
        timestamps: true,
        underscored: true
      }
    );

    return PaymentModel;
  }

  /**
   * @param {typeof import('../../rental/model/rentalModel')} RentalModel
   */
  static setAssociations(RentalModel) {
    RentalModel.hasMany(PaymentModel, {
      foreignKey: 'rentalId'
    });
    
    PaymentModel.belongsTo(RentalModel, {
      foreignKey: 'rentalId'
    });

    return PaymentModel;
  }
};