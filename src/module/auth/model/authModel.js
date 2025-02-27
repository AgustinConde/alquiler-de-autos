const { DataTypes, Model } = require('sequelize');

module.exports = class AuthModel extends Model {
/**
* @param {import('sequelize').Sequelize} sequelizeInstance
*/
    static setup(sequelizeInstance) {
        AuthModel.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    allowNull: false,
                    autoIncrement: true,
                },
                username: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    unique: true,
                },
                passwordHash: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                role: {
                    type: DataTypes.ENUM('admin', 'client'),
                    allowNull: false,
                    defaultValue: 'client'
                },
                clientId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'clients',
                        key: 'id'
                    }
                }
            },
            {
                sequelize: sequelizeInstance,
                modelName: "Auth",
                tableName: "auths",
                underscored: true,
                timestamps: true,
                paranoid: true,
            }
        );

        return AuthModel;
    }
/**
* @param {typeof import('../../client/model/clientModel')} ClientModel
*/
    static setAssociations(ClientModel) {
        AuthModel.belongsTo(ClientModel, {
            foreignKey: 'clientId',             
            as: 'client',     
        });
        return AuthModel;
    }
}
