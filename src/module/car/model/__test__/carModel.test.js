const { Sequelize, DataTypes } = require('sequelize');
const CarModel = require('../carModel');

describe('CarModel', () => {
  let sequelize;

  beforeAll(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    CarModel.setup(sequelize);
    await sequelize.sync();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('should initialize the model with correct attributes', () => {
    const attributes = CarModel.getAttributes();
    expect(attributes.id.type.key).toBe('INTEGER');
    expect(attributes.brand.type.key).toBe('STRING');
    expect(attributes.model.type.key).toBe('STRING');
    expect(attributes.year.type.key).toBe('INTEGER');
    expect(attributes.mileage.type.key).toBe('INTEGER');
    expect(attributes.color.type.key).toBe('STRING');
    expect(attributes.ac.type.key).toBe('BOOLEAN');
    expect(attributes.capacity.type.key).toBe('INTEGER');
    expect(attributes.transmission.type.key).toBe('STRING');
    expect(attributes.pricePerDay.type.key).toBe('DECIMAL');
    expect(attributes.image.type.key).toBe('STRING');
    expect(attributes.pricePerDay.field).toBe('price_per_day');
    expect(attributes.id.primaryKey).toBe(true);
    expect(attributes.id.autoIncrement).toBe(true);
    expect(attributes.brand.allowNull).toBe(false);
    expect(attributes.image.allowNull).toBe(true);
  });

  test('should create a car record successfully', async () => {
    const car = await CarModel.create({
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      mileage: 10000,
      color: 'Red',
      ac: true,
      capacity: 5,
      transmission: 'automatic',
      pricePerDay: 50.00,
      image: '/uploads/car.jpg'
    });
    expect(car.id).toBeDefined();
    expect(car.brand).toBe('Toyota');
    expect(car.model).toBe('Corolla');
    expect(car.year).toBe(2020);
    expect(car.mileage).toBe(10000);
    expect(car.color).toBe('Red');
    expect(car.ac).toBe(true);
    expect(car.capacity).toBe(5);
    expect(car.transmission).toBe('automatic');
    expect(Number(car.pricePerDay)).toBe(50);
    expect(car.image).toBe('/uploads/car.jpg');
  });

  test('should require mandatory fields', async () => {
    await expect(CarModel.create({})).rejects.toThrow();
  });
});
