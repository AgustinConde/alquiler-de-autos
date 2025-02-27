const { Model, DataTypes } = require('sequelize');

module.exports = class BackupModel extends Model {
  static setup(sequelize) {
    BackupModel.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      entityType: {
        type: DataTypes.ENUM('car', 'client'),
        allowNull: false
      },
      entityId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      data: {
        type: DataTypes.JSON,
        allowNull: false
      },
      restoredAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      sequelize,
      modelName: 'Backup',
      tableName: 'backups',
      timestamps: true,
      paranoid: true,
      underscored: true
    });

    return BackupModel;
  }
};
