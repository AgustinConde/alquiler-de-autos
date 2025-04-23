const Auth = require('../Auth');

describe('Auth entity', () => {
  test('should create an Auth instance with all properties', () => {
    const auth = new Auth(1, 'user', 'hash', 'admin');
    expect(auth.id).toBe(1);
    expect(auth.username).toBe('user');
    expect(auth.passwordHash).toBe('hash');
    expect(auth.role).toBe('admin');
  });

  test('should default role to client if not provided', () => {
    const auth = new Auth(2, 'other', 'hash2');
    expect(auth.role).toBe('client');
  });
});
