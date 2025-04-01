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
      
      if (auditLog.actionType === 'update') {
        if (auditData.previous && auditData.current) {
          if (auditData.previous.birthdate) {
            auditData.previous.birthdate = auditData.previous.birthdate.split('T')[0];
          } else if (auditData.previous.birthDate) {
            auditData.previous.birthDate = auditData.previous.birthDate.split('T')[0];
          }
          
          if (auditData.current.birthdate) {
            auditData.current.birthdate = auditData.current.birthdate.split('T')[0];
          } else if (auditData.current.birthDate) {
            auditData.current.birthDate = auditData.current.birthDate.split('T')[0];
          }
          
          if (auditData.previous.car && typeof auditData.previous.car === 'object') {
            auditData.previous.car = `${auditData.previous.car.brand || ''} ${auditData.previous.car.model || ''}`;
          }
          
          if (auditData.previous.client && typeof auditData.previous.client === 'object') {
            auditData.previous.client = `${auditData.previous.client.name || ''} ${auditData.previous.client.surname || ''}`;
          }
          
          if (auditData.previous.paymentProgress && typeof auditData.previous.paymentProgress === 'object') {
            auditData.previous.paymentProgress = auditData.previous.paymentProgress.name || 
              (auditData.previous.paymentProgress.value === 1 ? 'Paid' : 'Pending');
          }
          
          if (auditData.previous.formattedDates && typeof auditData.previous.formattedDates === 'object') {
            auditData.previous.formattedDates = 
              `${auditData.previous.rentalStart} to ${auditData.previous.rentalEnd}`;
          }
          
          if (auditData.current.car && typeof auditData.current.car === 'object') {
            auditData.current.car = `${auditData.current.car.brand || ''} ${auditData.current.car.model || ''}`;
          }
          
          if (auditData.current.client && typeof auditData.current.client === 'object') {
            auditData.current.client = `${auditData.current.client.name || ''} ${auditData.current.client.surname || ''}`;
          }
          
          if (auditData.current.paymentProgress && typeof auditData.current.paymentProgress === 'object') {
            auditData.current.paymentProgress = auditData.current.paymentProgress.name || 
              (auditData.current.paymentProgress.value === 1 ? 'Paid' : 'Pending');
          }
          
          if (auditData.current.formattedDates && typeof auditData.current.formattedDates === 'object') {
            auditData.current.formattedDates = 
              `${auditData.current.rentalStart} to ${auditData.current.rentalEnd}`;
          }
        }
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
