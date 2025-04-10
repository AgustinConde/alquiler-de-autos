const ClientRepository = require('../clientRepository');
const { ClientNotDefinedError, ClientIdNotDefinedError, ClientNotFoundError } = require('../../error/clientError');


function MockClient(data = {}) {
    Object.assign(this, data);
}
  
jest.mock('../../entity/Client', () => MockClient);

jest.mock('../../mapper/clientMapper', () => ({
    modelToEntity: jest.fn().mockImplementation(model => {
        if (!model) return null;
        return new MockClient({
            id: model.id || (model.toJSON && model.toJSON().id),
            name: model.name || (model.toJSON && model.toJSON().name),
            surname: model.surname || (model.toJSON && model.toJSON().surname),
            email: model.email || (model.toJSON && model.toJSON().email)
        });
        }),
        entityToModel: jest.fn().mockImplementation(entity => {
        if (!entity) return {};
        return {
            id: entity.id,
            name: entity.name,
            surname: entity.surname,
            email: entity.email
        };
        }),
}));

const mockClientModel = {
  build: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn()
};

const mockAuditRepository = {
  logAction: jest.fn()
};

describe('ClientRepository', () => {
  let clientRepository;
  
  beforeEach(() => {
    jest.clearAllMocks();
    clientRepository = new ClientRepository(mockClientModel, mockAuditRepository);
  });
  
  describe('save', () => {
    test('should save a new client', async () => {
        const client = new MockClient({
          name: 'John',
          surname: 'Doe',
          email: 'john@example.com'
        });
        
        mockClientModel.create.mockResolvedValue({
          toJSON: () => ({
            id: 1,
            name: 'John',
            surname: 'Doe',
            email: 'john@example.com'
          })
        });
        
        await clientRepository.save(client);
        
        expect(mockClientModel.create).toHaveBeenCalled();
      });
    
    test('should update existing client', async () => {
      const client = new MockClient({
        id: 1, 
        name: 'John', 
        surname: 'Doe', 
        email: 'john@example.com'
      });
      
      const mockInstance = {
        update: jest.fn().mockResolvedValue({}),
        toJSON: () => ({
          id: 1,
          name: 'John',
          surname: 'Doe',
          email: 'john@example.com'
        })
      };
      
      mockClientModel.findByPk.mockResolvedValue(mockInstance);
      
      await clientRepository.save(client);
      
      expect(mockClientModel.findByPk).toHaveBeenCalledWith(1);
      expect(mockInstance.update).toHaveBeenCalled();
    });
    
    test('should throw ClientNotDefinedError when client is not provided', async () => {
      await expect(clientRepository.save(null)).rejects.toThrow(ClientNotDefinedError);
    });
  });
  
  describe('getAll', () => {
    test('should return all clients', async () => {
      const mockClients = [{
        id: 1,
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        toJSON: () => ({
          id: 1,
          name: 'John',
          surname: 'Doe',
          email: 'john@example.com'
        })
      }];
      
      mockClientModel.findAll.mockResolvedValue(mockClients);
      
      const result = await clientRepository.getAll();
      
      expect(mockClientModel.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe('John');
      expect(result[0].surname).toBe('Doe');
      expect(result[0].email).toBe('john@example.com');
    });
  });
  
  describe('getClientById', () => {
    test('should return client by id', async () => {
      const mockClient = {
        id: 1,
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        toJSON: () => ({
          id: 1,
          name: 'John',
          surname: 'Doe',
          email: 'john@example.com'
        })
      };
      
      mockClientModel.findByPk.mockResolvedValue(mockClient);
      
      const result = await clientRepository.getClientById(1);
      
      expect(mockClientModel.findByPk).toHaveBeenCalledWith(1);
      expect(result instanceof MockClient).toBe(true);
      expect(result.id).toBe(1);
      expect(result.email).toBe('john@example.com');
    });
    
    test('should throw ClientIdNotDefinedError when id is not provided', async () => {
      await expect(clientRepository.getClientById(null)).rejects.toThrow(ClientIdNotDefinedError);
    });
    
    test('should throw ClientNotFoundError when client is not found', async () => {
      mockClientModel.findByPk.mockResolvedValue(null);
      await expect(clientRepository.getClientById(999)).rejects.toThrow(ClientNotFoundError);
    });
  });
  
  describe('getClientByEmail', () => {
    test('should return client by email', async () => {
      const email = 'john@example.com';
      const mockClient = {
        id: 1,
        name: 'John',
        surname: 'Doe',
        email: email,
        toJSON: () => ({
          id: 1,
          name: 'John',
          surname: 'Doe',
          email: email
        })
      };
      
      mockClientModel.findOne.mockResolvedValue(mockClient);
      
      const result = await clientRepository.getClientByEmail(email);
      
      expect(mockClientModel.findOne).toHaveBeenCalledWith({
        where: { email: email }
      });
      expect(result instanceof MockClient).toBe(true);
      expect(result.email).toBe(email);
    });
    
    test('should return null when no client found with email', async () => {
      mockClientModel.findOne.mockResolvedValue(null);
      
      const result = await clientRepository.getClientByEmail('notfound@example.com');
      
      expect(result).toBeNull();
    });
  });
});
