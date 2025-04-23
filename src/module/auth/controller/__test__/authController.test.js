jest.mock('../../middleware/authMiddleware', () => ({
  isAuthenticated: jest.fn()
}));

const AuthController = require('../authController');
const { isAuthenticated } = require('../../middleware/authMiddleware');

describe('AuthController', () => {
  let authService;
  let controller;
  let req;
  let res;

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      register: jest.fn(),
      getClientProfile: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      clientRepository: { getAll: jest.fn() }
    };
    controller = new AuthController(authService);
    req = { flash: jest.fn().mockReturnValue([]), body: {}, session: {}, params: {}, ip: '127.0.0.1', path: '/some-path' };
    res = { render: jest.fn(), redirect: jest.fn(), json: jest.fn(), status: jest.fn().mockReturnThis(), locals: {} };
  });

  test('login should render login page', async () => {
    await controller.login(req, res);
    expect(res.render).toHaveBeenCalledWith('pages/auth/login.njk', expect.objectContaining({ title: 'Login' }));
  });

  test('register should render register page', async () => {
    await controller.register(req, res);
    expect(res.render).toHaveBeenCalledWith('pages/auth/register.njk', expect.objectContaining({ title: 'Register' }));
  });

  test('logout should destroy session and redirect', async () => {
    req.session.destroy = jest.fn(cb => cb());
    await controller.logout(req, res);
    expect(res.redirect).toHaveBeenCalledWith('/');
  });

  test('logout should handle error destroying session', async () => {
    const error = new Error('fail');
    req.session.destroy = jest.fn(cb => cb(error));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await controller.logout(req, res);
    expect(spy).toHaveBeenCalledWith('❌ Error destroying session:', error);
    expect(res.redirect).toHaveBeenCalledWith('/');
    spy.mockRestore();
  });

  test('changePassword should render change-password page', async () => {
    await controller.changePassword(req, res);
    expect(res.render).toHaveBeenCalledWith('pages/change-password.njk', expect.objectContaining({ title: 'Change Password' }));
  });

  test('changePassword should handle error', async () => {
    res.render = jest.fn(() => { throw new Error('fail'); });
    await controller.changePassword(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'fail');
    expect(res.redirect).toHaveBeenCalledWith('/profile');
  });

  test('processLogin should authenticate and redirect to / if no returnTo', async () => {
    req.body = { email: 'test@example.com', password: 'pass' };
    authService.login.mockResolvedValue({ auth: { id: 1, username: 'test' }, client: { id: 2, role: 'user' } });
    req.session = {};
    await controller.processLogin(req, res);
    expect(authService.login).toHaveBeenCalledWith('test@example.com', 'pass');
    expect(req.session.clientId).toBe(2);
    expect(req.session.auth).toEqual({ id: 1, username: 'test' });
    expect(req.session.role).toBe('user');
    expect(res.redirect).toHaveBeenCalledWith('/');
  });

  test('processLogin should redirect to returnTo and clear it', async () => {
    req.body = { email: 'test@example.com', password: 'pass' };
    req.session = { returnTo: '/dashboard' };
    authService.login.mockResolvedValue({ auth: { id: 1, username: 'test' }, client: { id: 2, role: 'user' } });
    await controller.processLogin(req, res);
    expect(res.redirect).toHaveBeenCalledWith('/dashboard');
    expect(req.session.returnTo).toBeUndefined();
  });

  test('processLogin should sanitize returnTo for static files', async () => {
    req.body = { email: 'test@example.com', password: 'pass' };
    req.session = { returnTo: '/favicon.ico' };
    authService.login.mockResolvedValue({ auth: { id: 1, username: 'test' }, client: { id: 2, role: 'user' } });
    await controller.processLogin(req, res);
    expect(res.redirect).toHaveBeenCalledWith('/');
  });

  test('processLogin should handle error and redirect to login', async () => {
    req.body = { email: 'fail@example.com', password: 'fail' };
    authService.login.mockRejectedValue(new Error('fail'));
    req.session = {};
    await controller.processLogin(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'Invalid credentials');
    expect(res.redirect).toHaveBeenCalledWith('/auth/login');
  });

  test('processRegister should handle missing fields', async () => {
    req.body = { email: '', password: '' };
    await controller.processRegister(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('Missing required fields'));
    expect(res.redirect).toHaveBeenCalledWith('/auth/register');
  });

  test('processRegister should handle invalid email', async () => {
    req.body = { name: 'a', surname: 'b', email: 'bad', phone: '1', idType: 'dni', idNumber: '2', password: 'x', confirmPassword: 'x' };
    await controller.processRegister(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'Invalid email format');
    expect(res.redirect).toHaveBeenCalledWith('/auth/register');
  });

  test('processRegister should handle password mismatch', async () => {
    req.body = { name: 'a', surname: 'b', email: 'a@b.com', phone: '1', idType: 'dni', idNumber: '2', password: 'x', confirmPassword: 'y' };
    await controller.processRegister(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'Passwords do not match');
    expect(res.redirect).toHaveBeenCalledWith('/auth/register');
  });

  test('processRegister should register and redirect to login', async () => {
    req.body = { name: 'a', surname: 'b', email: 'a@b.com', phone: '1', idType: 'dni', idNumber: '2', password: 'x', confirmPassword: 'x' };
    authService.register.mockResolvedValue({});
    await controller.processRegister(req, res);
    expect(authService.register).toHaveBeenCalled();
    expect(req.flash).toHaveBeenCalledWith('success', expect.stringContaining('Registration successful'));
    expect(res.redirect).toHaveBeenCalledWith('/auth/login');
  });

  test('processRegister should handle error and redirect', async () => {
    req.body = { name: 'a', surname: 'b', email: 'a@b.com', phone: '1', idType: 'dni', idNumber: '2', password: 'x', confirmPassword: 'x' };
    authService.register.mockRejectedValue(new Error('fail'));
    await controller.processRegister(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'fail');
    expect(res.redirect).toHaveBeenCalledWith('/auth/register');
  });

  test('profile should render profile if authenticated', async () => {
    req.session = { clientId: 1 };
    authService.getClientProfile.mockResolvedValue({ id: 1, name: 'Test' });
    await controller.profile(req, res);
    expect(res.render).toHaveBeenCalledWith('pages/profile.njk', { client: { id: 1, name: 'Test' } });
  });

  test('profile should handle not authenticated', async () => {
    req.session = {};
    await controller.profile(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'Please login to view your profile');
    expect(res.redirect).toHaveBeenCalledWith('/auth/login');
  });

  test('profile should handle client not found', async () => {
    req.session = { clientId: 1 };
    authService.getClientProfile.mockResolvedValue(null);
    await controller.profile(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'Please login to view your profile');
    expect(res.redirect).toHaveBeenCalledWith('/auth/login');
  });

  test('profile should handle error', async () => {
    req.session = { clientId: 1 };
    authService.getClientProfile.mockRejectedValue(new Error('fail'));
    await controller.profile(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'Please login to view your profile');
    expect(res.redirect).toHaveBeenCalledWith('/auth/login');
  });

  test('editProfile should render edit-profile if authenticated', async () => {
    req.session = { clientId: 1 };
    authService.getClientProfile.mockResolvedValue({ id: 1, name: 'Test' });
    await controller.editProfile(req, res);
    expect(res.render).toHaveBeenCalledWith('pages/edit-profile.njk', expect.objectContaining({ title: 'Edit Profile', client: { id: 1, name: 'Test' } }));
  });

  test('editProfile should handle not authenticated', async () => {
    req.session = {};
    await controller.editProfile(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'Please login to edit your profile');
    expect(res.redirect).toHaveBeenCalledWith('/auth/login');
  });

  test('editProfile should handle error', async () => {
    req.session = { clientId: 1 };
    authService.getClientProfile.mockRejectedValue(new Error('fail'));
    await controller.editProfile(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'fail');
    expect(res.redirect).toHaveBeenCalledWith('/profile');
  });

  test('processEditProfile should update and redirect if authenticated', async () => {
    req.session = { clientId: 1 };
    req.body = { name: 'A', surname: 'B', phone: 'C', address: 'D' };
    authService.updateProfile.mockResolvedValue({ id: 1, name: 'A' });
    await controller.processEditProfile(req, res);
    expect(authService.updateProfile).toHaveBeenCalledWith(1, { name: 'A', surname: 'B', phone: 'C', address: 'D' });
    expect(req.session.client).toEqual({ id: 1, name: 'A' });
    expect(req.flash).toHaveBeenCalledWith('success', 'Profile updated successfully');
    expect(res.redirect).toHaveBeenCalledWith('/profile');
  });

  test('processEditProfile should handle not authenticated', async () => {
    req.session = {};
    await controller.processEditProfile(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'Please login to edit your profile');
    expect(res.redirect).toHaveBeenCalledWith('/auth/login');
  });

  test('processEditProfile should handle error', async () => {
    req.session = { clientId: 1 };
    req.body = { name: 'A', surname: 'B', phone: 'C', address: 'D' };
    authService.updateProfile.mockRejectedValue(new Error('fail'));
    await controller.processEditProfile(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'fail');
    expect(res.redirect).toHaveBeenCalledWith('/profile/edit');
  });

  test('processChangePassword should change password and redirect', async () => {
    req.session = { clientId: 1 };
    req.body = { currentPassword: 'a', newPassword: 'b', confirmPassword: 'b' };
    authService.changePassword.mockResolvedValue();
    await controller.processChangePassword(req, res);
    expect(authService.changePassword).toHaveBeenCalledWith(1, 'a', 'b');
    expect(req.flash).toHaveBeenCalledWith('success', 'Password changed successfully');
    expect(res.redirect).toHaveBeenCalledWith('/profile');
  });

  test('processChangePassword should handle password mismatch', async () => {
    req.session = { clientId: 1 };
    req.body = { currentPassword: 'a', newPassword: 'b', confirmPassword: 'c' };
    await controller.processChangePassword(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'New passwords do not match');
    expect(res.redirect).toHaveBeenCalledWith('/profile/change-password');
  });

  test('processChangePassword should handle error', async () => {
    req.session = { clientId: 1 };
    req.body = { currentPassword: 'a', newPassword: 'b', confirmPassword: 'b' };
    authService.changePassword.mockRejectedValue(new Error('fail'));
    await controller.processChangePassword(req, res);
    expect(req.flash).toHaveBeenCalledWith('error', 'fail');
    expect(res.redirect).toHaveBeenCalledWith('/profile/change-password');
  });

  test('debug should return clients as json', async () => {
    const clients = [{ id: 1 }];
    authService.clientRepository.getAll.mockResolvedValue(clients);
    await controller.debug(req, res);
    expect(res.json).toHaveBeenCalledWith(clients);
  });

  test('debug should handle error', async () => {
    authService.clientRepository.getAll.mockRejectedValue(new Error('fail'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await controller.debug(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
    spy.mockRestore();
  });

  test('authMiddleware should redirect if not authenticated', () => {
    isAuthenticated.mockReturnValue(false);
    const next = jest.fn();
    controller.authMiddleware(req, res, next);
    expect(res.redirect).toHaveBeenCalledWith('/auth/login');
  });

  test('authMiddleware should call next if authenticated', () => {
    isAuthenticated.mockReturnValue(true);
    const next = jest.fn();
    controller.authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('AuthController.configureRoutes', () => {
  let app;
  let controller;
  let originalEnv;

  beforeEach(() => {
    app = {
      get: jest.fn(),
      post: jest.fn()
    };
    controller = new AuthController({});
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('should register all main routes', () => {
    process.env.NODE_ENV = 'production';
    controller.configureRoutes(app);
    expect(app.get).toHaveBeenCalledWith('/auth/login', expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/auth/login', expect.anything(), expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/auth/logout', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/auth/register', expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/auth/register', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/profile', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/profile/edit', expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/profile/edit', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/profile/change-password', expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/profile/change-password', expect.any(Function));
    expect(app.get).not.toHaveBeenCalledWith('/auth/debug', expect.any(Function));
  });

  test('should register debug route if not in production', () => {
    process.env.NODE_ENV = 'development';
    controller.configureRoutes(app);
    expect(app.get).toHaveBeenCalledWith('/auth/debug', expect.any(Function));
  });

  test('should execute all route handlers registered in configureRoutes', async () => {
    const controller = new AuthController({
      login: jest.fn(),
      register: jest.fn(),
      getClientProfile: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      clientRepository: { getAll: jest.fn() }
    });
    const req = {
      flash: jest.fn(),
      body: {},
      session: { destroy: jest.fn(cb => cb && cb()) },
      params: {},
      ip: '127.0.0.1',
      path: '/some-path'
    };
    const res = { render: jest.fn(), redirect: jest.fn(), json: jest.fn(), status: jest.fn().mockReturnThis(), locals: {} };

    const app = {
      get: jest.fn((route, handler) => {
        if (typeof handler === 'function') handler(req, res);
      }),
      post: jest.fn((route, ...handlers) => {
        const handler = handlers[handlers.length - 1];
        if (typeof handler === 'function') handler(req, res);
      })
    };

    controller.configureRoutes(app);
  });
});

describe('loginLimiterStore and loginLimiterMessage', () => {
  const { loginLimiterStore, loginLimiterMessage } = require('../authController');

  beforeEach(() => {
    loginLimiterStore.resetAll();
  });

  test('increment should set and increment totalHits and resetTime', () => {
    const key = 'test-key';
    const before = Date.now();
    const result1 = loginLimiterStore.increment(key);
    expect(result1.totalHits).toBe(1);
    expect(result1.resetTime.getTime()).toBeGreaterThanOrEqual(before);
    const result2 = loginLimiterStore.increment(key);
    expect(result2.totalHits).toBe(2);
    expect(result2.resetTime).toEqual(result1.resetTime);
  });

  test('get should return default if no record', () => {
    const key = 'no-record';
    const before = Date.now();
    const result = loginLimiterStore.get(key);
    expect(result.totalHits).toBe(0);
    expect(result.resetTime.getTime()).toBeGreaterThanOrEqual(before);
  });

  test('loginLimiterMessage should return default message if no record', () => {
    const req = { ip: 'no-record' };
    const result = loginLimiterMessage(req);
    expect(result).toBe('Too many login attempts. Please try again later.');
  });

  test('loginLimiterMessage should return message with time left', () => {
    const key = 'ip-1';
    loginLimiterStore.increment(key);
    const record = loginLimiterStore.get(key);
    record.resetTime = new Date(Date.now() + 5 * 60 * 1000);
    const req = { ip: key };
    const result = loginLimiterMessage(req);
    expect(result).toMatch(/Too many login attempts\. Please try again in \d+ minutes\./);
  });

  test('resetKey should delete a record', () => {
    const key = 'reset-key';
    loginLimiterStore.increment(key);
    expect(loginLimiterStore.get(key).totalHits).toBe(1);
    loginLimiterStore.resetKey(key);
    const result = loginLimiterStore.get(key);
    expect(result.totalHits).toBe(0);
  });

  test('get should return the actual record if it exists', () => {
    const key = 'get-key';
    loginLimiterStore.increment(key);
    const result = loginLimiterStore.get(key);
    expect(result.totalHits).toBe(1);
    expect(result.resetTime).toBeInstanceOf(Date);
  });

  test('decrement should return undefined and not throw if key does not exist', () => {
    const key = 'non-existent-key';
    const result = loginLimiterStore.decrement(key);
    expect(result).toBeUndefined();
  });

  test('decrement should decrement totalHits if key exists', () => {
    const key = 'decrement-key';
    loginLimiterStore.increment(key); // totalHits = 1
    loginLimiterStore.increment(key); // totalHits = 2
    loginLimiterStore.decrement(key); // totalHits = 1
    const record = loginLimiterStore.get(key);
    expect(record.totalHits).toBe(1);
  });
});
