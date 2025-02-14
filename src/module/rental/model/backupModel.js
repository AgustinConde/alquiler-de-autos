const { DataTypes, Model } = require("sequelize");

module.exports = class BackupModel extends Model {
  /**
   * @param {import('sequelize').Sequelize} sequelizeInstance
   */
  static setup(sequelizeInstance) {
    BackupModel.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
          unique: true,
        },
        rentedCar: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        rentedTo: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        pricePerDay: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        rentalStart: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        rentalEnd: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        totalPrice: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        paymentMethod: {
          type: DataTypes.STRING,
          allowNull: false,
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
        modelName: "Backup",
        tableName: "backups",
        underscored: true,
        timestamps: true,
      }
    );

    return BackupModel;
  }
}
