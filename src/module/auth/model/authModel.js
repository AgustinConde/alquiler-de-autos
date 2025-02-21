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
                unique: true,
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
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'client',
            },
          },
          {
            sequelize: sequelizeInstance,
            modelName: "Auth",
            tableName: "auths",
            underscored: true,
            timestamps: true,
          }
        );

        return AuthModel;
    }
}
