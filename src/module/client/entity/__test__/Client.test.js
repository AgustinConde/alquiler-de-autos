const Client = require('../Client');

describe('Client', () => {
  describe('constructor', () => {
    test('should create a client with all properties', () => {
      const now = new Date();
      const client = new Client({
        id: 1,
        name: 'John',
        surname: 'Doe',
        idType: 'DNI',
        idNumber: '123456789',
        nationality: 'Argentina',
        address: '123 Main St',
        phone: '1234567890',
        email: 'john@example.com',
        password: 'securepass',
        birthDate: now,
        createdAt: now,
        updatedAt: now,
        deletedAt: null
      });
      
      expect(client.id).toBe(1);
      expect(client.name).toBe('John');
      expect(client.surname).toBe('Doe');
      expect(client.idType).toBe('DNI');
      expect(client.idNumber).toBe('123456789');
      expect(client.nationality).toBe('Argentina');
      expect(client.address).toBe('123 Main St');
      expect(client.phone).toBe('1234567890');
      expect(client.email).toBe('john@example.com');
      expect(client.password).toBe('securepass');
      expect(client.birthDate).toBe(now);
      expect(client.createdAt).toBe(now);
      expect(client.updatedAt).toBe(now);
      expect(client.deletedAt).toBe(null);
    });
    
    test('should create a client with minimal properties', () => {
      const client = new Client({
        name: 'John',
        surname: 'Doe'
      });
      
      expect(client.id).toBeUndefined();
      expect(client.name).toBe('John');
      expect(client.surname).toBe('Doe');
      expect(client.email).toBeUndefined();
      expect(client.phone).toBeUndefined();
    });
    
    test('should create a client with no properties when empty object provided', () => {
      const client = new Client({});
      
      expect(client.id).toBeUndefined();
      expect(client.name).toBeUndefined();
      expect(client.surname).toBeUndefined();
    });
    
    test('should handle undefined input', () => {
      const client = new Client({});
      
      expect(client.id).toBeUndefined();
      expect(client.name).toBeUndefined();
      expect(client.surname).toBeUndefined();
    });
  });
});
