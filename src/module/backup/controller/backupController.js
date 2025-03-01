const { isAdmin } = require('../../auth/middleware/authMiddleware');

module.exports = class BackupController {
  constructor(backupService) {
    this.backupService = backupService;
    this.ROUTE_BASE = '/manage/backups';
  }

  configureRoutes(app) {
    const ROUTE = this.ROUTE_BASE;
    app.get(`${ROUTE}`, isAdmin, this.index.bind(this));
    app.post(`${ROUTE}/restore/:id`, isAdmin, this.restore.bind(this));
    app.get(`${ROUTE}/view/:id`, isAdmin, this.viewBackupDetails.bind(this));
  }

  async index(req, res) {
    try {
      const backups = await this.backupService.getBackups();
      
      res.render('pages/manage/backups/index.njk', {
        title: 'Backup Management',
        backups,
        ROUTE: this.ROUTE_BASE
      });
    } catch (error) {
      req.flash('error', 'Error loading backups');
      res.redirect('/manage');
    }
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async restore(req, res) {
    try {
      const backupId = req.params.id;
      const result = await this.backupService.restoreBackup(backupId);
      
      req.flash('success', `${result.message}. The entity has been restored with ID: ${result.entityId}`);
      res.redirect(this.ROUTE_BASE);
    } catch (error) {
      console.error('❌ Error restoring backup:', error);
      req.flash('error', `Failed to restore backup: ${error.message}`);
      res.redirect(this.ROUTE_BASE);
    }
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async viewBackupDetails(req, res) {
    try {
      const backupId = req.params.id;
      const backup = await this.backupService.getById(backupId);
      
      if (!backup) {
        req.flash('error', 'Backup not found');
        return res.redirect('/manage/backups');
      }
      
      let rentals = [];
      let backupData = backup.data;
      
      if (typeof backup.data === 'string') {
        backupData = JSON.parse(backup.data);
      }
      
      if (backup.entityType === 'car' && backupData.Rentals) {
        rentals = backupData.Rentals;
        console.log(`Backup ${backupId} contiene ${rentals.length} alquileres`);
      }
      
      res.render('pages/manage/backups/detail.njk', {
        title: `Backup Details #${backup.id}`,
        backup,
        backupData,
        rentals,
        ROUTE: this.ROUTE_BASE
      });
    } catch (error) {
      console.error('❌ Error viewing backup details:', error);
      req.flash('error', error.message);
      res.redirect('/manage/backups');
    }
  }
};
