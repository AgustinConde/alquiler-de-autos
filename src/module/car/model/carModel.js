const { Model, DataTypes } = require('sequelize');

module.exports = class CarModel extends Model {
    static setup(sequelizeInstance) {
        CarModel.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false
                },
                brand: {
                    type: DataTypes.STRING,
                    allowNull: false
                },
                model: {
                    type: DataTypes.STRING,
                    allowNull: false
                },
                year: {
                    type: DataTypes.INTEGER,
                    allowNull: false
                },
                mileage: {
                    type: DataTypes.INTEGER,
                    allowNull: false
                },
                color: {
                    type: DataTypes.STRING,
                    allowNull: false
                    allowNull: false,
                },
                ac: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false
                },
                capacity: {
                    type: DataTypes.INTEGER,
                    allowNull: false
                },
                transmission: {
                    type: DataTypes.STRING,
                    allowNull: false
                },
                pricePerDay: {
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: false,
                    field: 'price_per_day'
                },
                image: {
                    type: DataTypes.STRING,
                    allowNull: true
                }
            },
            {
                sequelize: sequelizeInstance,
                modelName: 'Car',
                tableName: 'cars',
                underscored: true,
                timestamps: true,
                paranoid: true
            }
        );
        return CarModel;
    }
}
