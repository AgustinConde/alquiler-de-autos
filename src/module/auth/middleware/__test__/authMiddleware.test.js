const { isAuthenticated, isAdmin } = require('../authMiddleware');

describe('Auth Middleware', () => {
  describe('isAuthenticated', () => {
    test('should call next if user is authenticated', () => {
    const req = {
        session: { 
            clientId: 1,
            auth: { id: 1 }
        },
        path: '/profile',
        flash: jest.fn()
        };
        const res = {
        redirect: jest.fn(),
        locals: {}
        };
      const next = jest.fn();

      isAuthenticated(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    test('should allow access to auth routes even if not authenticated', () => {
    const req = {
        session: {},
        path: '/auth/login',
        flash: jest.fn()
        };
      const res = {
        redirect: jest.fn(),
        locals: {}

      };
      const next = jest.fn();

      isAuthenticated(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    test('should redirect to login if not authenticated', () => {
    const req = {
        session: {},
        path: '/profile',
        originalUrl: '/profile',
        flash: jest.fn()
        };
        const res = {
        redirect: jest.fn(),
        locals: {}
        };
      const next = jest.fn();

      isAuthenticated(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/auth/login');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    test('should call next if user is admin', () => {
      const req = {
        session: { 
          clientId: 1,
          role: 'admin'
        },
        flash: jest.fn()
      };
      const res = {
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        render: jest.fn()
      };
      const next = jest.fn();

      isAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should render 403 if user is not admin', () => {
      const req = {
        session: { 
          clientId: 1,
          role: 'client'
        },
        flash: jest.fn()
      };
      const res = {
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        render: jest.fn()
      };
      const next = jest.fn();

      isAdmin(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/');
      expect(req.flash).toHaveBeenCalledWith('error', 'Access denied: Admin privileges required');
      expect(next).not.toHaveBeenCalled();
    });

    test('should redirect to login if not authenticated', () => {
        const req = {
          session: {},
          flash: jest.fn()
        };
        const res = {
          redirect: jest.fn(),
          status: jest.fn().mockReturnThis(),
          render: jest.fn()
        };
        const next = jest.fn();
  
        isAdmin(req, res, next);
  
        expect(res.redirect).toHaveBeenCalledWith('/auth/login');
        expect(next).not.toHaveBeenCalled();
      });
    });
});