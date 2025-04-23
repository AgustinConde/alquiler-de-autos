const carMapper = require('../carMapper');

jest.mock('../../../rental/mapper/rentalMapper', () => ({
  modelToEntity: jest.fn(r => ({ mapped: r }))
}));
const Car = require('../../entity/Car');

describe('carMapper', () => {
  describe('modelToEntity', () => {
    test('should map all fields and map rentals array', () => {
      const input = {
        id: '1',
        brand: 'Toyota',
        model: 'Corolla',
        year: '2020',
        mileage: '10000',
        color: 'red',
        ac: true,
        capacity: '5',
        transmission: 'auto',
        pricePerDay: '50',
        image: '/img.jpg',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        deletedAt: null,
        rentals: [{ id: 1 }, { id: 2 }]
      };
      const result = carMapper.modelToEntity(input);
      expect(result).toBeInstanceOf(Car);
      expect(result.id).toBe(1);
      expect(result.brand).toBe('Toyota');
      expect(result.model).toBe('Corolla');
      expect(result.year).toBe(2020);
      expect(result.mileage).toBe(10000);
      expect(result.color).toBe('red');
      expect(result.ac).toBe(true);
      expect(result.capacity).toBe(5);
      expect(result.transmission).toBe('auto');
      expect(result.pricePerDay).toBe(50);
      expect(result.image).toBe('/img.jpg');
      expect(result.createdAt).toBe('2024-01-01');
      expect(result.updatedAt).toBe('2024-01-02');
      expect(result.deletedAt).toBeNull();
      expect(result.rentals).toEqual([{ mapped: { id: 1 } }, { mapped: { id: 2 } }]);
    });

    test('should use default values for createdAt, updatedAt, deletedAt, rentals', () => {
      const input = {
        id: '2',
        brand: 'Honda',
        model: 'Civic',
        year: '2021',
        mileage: '5000',
        color: 'blue',
        ac: false,
        capacity: '4',
        transmission: 'manual',
        pricePerDay: '60',
        image: '/img2.jpg'
        // no createdAt, updatedAt, deletedAt, rentals
      };
      const result = carMapper.modelToEntity(input);
      expect(result.createdAt).toBeNull();
      expect(result.updatedAt).toBeNull();
      expect(result.deletedAt).toBeNull();
      expect(result.rentals).toEqual([]);
    });
  });

  describe('formToEntity', () => {
    test('should map all fields from form', () => {
      const input = {
        id: 3,
        brand: 'Ford',
        model: 'Focus',
        year: 2022,
        mileage: 2000,
        color: 'white',
        ac: true,
        capacity: 5,
        transmission: 'auto',
        pricePerDay: 70,
        image: '/img3.jpg',
        'created-at': '2024-04-23'
      };
      const result = carMapper.formToEntity(input);
      expect(result).toBeInstanceOf(Car);
      expect(result.id).toBe(3);
      expect(result.brand).toBe('Ford');
      expect(result.model).toBe('Focus');
      expect(result.year).toBe(2022);
      expect(result.mileage).toBe(2000);
      expect(result.color).toBe('white');
      expect(result.ac).toBe(true);
      expect(result.capacity).toBe(5);
      expect(result.transmission).toBe('auto');
      expect(result.pricePerDay).toBe(70);
      expect(result.image).toBe('/img3.jpg');
      expect(result.createdAt).toBe('2024-04-23');
    });
  });
});
