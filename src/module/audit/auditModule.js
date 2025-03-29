const AuditController = require('./controller/auditController');
const AuditService = require('./service/auditService');
const AuditRepository = require('./repository/auditRepository');
const AuditModel = require('./model/auditModel');

function initAuditModule(app, container) {
  /**
   * @type {AuditController} controller
   */
  const controller = container.get('AuditController');
  controller.configureRoutes(app);
}

module.exports = {
  initAuditModule,
  AuditController,
  AuditService,
  AuditRepository,
  AuditModel
};
