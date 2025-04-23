const AuthRepository = require('../authRepository');

const mockAuthModel = {
  create: jest.fn(),
  findOne: jest.fn(),
  findByPk: jest.fn()
};
const Auth = require('../../entity/Auth');

describe('AuthRepository', () => {
  let repo;
  beforeEach(() => {
    jest.clearAllMocks();
    repo = new AuthRepository(mockAuthModel);
  });

  test('save should call model.create with auth', async () => {
    const auth = { id: 1, username: 'user', passwordHash: 'hash', role: 'admin' };
    mockAuthModel.create.mockResolvedValue(auth);
    const result = await repo.save(auth);
    expect(mockAuthModel.create).toHaveBeenCalledWith(auth);
    expect(result).toBe(auth);
  });

  test('getByUsername should return Auth instance if found', async () => {
    const authData = { id: 2, username: 'user', passwordHash: 'hash', role: 'admin' };
    mockAuthModel.findOne.mockResolvedValue(authData);
    const result = await repo.getByUsername('user');
    expect(mockAuthModel.findOne).toHaveBeenCalledWith({ where: { username: 'user' } });
    expect(result).toBeInstanceOf(Auth);
    expect(result.id).toBe(authData.id);
    expect(result.username).toBe(authData.username);
    expect(result.passwordHash).toBe(authData.passwordHash);
    expect(result.role).toBe(authData.role);
  });

  test('getByUsername should return null if not found', async () => {
    mockAuthModel.findOne.mockResolvedValue(null);
    const result = await repo.getByUsername('nouser');
    expect(result).toBeNull();
  });

  test('getByUsername should throw on error', async () => {
    mockAuthModel.findOne.mockRejectedValue(new Error('fail'));
    await expect(repo.getByUsername('user')).rejects.toThrow('Error retrieving authentication data.');
  });

  test('getByEmail should call findOne with correct query', async () => {
    mockAuthModel.findOne.mockResolvedValue({ id: 3 });
    const result = await repo.getByEmail('mail@mail.com');
    expect(mockAuthModel.findOne).toHaveBeenCalledWith({
      where: { username: 'mail@mail.com', deletedAt: null }
    });
    expect(result).toEqual({ id: 3 });
  });

  test('update should update and return Auth instance', async () => {
    const authInstance = {
      id: 4,
      username: 'user',
      passwordHash: 'hash',
      role: 'admin',
      update: jest.fn().mockResolvedValue()
    };
    mockAuthModel.findByPk.mockResolvedValue(authInstance);
    const result = await repo.update(4, { passwordHash: 'newhash' });
    expect(authInstance.update).toHaveBeenCalledWith({ passwordHash: 'newhash' });
    expect(result).toBeInstanceOf(Auth);
    expect(result.id).toBe(4);
    expect(result.passwordHash).toBe('hash');
    expect(result.role).toBe('admin');
  });

  test('update should throw if not found', async () => {
    mockAuthModel.findByPk.mockResolvedValue(null);
    await expect(repo.update(99, { passwordHash: 'x' })).rejects.toThrow('Auth record with ID 99 not found');
  });

  test('update should throw and log error on update error', async () => {
    const authInstance = {
      id: 5,
      username: 'user',
      passwordHash: 'hash',
      role: 'admin',
      update: jest.fn().mockRejectedValue(new Error('fail'))
    };
    mockAuthModel.findByPk.mockResolvedValue(authInstance);
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(repo.update(5, { passwordHash: 'fail' })).rejects.toThrow('fail');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
