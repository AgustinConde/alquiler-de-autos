const ClientRepository = require('../clientRepository');
const Client = require('../../entity/Client');
const { ClientNotDefinedError, ClientIdNotDefinedError, ClientNotFoundError } = require('../../error/clientError');

jest.mock('../../mapper/clientMapper', () => ({
  entityToModel: jest.fn(),
  modelToEntity: jest.fn()
}), { virtual: true });

const clientMapper = require('../../mapper/clientMapper');

global.BackupRepository = {
  backupByClientId: jest.fn().mockResolvedValue({})
};

global.AuthModel = {};

describe('ClientRepository', () => {
  let clientRepository;
  let mockClientModel;
  
  beforeEach(() => {
    clientMapper.entityToModel.mockImplementation(client => ({
      id: client.id,
      name: client.name,
      surname: client.surname,
      email: client.email,
      phone: client.phone
    }));
    
    clientMapper.modelToEntity.mockImplementation(model => new Client({
      id: model.id,
      name: model.name,
      surname: model.surname,
      email: model.email,
      phone: model.phone
    }));
    
    mockClientModel = {
      create: jest.fn().mockResolvedValue({
        id: 1,
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phone: '123456789',
        toJSON: () => ({
          id: 1,
          name: 'John',
          surname: 'Doe',
          email: 'john@example.com',
          phone: '123456789'
        })
      }),
      findByPk: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      destroy: jest.fn().mockResolvedValue(1),
      update: jest.fn().mockResolvedValue({})
    };
    
    clientRepository = new ClientRepository(mockClientModel);
  });
  
  describe('save', () => {
    test('should save client data', async () => {
      const client = new Client({
        id: null,
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phone: '123456789'
      });
      
      const result = await clientRepository.save(client);
      
      expect(mockClientModel.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('name', 'John');
    });
    
    test('should throw ClientNotDefinedError when client is null', async () => {
      await expect(clientRepository.save(null)).rejects.toThrow(ClientNotDefinedError);
    });
    
    test('should throw ClientNotDefinedError when client is not a Client instance', async () => {
      await expect(clientRepository.save({})).rejects.toThrow(ClientNotDefinedError);
    });
    
    test('should update existing client', async () => {
      const client = new Client({
        id: 1,
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phone: '123456789'
      });
      
      mockClientModel.findByPk.mockResolvedValue({
        update: jest.fn().mockResolvedValue({}),
        toJSON: () => ({
          id: 1,
          name: 'John',
          surname: 'Doe',
          email: 'john@example.com',
          phone: '123456789'
        })
      });
      
      const result = await clientRepository.save(client);
      
      expect(mockClientModel.findByPk).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty('id', 1);
    });

    test('should throw error when client ID exists but client not found', async () => {
      const client = new Client({
        id: 999,
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com'
      });
      
      mockClientModel.findByPk.mockResolvedValue(null);
      
      await expect(clientRepository.save(client))
        .rejects
        .toThrow(`Client with ID ${client.id} not found`);
        
      expect(mockClientModel.findByPk).toHaveBeenCalledWith(client.id);
      expect(mockClientModel.create).not.toHaveBeenCalled();
    });
    
    test('should propagate errors during save operation', async () => {
      const client = new Client({
        id: null,
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com'
      });
      
      const error = new Error('Database connection failed');
      mockClientModel.create.mockRejectedValue(error);
      
      await expect(clientRepository.save(client))
        .rejects
        .toThrow('Database connection failed');
      
      expect(mockClientModel.create).toHaveBeenCalled();
    });
  });
  
  describe('getClientById', () => {
    test('should return client by id', async () => {
      const clientId = 1;
      const mockClient = {
        id: clientId,
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phone: '123456789',
        toJSON: function() {
          return {
            id: this.id,
            name: this.name,
            surname: this.surname,
            email: this.email,
            phone: this.phone
          };
        }
      };
      
      mockClientModel.findByPk.mockResolvedValue(mockClient);
      
      const result = await clientRepository.getClientById(clientId);
      
      expect(mockClientModel.findByPk).toHaveBeenCalledWith(clientId);
      expect(result).toBeInstanceOf(Client);
    });
    
    test('should throw ClientIdNotDefinedError when id is invalid', async () => {
      await expect(clientRepository.getClientById(null)).rejects.toThrow(ClientIdNotDefinedError);
      expect(mockClientModel.findByPk).not.toHaveBeenCalled();
    });
    
    test('should throw ClientNotFoundError when client not found', async () => {
      mockClientModel.findByPk.mockResolvedValue(null);
      
      await expect(clientRepository.getClientById(999)).rejects.toThrow(ClientNotFoundError);
      expect(mockClientModel.findByPk).toHaveBeenCalledWith(999);
    });
  });
  
  describe('delete', () => {
    test('should delete client', async () => {
      const client = new Client({
        id: 1,
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com'
      });
      
      const result = await clientRepository.delete(client);
      
      expect(BackupRepository.backupByClientId).toHaveBeenCalledWith(1);
      expect(mockClientModel.destroy).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(result).toBe(true);
    });
    
    test('should throw error when client is not an instance of Client', async () => {
      await expect(clientRepository.delete(null)).rejects.toThrow(ClientNotDefinedError);
      expect(mockClientModel.destroy).not.toHaveBeenCalled();
    });
  });
  
  describe('getClientByEmail', () => {
    test('should return client by email', async () => {
      const email = 'john@example.com';
      const mockClient = {
        id: 1,
        name: 'John',
        surname: 'Doe',
        email,
        phone: '123456789',
        toJSON: function() {
          return {
            id: this.id,
            name: this.name,
            surname: this.surname,
            email: this.email,
            phone: this.phone
          };
        }
      };
      
      mockClientModel.findOne.mockResolvedValue(mockClient);
      
      const result = await clientRepository.getClientByEmail(email);
      
      expect(mockClientModel.findOne).toHaveBeenCalledWith({
        where: { email }
      });
      expect(result).toBeInstanceOf(Client);
    });
    
    test('should return null when client not found by email', async () => {
      mockClientModel.findOne.mockResolvedValue(null);
      
      const result = await clientRepository.getClientByEmail('nonexistent@example.com');
      
      expect(result).toBeNull();
    });

    test('should call findOne with correct parameters', async () => {
      const email = 'test@example.com';
      const expectedParams = {
        where: {
          email,
          deletedAt: null
        }
      };
      
      mockClientModel.findOne.mockResolvedValue({
        id: 1,
        email,
        name: 'Test',
        toJSON: () => ({ id: 1, email, name: 'Test' })
      });
      
      await clientRepository.getByEmail(email);
      
      expect(mockClientModel.findOne).toHaveBeenCalledWith(expectedParams);
    });
    
    test('should return result from findOne directly', async () => {
      const mockResult = { id: 1, email: 'test@example.com' };
      mockClientModel.findOne.mockResolvedValue(mockResult);
      
      const result = await clientRepository.getByEmail('test@example.com');
      
      expect(result).toBe(mockResult);
    });
  });

  describe('getAllClients', () => {
    test('should return all clients', async () => {
      const mockClients = [
        {
          id: 1,
          name: 'John',
          surname: 'Doe',
          email: 'john@example.com',
          phone: '123456789',
          Auth: { role: 'admin' },
          toJSON: function() {
            return {
              id: this.id,
              name: this.name,
              surname: this.surname,
              email: this.email,
              phone: this.phone
            };
          }
        },
        {
          id: 2,
          name: 'Jane',
          surname: 'Smith',
          email: 'jane@example.com',
          phone: '987654321',
          Auth: null,
          toJSON: function() {
            return {
              id: this.id,
              name: this.name,
              surname: this.surname,
              email: this.email,
              phone: this.phone
            };
          }
        }
      ];
      
      mockClientModel.findAll.mockResolvedValue(mockClients);
      
      const result = await clientRepository.getAllClients();
      
      expect(mockClientModel.findAll).toHaveBeenCalled();
      expect(result.length).toBe(2);
    });

    test('should handle empty result from findAll', async () => {
      mockClientModel.findAll.mockResolvedValue([]);
      
      const result = await clientRepository.getAll();
      
      expect(result).toEqual([]);
      expect(mockClientModel.findAll).toHaveBeenCalled();
    });
  });
  
  describe('update', () => {
    test('should update client', async () => {
      const clientId = 1;
      const updateData = {
        name: 'Updated Name'
      };
      
      const mockClientInstance = {
        update: jest.fn().mockResolvedValue({}),
        toJSON: () => ({
          id: clientId,
          name: 'Updated Name'
        })
      };
      
      mockClientModel.findByPk.mockResolvedValue(mockClientInstance);
      
      const result = await clientRepository.update(clientId, updateData);
      
      expect(mockClientModel.findByPk).toHaveBeenCalledWith(clientId);
      expect(mockClientInstance.update).toHaveBeenCalledWith(updateData);
      expect(result).toHaveProperty('id', clientId);
      expect(result).toHaveProperty('name', 'Updated Name');
    });
    
    test('should throw ClientIdNotDefinedError when id is invalid', async () => {
      await expect(clientRepository.update(null, {})).rejects.toThrow(ClientIdNotDefinedError);
      expect(mockClientModel.findByPk).not.toHaveBeenCalled();
    });
    
    test('should throw ClientNotFoundError when client not found', async () => {
      mockClientModel.findByPk.mockResolvedValue(null);
      
      await expect(clientRepository.update(999, {})).rejects.toThrow(ClientNotFoundError);
      expect(mockClientModel.findByPk).toHaveBeenCalledWith(999);
    });
  });
  
  describe('restore', () => {
    test('should restore deleted client', async () => {
      const clientId = 1;
      const mockClientInstance = {
        restore: jest.fn().mockResolvedValue({}),
        deletedAt: new Date(),
        toJSON: () => ({
          id: clientId,
          name: 'John',
          surname: 'Doe',
          email: 'john@example.com',
          deletedAt: new Date()
        })
      };
      
      mockClientModel.findByPk.mockResolvedValue(mockClientInstance);
      
      const result = await clientRepository.restore(clientId);
      
      expect(mockClientModel.findByPk).toHaveBeenCalledWith(
        clientId, 
        expect.objectContaining({
          paranoid: false
        })
      );
      expect(mockClientInstance.restore).toHaveBeenCalled();
      expect(result).toHaveProperty('id', clientId);
    });
    
    test('should throw ClientIdNotDefinedError when id is invalid', async () => {
      await expect(clientRepository.restore(null)).rejects.toThrow(ClientIdNotDefinedError);
    });
    
    test('should throw ClientNotFoundError when client not found', async () => {
      mockClientModel.findByPk.mockResolvedValue(null);
      
      await expect(clientRepository.restore(999)).rejects.toThrow(ClientNotFoundError);
    });

    test('should restore a soft-deleted client', async () => {
      const mockClientInstance = {
        id: 1,
        name: 'John',
        surname: 'Doe',
        deletedAt: new Date(),
        restore: jest.fn().mockResolvedValue(true),
        toJSON: () => ({ id: 1, name: 'John' })
      };
      
      mockClientModel.findByPk.mockImplementation((id, options) => {
        if (options && options.paranoid === false) {
          return Promise.resolve(mockClientInstance);
        }
        return Promise.resolve(null);
      });
      
      const result = await clientRepository.restore(1);
      
      expect(mockClientModel.findByPk).toHaveBeenCalledWith(1, { paranoid: false });
      expect(mockClientInstance.restore).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
    
    test('should handle client not found during restore', async () => {
      mockClientModel.findByPk.mockImplementation((id, options) => {
        return Promise.resolve(null);
      });
      
      await expect(clientRepository.restore(999))
        .rejects
        .toThrow(ClientNotFoundError);
    });
    
    test('should throw error when client is not deleted', async () => {
      const mockClientInstance = {
        deletedAt: null,
        toJSON: () => ({
          id: 1,
          deletedAt: null
        })
      };
      
      mockClientModel.findByPk.mockResolvedValue(mockClientInstance);
      
      await expect(clientRepository.restore(1)).rejects.toThrow('Client is not deleted');
    });
  });
});
