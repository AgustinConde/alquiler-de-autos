const { DataTypes, Model } = require('sequelize');

module.exports = class ClientModel extends Model {
  /**
   * @param {import('sequelize').Sequelize} sequelizeInstance
   */
  static setup(sequelizeInstance) {
    ClientModel.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          unique: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: true,
          },
        },
        surname: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: true,
          },
        },
        idType: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isIn: [['DNI', 'Passport', 'Licence']],
          },
        },
        idNumber: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: true,
            is: /^[a-zA-Z0-9-]+$/,
          },
        },
        nationality: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        address: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: true,
            is: /^[\d\s\-+()]+$/,
          },
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: { 
            isEmail: { 
                msg: "Invalid e-mail format. Valid format example: user@domain.com",
            },
          },
        },    
        birthDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          validate: {
            isDate: true,
          },
        }
      },
      {
        sequelize: sequelizeInstance,
        modelName: 'Client',
        tableName: 'clients',
        underscored: true,
        paranoid: true
      }
    );

    return ClientModel;
  }
}
