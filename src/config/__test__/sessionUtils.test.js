const fs = require('fs');
const path = require('path');
const { prepareSessionStorage } = require('../sessionUtils');

describe('prepareSessionStorage', () => {
  let mockExistsSync;
  let mockMkdirSync;
  let mockUnlinkSync;
  let mockConsoleLog;
  const dataDir = path.join(__dirname, '../../data');
  const sessionsFile = path.join(dataDir, 'sessions.sqlite');

  beforeEach(() => {
    mockExistsSync = jest.spyOn(fs, 'existsSync');
    mockMkdirSync = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
    mockUnlinkSync = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create data directory if it does not exist', () => {
    mockExistsSync.mockImplementation((p) => p === dataDir ? false : true);
    prepareSessionStorage({ dataDir, sessionsFile, nodeEnv: 'development' });
    expect(mockMkdirSync).toHaveBeenCalledWith(dataDir, { recursive: true });
  });

  test('should not create data directory if it exists', () => {
    mockExistsSync.mockImplementation((p) => p === dataDir ? true : false);
    prepareSessionStorage({ dataDir, sessionsFile, nodeEnv: 'development' });
    expect(mockMkdirSync).not.toHaveBeenCalled();
  });

  test('should remove sessions.sqlite if not production and file exists', () => {
    mockExistsSync.mockImplementation((p) => {
      if (p === dataDir) return true;
      if (p === sessionsFile) return true;
      return false;
    });
    prepareSessionStorage({ dataDir, sessionsFile, nodeEnv: 'development' });
    expect(mockUnlinkSync).toHaveBeenCalledWith(sessionsFile);
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Old sessions cleared'));
  });

  test('should not remove sessions.sqlite if not production and file does not exist', () => {
    mockExistsSync.mockImplementation((p) => {
      if (p === dataDir) return true;
      if (p === sessionsFile) return false;
      return false;
    });
    prepareSessionStorage({ dataDir, sessionsFile, nodeEnv: 'development' });
    expect(mockUnlinkSync).not.toHaveBeenCalled();
  });

  test('should not remove sessions.sqlite if production', () => {
    mockExistsSync.mockImplementation((p) => true);
    prepareSessionStorage({ dataDir, sessionsFile, nodeEnv: 'production' });
    expect(mockUnlinkSync).not.toHaveBeenCalled();
  });
});
