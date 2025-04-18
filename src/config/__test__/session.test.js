describe('session.js', () => {
  test('should export a defined value', () => {
    const sessionExport = require('../session');
    expect(sessionExport).toBeDefined();
  });
});
