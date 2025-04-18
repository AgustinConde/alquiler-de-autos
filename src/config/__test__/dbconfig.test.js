const path = require('path');
const fs = require('fs');

describe('dbconfig (fs side effects)', () => {
  test('should create data directory if it does not exist', () => {
    const mockExistsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const mockMkdirSync = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
    jest.resetModules();
    require('../dbconfig');
    expect(mockExistsSync).toHaveBeenCalled();
    expect(mockMkdirSync).toHaveBeenCalledWith(expect.stringMatching(/src[\\/]data$/), { recursive: true });
    mockExistsSync.mockRestore();
    mockMkdirSync.mockRestore();
  });

  test('should not create data directory if it already exists', () => {
    const mockExistsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const mockMkdirSync = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
    jest.resetModules();
    require('../dbconfig');
    expect(mockExistsSync).toHaveBeenCalled();
    expect(mockMkdirSync).not.toHaveBeenCalled();
    mockExistsSync.mockRestore();
    mockMkdirSync.mockRestore();
  });

  test('should use default rentalDbPath if RENTALDB_PATH is not set', () => {
    const originalEnv = process.env.RENTALDB_PATH;
    delete process.env.RENTALDB_PATH;
    const mockExistsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    delete require.cache[require.resolve('../dbconfig')];
    const config = require('../dbconfig');
    const expectedPath = require('path').resolve(__dirname, '../../data/rentalDb.sqlite');
    const actualPath = require('path').resolve(config.development.rental.storage);
    expect(actualPath).toBe(expectedPath);
    if (originalEnv !== undefined) process.env.RENTALDB_PATH = originalEnv;
    mockExistsSync.mockRestore();
  });

  test('should use RENTALDB_PATH from env if set', () => {
    const customPath = 'C:/custom/path/rentalDb.sqlite';
    const originalEnv = process.env.RENTALDB_PATH;
    jest.resetModules();
    process.env.RENTALDB_PATH = customPath;
    const mockExistsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const config = require('../dbconfig');
    expect(config.development.rental.storage).toBe(customPath);
    if (originalEnv !== undefined) process.env.RENTALDB_PATH = originalEnv;
    else delete process.env.RENTALDB_PATH;
    mockExistsSync.mockRestore();
  });

  test('should use rentalDbPath if RENTALDB_PATH is an empty string', () => {
    const originalEnv = process.env.RENTALDB_PATH;
    jest.resetModules();
    process.env.RENTALDB_PATH = '';
    const mockExistsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const config = require('../dbconfig');
    const expectedPath = require('path').resolve(__dirname, '../../data/rentalDb.sqlite');
    const actualPath = require('path').resolve(config.development.rental.storage);
    expect(actualPath).toBe(expectedPath);
    if (originalEnv !== undefined) process.env.RENTALDB_PATH = originalEnv;
    else delete process.env.RENTALDB_PATH;
    mockExistsSync.mockRestore();
  });
});
