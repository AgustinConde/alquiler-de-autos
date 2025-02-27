const { Model, DataTypes } = require('sequelize');
const AuthModel = require('../../auth/model/authModel');

module.exports = class ClientModel extends Model {
    /**
   * @param {import('sequelize').Sequelize} sequelizeInstance
   */
  static setup(sequelizeInstance) {
    ClientModel.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      surname: {
        type: DataTypes.STRING,
        allowNull: false
      },
      idType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'id_type'
      },
      idNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'id_number'
      },
      nationality: {
        type: DataTypes.STRING,
        allowNull: false
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      birthDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'birth_date'
      },
    }, {
      sequelize: sequelizeInstance,
      modelName: 'Client',
      tableName: 'clients',
      timestamps: true,
      paranoid: true,
      underscored: true
    });

    return ClientModel;
  }

  /**
* @param {typeof import('../../auth/model/authModel')} AuthModel
*/
static setAssociations() {
  ClientModel.belongsTo(AuthModel, { foreignKey: 'clientId', as: 'auth', onDelete: 'CASCADE'});
  return ClientModel;
}
};
