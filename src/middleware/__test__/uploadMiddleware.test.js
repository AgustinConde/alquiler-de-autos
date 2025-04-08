const mockDiskStorage = jest.fn();
const mockSingle = jest.fn().mockReturnValue(() => {});
const mockMulter = jest.fn().mockReturnValue({
  single: mockSingle
});

jest.mock('multer', () => {
  mockMulter.diskStorage = mockDiskStorage;
  return mockMulter;
});

const mockExistsSync = jest.fn().mockReturnValue(false);
const mockMkdirSync = jest.fn();
jest.mock('fs', () => ({
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync
}));

const mockJoin = jest.fn().mockImplementation((...args) => args.join('/'));
jest.mock('path', () => ({
  join: mockJoin
}));

beforeEach(() => {
  jest.resetModules();
  
  jest.clearAllMocks();
});

describe('uploadMiddleware', () => {
  let multer, fs, path, uploadMiddleware;
  
  beforeEach(() => {
    multer = require('multer');
    fs = require('fs');
    path = require('path');
    
    uploadMiddleware = require('../uploadMiddleware');
  });
  
  test('should configure diskStorage correctly', () => {
    expect(mockDiskStorage).toHaveBeenCalled();
    
    const diskStorageConfig = mockDiskStorage.mock.calls[0][0];
    
    expect(diskStorageConfig).toHaveProperty('destination');
    expect(diskStorageConfig).toHaveProperty('filename');
    
    const destinationCb = jest.fn();
    diskStorageConfig.destination({}, { mimetype: 'image/jpeg' }, destinationCb);
    expect(destinationCb).toHaveBeenCalledWith(null, expect.any(String));
    
    const filenameCb = jest.fn();
    diskStorageConfig.filename({}, { originalname: 'test.jpg' }, filenameCb);
    expect(filenameCb).toHaveBeenCalled();
    expect(filenameCb.mock.calls[0][1]).toContain('test.jpg');
  });
  
  test('should configure multer correctly', () => {
    expect(mockMulter).toHaveBeenCalled();
    
    const multerConfig = mockMulter.mock.calls[0][0];
    
    expect(multerConfig).toHaveProperty('storage');
    expect(multerConfig).toHaveProperty('fileFilter');
    expect(multerConfig).toHaveProperty('limits');
    expect(multerConfig.limits).toHaveProperty('fileSize', 5 * 1024 * 1024); // 5MB
    
    const fileFilter = multerConfig.fileFilter;
    
    const validCb = jest.fn();
    fileFilter({}, { mimetype: 'image/jpeg' }, validCb);
    expect(validCb).toHaveBeenCalledWith(null, true);
    
    const invalidCb = jest.fn();
    fileFilter({}, { mimetype: 'application/pdf' }, invalidCb);
    expect(invalidCb).toHaveBeenCalledWith(expect.any(Error), false);
  });
  
  test('should create upload directory if it doesn\'t exist', () => {
    expect(mockJoin).toHaveBeenCalled();
    
    expect(mockExistsSync).toHaveBeenCalled();
    
    expect(mockMkdirSync).toHaveBeenCalled();
  });
  
  test('should export a middleware function', () => {
    expect(uploadMiddleware).toBeDefined();
    expect(uploadMiddleware.single).toBeDefined();
    expect(typeof uploadMiddleware.single).toBe('function');
  });
});
