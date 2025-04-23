let mockExistsSync = jest.fn().mockReturnValue(false);
const mockMkdirSync = jest.fn();
const mockDiskStorage = jest.fn();
const mockSingle = jest.fn();
const mockMulter = jest.fn().mockReturnValue({
  single: mockSingle
});

jest.mock('multer', () => {
  mockMulter.diskStorage = mockDiskStorage;
  return mockMulter;
});

jest.mock('fs', () => ({
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync
}));

const mockJoin = jest.fn().mockImplementation((...args) => args.join('/'));
jest.mock('path', () => ({
  join: mockJoin
}));

describe('uploadMiddleware', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    mockExistsSync = jest.fn().mockReturnValue(false);
    require('fs').existsSync = mockExistsSync;
    
    delete require.cache[require.resolve('../uploadMiddleware')];
  });
  
  test('should create upload directory if it doesn\'t exist', () => {
    mockExistsSync.mockReturnValue(false);
    
    require('../uploadMiddleware');
    
    expect(mockExistsSync).toHaveBeenCalled();
    
    expect(mockMkdirSync).toHaveBeenCalledWith(
      expect.any(String), 
      { recursive: true }
    );
  });
  
  test('should NOT create upload directory if it already exists', () => {
    mockExistsSync.mockReturnValue(true);
    
    require('../uploadMiddleware');
    
    expect(mockExistsSync).toHaveBeenCalled();
    
    expect(mockMkdirSync).not.toHaveBeenCalled();
  });
  
  test('should configure diskStorage correctly', () => {
    const uploadMiddleware = require('../uploadMiddleware');
    
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
    const uploadMiddleware = require('../uploadMiddleware');
    
    expect(mockMulter).toHaveBeenCalled();
    
    const multerConfig = mockMulter.mock.calls[0][0];
    
    expect(multerConfig).toHaveProperty('storage');
    expect(multerConfig).toHaveProperty('fileFilter');
    expect(multerConfig).toHaveProperty('limits');
    expect(multerConfig.limits).toHaveProperty('fileSize', 5 * 1024 * 1024); // 5MB
  });
  
  test('should accept image files in fileFilter', () => {
    const uploadMiddleware = require('../uploadMiddleware');
    
    const multerConfig = mockMulter.mock.calls[0][0];
    const fileFilter = multerConfig.fileFilter;
    
    const validCb = jest.fn();
    fileFilter({}, { mimetype: 'image/jpeg' }, validCb);
    expect(validCb).toHaveBeenCalledWith(null, true);
  });
  
  test('should reject non-image files in fileFilter', () => {
    const uploadMiddleware = require('../uploadMiddleware');
    
    const multerConfig = mockMulter.mock.calls[0][0];
    const fileFilter = multerConfig.fileFilter;
    
    const invalidCb = jest.fn();
    fileFilter({}, { mimetype: 'application/pdf' }, invalidCb);
    expect(invalidCb).toHaveBeenCalledWith(expect.any(Error), false);
    expect(invalidCb.mock.calls[0][0].message).toBe('Only image files are allowed!');
  });
  
  test('should export middleware with single method', () => {
    const uploadMiddleware = require('../uploadMiddleware');
    
    expect(uploadMiddleware).toBeDefined();
    expect(uploadMiddleware.single).toBeDefined();
    expect(typeof uploadMiddleware.single).toBe('function');
  });

  test('middleware should handle upload errors', () => {
    mockSingle.mockImplementation((fieldName) => {
      return (req, res, next) => next(new Error('Upload error'));
    });
    
    const uploadMiddleware = require('../uploadMiddleware');
    
    const middleware = uploadMiddleware.single('image');
    const mockReq = {};
    const mockRes = {};
    const mockNext = jest.fn();
    
    middleware(mockReq, mockRes, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});
