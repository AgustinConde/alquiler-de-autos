const { isAdmin } = require('../../auth/middleware/authMiddleware');

module.exports = class AuditController {
  constructor(auditService) {
    this.auditService = auditService;
    this.ROUTE_BASE = '/manage/audit-log';
  }

  configureRoutes(app) {
    const ROUTE = this.ROUTE_BASE;
    app.get(`${ROUTE}`, isAdmin, this.index.bind(this));
    app.get(`${ROUTE}/view/:id`, isAdmin, this.viewAuditDetails.bind(this));
    app.post(`${ROUTE}/restore/:id`, isAdmin, this.restore.bind(this));
  }

  async index(req, res) {
    try {
      const auditLogs = await this.auditService.getAuditLogs();
      
      res.render('pages/manage/audit/index.njk', {
        title: 'Audit Log',
        auditLogs,
        ROUTE: this.ROUTE_BASE
      });
    } catch (error) {
      req.flash('error', 'Error loading audit logs');
      res.redirect('/manage');
    }
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async restore(req, res) {
    try {
      const auditId = req.params.id;
      const result = await this.auditService.restoreFromAudit(auditId);
      
      req.flash('success', `${result.message}. The entity has been restored with ID: ${result.entityId}`);
      res.redirect(this.ROUTE_BASE);
    } catch (error) {
      console.error('❌ Error restoring from audit:', error);
      req.flash('error', `Failed to restore: ${error.message}`);
      res.redirect(this.ROUTE_BASE);
    }
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async viewAuditDetails(req, res) {
    try {
      const auditId = req.params.id;
      const auditLog = await this.auditService.getById(auditId);
      
      if (!auditLog) {
        req.flash('error', 'Audit log not found');
        return res.redirect('/manage/audit-log');
      }
      
      let rentals = [];
      let auditData = auditLog.data;
      
      if (typeof auditLog.data === 'string') {
        auditData = JSON.parse(auditLog.data);
      }
      
      if (auditLog.entityType === 'car' && auditData.Rentals) {
        rentals = auditData.Rentals;
        console.log(`Audit ${auditId} contains ${rentals.length} rentals`);
      }
      
      res.render('pages/manage/audit/detail.njk', {
        title: `Audit Details #${auditLog.id}`,
        audit: auditLog,
        auditData,
        rentals,
        ROUTE: this.ROUTE_BASE
      });
    } catch (error) {
      console.error('❌ Error viewing audit details:', error);
      req.flash('error', error.message);
      res.redirect('/manage/audit-log');
    }
  }
};
