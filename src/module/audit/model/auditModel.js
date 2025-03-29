const { Model, DataTypes } = require('sequelize');

module.exports = class AuditModel extends Model {
  static setup(sequelize) {
    AuditModel.init({
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
      actionType: {
        type: DataTypes.ENUM('delete', 'update', 'create', 'restore'),
        allowNull: false
      },
      data: {
        type: DataTypes.JSON,
        allowNull: false
      },
      performedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the user who performed this action'
      },
      performedByEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Email of the user who performed this action'
      },
      restoredAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      sequelize,
      modelName: 'Audit',
      tableName: 'audits',
      timestamps: true,
      paranoid: true,
      underscored: true
    });
  
    return AuditModel;
  }
};
