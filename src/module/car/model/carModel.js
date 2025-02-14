const { DataTypes, Model } = require('sequelize');

module.exports = class CarModel extends Model {
  /**
   * @param {import('sequelize').Sequelize} sequelizeInstance
   */
  static setup(sequelizeInstance) {
    CarModel.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          unique: true,
        },
        brand: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        model: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        year: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 1900,
            max: new Date().getFullYear(),
          },
        },
        mileage: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 0,
          },
        },
        colour: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        ac: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        capacity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 1,
          },
        },
        transmission: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isIn: {
              args: [["Manual", "Automatic"]],
              msg: "Transmisión must be 'Manual' or 'Automatic'.",
            },
          },
        },    
        pricePerDay: {
          type: DataTypes.FLOAT,
          allowNull: false,
          validate: {
            min: 0,
          },
        },
        image: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
              min: 1,
            },
        }
      },
      {
        sequelize: sequelizeInstance,
        modelName: 'Car',
        tableName: 'cars',
        underscored: true,
        paranoid: true
      }
    );

    return CarModel;
  }
}
