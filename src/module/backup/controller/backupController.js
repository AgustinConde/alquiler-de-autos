const { isAdmin } = require('../../auth/middleware/authMiddleware');

module.exports = class BackupController {
  constructor(backupService) {
    this.backupService = backupService;
    this.ROUTE_BASE = '/manage/backups';
  }

  configureRoutes(app) {
    const ROUTE = this.ROUTE_BASE;
    app.get(`${ROUTE}`, isAdmin, this.index.bind(this));
    app.post(`${ROUTE}/:id/restore`, isAdmin, this.restore.bind(this));
  }

  async index(req, res) {
    try {
      const backups = await this.backupService.getBackups();
      res.render('pages/manage/backups/index.njk', {
        title: 'Backup Management',
        backups
      });
    } catch (error) {
      req.flash('error', 'Error loading backups');
      res.redirect('/manage');
    }
  }

  async restore(req, res) {
    try {
      await this.backupService.restoreBackup(req.params.id);
      req.flash('success', 'Backup restored successfully');
      res.redirect(this.ROUTE_BASE);
    } catch (error) {
      req.flash('error', error.message || 'Error restoring backup');
      res.redirect(this.ROUTE_BASE);
    }
  }
};
