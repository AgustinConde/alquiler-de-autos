const BackupController = require('./controller/backupController');
const BackupService = require('./service/backupService');
const BackupRepository = require('./repository/backupRepository');
const BackupModel = require('./model/backupModel');

function initBackupModule(app, container) {
      /**
   * @type {BackupController} controller
   */
    const controller = container.get('BackupController');
    controller.configureRoutes(app);
}

module.exports = {
    initBackupModule,
    BackupController,
    BackupService,
    BackupRepository,
    BackupModel
};