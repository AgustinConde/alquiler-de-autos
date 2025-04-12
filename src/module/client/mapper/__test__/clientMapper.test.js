const { modelToEntity, formToEntity } = require('../clientMapper');
const Client = require('../../entity/Client');

jest.mock('../../../rental/mapper/rentalMapper', () => ({
  modelToEntity: jest.fn().mockReturnValue({
    id: 999,
    rentalStart: new Date(),
    rentalEnd: new Date(),
    totalPrice: 100
  })
}));

describe('clientMapper', () => {
  describe('modelToEntity', () => {
    test('should map model to entity with all properties', () => {
      const now = new Date();
      const model = {
        id: 1,
        name: 'John',
        surname: 'Doe',
        idType: 'DNI',
        idNumber: '123456789',
        nationality: 'Argentina',
        address: '123 Main St',
        phone: '1234567890',
        email: 'john@example.com',
        birthDate: now,
        role: 'client',
        createdAt: now,
        updatedAt: now,
        Rentals: []
      };
      
      const result = modelToEntity(model);
      
      expect(result).toBeInstanceOf(Client);
      expect(result.id).toBe(1);
      expect(result.name).toBe('John');
      expect(result.surname).toBe('Doe');
      expect(result.idType).toBe('DNI');
      expect(result.idNumber).toBe(123456789);
      expect(result.nationality).toBe('Argentina');
      expect(result.address).toBe('123 Main St');
      expect(result.phone).toBe('1234567890');
      expect(result.email).toBe('john@example.com');
      expect(result.birthDate).toEqual(now);
      expect(result.role).toBe('client');
      expect(result.createdAt).toEqual(now);
      expect(result.updatedAt).toEqual(now);
    });
    
    test('should handle null birthDate', () => {
      const model = {
        id: 1,
        name: 'John',
        birthDate: null,
        Rentals: []
      };
      
      const result = modelToEntity(model);
      
      expect(result.birthDate).toBeNull();
    });
    
    test('should handle invalid birthDate', () => {
      const model = {
        id: 1,
        name: 'John',
        birthDate: 'not-a-date',
        Rentals: []
      };
      
      const result = modelToEntity(model);
      
      expect(result.birthDate).toBeNull();
    });
    
    test('should map rentals when provided', () => {
      const rentalMapper = require('../../../rental/mapper/rentalMapper');
      
      const model = {
        id: 1,
        name: 'John',
        surname: 'Doe',
        Rentals: [
          { id: 1, carId: 101, totalPrice: 150 },
          { id: 2, carId: 102, totalPrice: 200 }
        ]
      };
      
      const result = modelToEntity(model);
      
      expect(rentalMapper.modelToEntity).toHaveBeenCalledTimes(2);
      expect(rentalMapper.modelToEntity).toHaveBeenCalledWith(model.Rentals[0]);
      expect(rentalMapper.modelToEntity).toHaveBeenCalledWith(model.Rentals[1]);
    });
  });
  
  describe('formToEntity', () => {
    test('should map form data to entity', () => {
      const formData = {
        id: '1',
        name: 'John',
        surname: 'Doe',
        'id-type': 'DNI',
        'id-number': '123456789',
        nationality: 'Argentina',
        address: '123 Main St',
        phone: '1234567890',
        email: 'john@example.com',
        role: 'client',
        birthDate: '1990-01-01',
        'created-at': '2023-01-01'
      };
      
      const result = formToEntity(formData);
      
      expect(result).toBeInstanceOf(Client);
      expect(result.id).toBe('1');
      expect(result.name).toBe('John');
      expect(result.surname).toBe('Doe');
      expect(result.idType).toBe('DNI');
      expect(result.idNumber).toBe('123456789');
      expect(result.nationality).toBe('Argentina');
      expect(result.address).toBe('123 Main St');
      expect(result.phone).toBe('1234567890');
      expect(result.email).toBe('john@example.com');
      expect(result.role).toBe('client');
      expect(result.birthDate).toEqual('1990-01-01');
    });
  });
});
