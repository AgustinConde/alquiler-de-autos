const ClientService = require('../clientService');
const { ClientNotDefinedError, ClientIdNotDefinedError } = require('../../error/clientError');

function MockClient(data = {}) {
    Object.assign(this, data);
    this.__isMockClient = true;
  }

jest.mock('../../../rental/entity/Rental', () => {
function MockRental() {}
return MockRental;
});

jest.mock('../../entity/Client', () => {
MockClient.findByPk = jest.fn();
return MockClient;
}); 

const Rental = require('../../../rental/entity/Rental');
const Client = require('../../entity/Client');

Object.defineProperty(Client, Symbol.hasInstance, {
    value: function(obj) {
      return obj && (obj.__isMockClient === true);
    }
});

describe('ClientService', () => {
  let clientService;
  let mockClientRepository;
  let mockAuditService;
  
  beforeEach(() => {
    jest.clearAllMocks();

    mockClientRepository = {
      save: jest.fn(),
      getAll: jest.fn(),
      getClientById: jest.fn(),
      getClientByEmail: jest.fn(),
      delete: jest.fn(),
      update: jest.fn()
    };
    
    mockAuditService = {
      createAuditLog: jest.fn()
    };
    
    clientService = new ClientService(mockClientRepository, mockAuditService);

    Client.findByPk.mockReset();
  });
  
  describe('save', () => {
    test('should save client when valid', async () => {
      const client = new Client({
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com'
      });
      
      mockClientRepository.save.mockResolvedValue(client);
      
      const result = await clientService.save(client);
      
      expect(mockClientRepository.save).toHaveBeenCalledWith(client);
      expect(result).toBe(client);
    });
    
    test('should throw ClientNotDefinedError when client is invalid', async () => {
      await expect(clientService.save(null)).rejects.toThrow(ClientNotDefinedError);
      expect(mockClientRepository.save).not.toHaveBeenCalled();
    });

    test('should pass logged in user to audit repository when available', async () => {
      const client = new Client({
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com'
      });
      
      mockClientRepository.save.mockResolvedValue(client);
      
      const result = await clientService.save(client);
      
      expect(mockClientRepository.save).toHaveBeenCalledWith(client);
      expect(result).toBe(client);
    });
  });
  
  describe('getAll', () => {
    test('should return all clients from repository', async () => {
      const mockClients = [
        MockClient({ id: 1, name: 'John', surname: 'Doe' }),
        MockClient({ id: 2, name: 'Jane', surname: 'Smith' })
      ];
      
      mockClientRepository.getAll.mockResolvedValue(mockClients);
      
      const result = await clientService.getAll();
      
      expect(mockClientRepository.getAll).toHaveBeenCalled();
      expect(result).toBe(mockClients);
      expect(result).toHaveLength(2);
    });
  });
  
  describe('getClientById', () => {
    test('should return client by id when found', async () => {
      const clientId = 1;
      const mockClient = MockClient({
        id: clientId,
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com'
      });
      
      mockClientRepository.getClientById.mockResolvedValue(mockClient);
      
      const result = await clientService.getClientById(clientId);
      
      expect(mockClientRepository.getClientById).toHaveBeenCalledWith(clientId);
      expect(result).toBe(mockClient);
    });
    
    test('should throw ClientIdNotDefinedError when id is invalid', async () => {
      await expect(clientService.getClientById(null)).rejects.toThrow(ClientIdNotDefinedError);
      expect(mockClientRepository.getClientById).not.toHaveBeenCalled();
    });
  });

  describe('getClientByEmail', () => {
    test('should return client by email when found', async () => {
      const email = 'john@example.com';
      const mockClient = MockClient({
        id: 1,
        name: 'John',
        surname: 'Doe',
        email
      });
      
      mockClientRepository.getClientByEmail.mockResolvedValue(mockClient);
      
      const result = await clientService.getClientByEmail(email);
      
      expect(mockClientRepository.getClientByEmail).toHaveBeenCalledWith(email);
      expect(result).toBe(mockClient);
    });
    
    test('should return null when email is not found', async () => {
      const email = 'nonexistent@example.com';
      mockClientRepository.getClientByEmail.mockResolvedValue(null);
      
      const result = await clientService.getClientByEmail(email);
      
      expect(mockClientRepository.getClientByEmail).toHaveBeenCalledWith(email);
      expect(result).toBeNull();
    });
  });
  
  describe('delete', () => {
    test('should delete client by id', async () => {
      const clientId = 1;
      const mockClient = new Client({
        id: clientId, 
        name: 'John', 
        surname: 'Doe'
      });

      const mockClientInstance = {
        Rentals: [],
        destroy: jest.fn().mockResolvedValue({}),
        toJSON: () => mockClient
      };
      
      Client.findByPk.mockResolvedValue(mockClientInstance);
    
      await clientService.delete(clientId);
      
      expect(Client.findByPk).toHaveBeenCalledWith(clientId, {
        include: [{ model: Rental }]
      });
      expect(mockClientInstance.destroy).toHaveBeenCalled();
    });

    test('should delete client object directly', async () => {
      const mockClient = new Client({
        id: 1, 
        name: 'John', 
        surname: 'Doe'
      });
      
      const mockClientInstance = {
        Rentals: [],
        destroy: jest.fn().mockResolvedValue({}),
        toJSON: () => mockClient
      };
      
      Client.findByPk.mockResolvedValue(mockClientInstance);
      
      await clientService.delete(mockClient);
      
      expect(Client.findByPk).toHaveBeenCalledWith(mockClient, {
        include: [{ model: Rental }]
      });
      expect(mockClientInstance.destroy).toHaveBeenCalled();
    });
    
    test('should throw ClientIdNotDefinedError when id is invalid', async () => {
        Client.findByPk.mockImplementation(() => {
            throw new ClientIdNotDefinedError();
        });
        
        await expect(clientService.delete(null)).rejects.toThrow(ClientIdNotDefinedError);
        expect(mockClientRepository.delete).not.toHaveBeenCalled();
    });
  });
  
  describe('update', () => {
    test('should update client successfully', async () => {
      const clientId = 1;
      const updateData = {
        name: 'John Updated',
        email: 'john.updated@example.com'
      };
      
      const updatedClient = MockClient({
        id: clientId,
        name: 'John Updated',
        surname: 'Doe',
        email: 'john.updated@example.com'
      });
      
      mockClientRepository.update.mockResolvedValue(updatedClient);
      
      const result = await clientService.update(clientId, updateData);
      
      expect(mockClientRepository.update).toHaveBeenCalledWith(clientId, updateData);
      expect(result).toBe(updatedClient);
    });
    
    test('should throw ClientIdNotDefinedError when id is invalid', async () => {
      const updateData = { name: 'John Updated' };
      
      await expect(clientService.update(null, updateData)).rejects.toThrow(ClientIdNotDefinedError);
      expect(mockClientRepository.update).not.toHaveBeenCalled();
    });
  });
});
