const { formToEntity } = require('../mapper/clientMapper');
const { ClientIdNotDefinedError } = require('../error/clientError');
const { isAdmin } = require('../../auth/middleware/authMiddleware');

class ClientController {
  /**
   * @param {import('../service/clientService')} clientService
   */
  constructor(clientService) {
    this.clientService = clientService;
    this.ADMIN_ROUTE = '/manage/clients';
    this.CLIENT_VIEWS = 'pages/client';
  }

  /**
   * @param {import('express').Application} app
   */
  configureRoutes(app) {
    const ROUTE = this.ADMIN_ROUTE;

    // Admin routes
    app.get(`${ROUTE}`, isAdmin, this.adminIndex.bind(this));
    app.get(`${ROUTE}/:id`, isAdmin, this.view.bind(this));
    app.get(`${ROUTE}/:id/edit`, isAdmin, this.edit.bind(this));
    app.post(`${ROUTE}/:id/edit`, isAdmin, this.update.bind(this));
    app.post(`${ROUTE}/:id/delete`, isAdmin, this.delete.bind(this));
    app.post(`${ROUTE}/:id/make-admin`, isAdmin, this.makeAdmin.bind(this));
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async view(req, res) {
    const { clientId } = req.params;
    if (!Number(clientId)) {
      throw new ClientIdNotDefinedError();
    }

    const client = await this.clientService.getClientById(clientId);
    res.render(`${this.CLIENT_VIEWS}/view.njk`, {
      title: `Viewing Client #${client.id}`,
      client,
      rentals: client.rentals,
    });
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async adminIndex(req, res) {
    try {
      const clients = await this.clientService.getAll();
      res.render('pages/manage/clients/index.njk', {
        title: 'Manage Clients',
        clients
      });
    } catch (error) {
      req.flash('error', 'Error loading clients');
      res.redirect('/');
    }
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async edit(req, res) {
    try {
      const client = await this.clientService.getClientById(req.params.id);
      res.render('pages/manage/clients/edit.njk', { client });
    } catch (error) {
      console.error('Error loading client:', error);
      res.status(500).send('Error loading client');
    }
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async update(req, res) {
    try {
      const clientId = req.params.id;
      const existingClient = await this.clientService.getClientById(clientId);

      const previousState = {
        id: existingClient.id,
        name: existingClient.name,
        surname: existingClient.surname,
        idType: existingClient.idType,
        idNumber: existingClient.idNumber,
        nationality: existingClient.nationality,
        address: existingClient.address,
        phone: existingClient.phone,
        email: existingClient.email,
        password: existingClient.password,
        birthDate: existingClient.birthDate,
        role: existingClient.role,
        createdAt: existingClient.createdAt,
        updatedAt: existingClient.updatedAt,
        deletedAt: existingClient.deletedAt
      };

      await this.clientService.update(clientId, req.body);
      const updatedClient = await this.clientService.getClientById(clientId);
      
      const auditService = req.app.get('container').get('AuditService');
      await auditService.createAuditLog(
        'client',
        clientId,
        'update',
        {
          previous: previousState,
          current: updatedClient
        },
        {
          id: req.session.clientId,
          email: req.session.email || req.session.auth?.username
        }
      );

      req.flash('success', 'Client updated successfully');
      res.redirect(this.ADMIN_ROUTE);
    } catch (error) {
      req.flash('error', error.message);
      res.redirect(`${this.ADMIN_ROUTE}/${req.params.id}/edit`);
    }
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const client = await this.clientService.getClientById(id);

      const auditService = req.app.get('container').get('AuditService');
      await auditService.createAuditLog(
        'client',
        id,
        'delete',
        client,
        req.session.user
      );
      
      await this.clientService.delete(id);
      
      req.flash('success', 'Client deleted successfully');
      res.redirect(this.ADMIN_ROUTE);
    } catch (error) {
      req.flash('error', 'Error deleting client');
      res.redirect(this.ADMIN_ROUTE);
    }
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async add(req, res) {
    res.render(`${this.CLIENT_VIEWS}/add.njk`, {
      title: 'Add New Client',
    });
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async save(req, res) {
    const client = formToEntity(req.body);
    await this.clientService.save(client);
    res.redirect(`${this.ADMIN_ROUTE}`);
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async makeAdmin(req, res) {
    try {
        if (!req.session.clientId || req.session.userRole !== 'admin') {
            req.flash('error', 'You do not have permission to perform this action');
            return res.redirect('/manage/clients');
        }
        const client = await this.clientService.update(req.params.id, { role: 'admin' });
        
        req.flash('success', `Successfully made ${client.email} an admin`);
        res.redirect('/manage/clients');
    } catch (error) {
        req.flash('error', error.message);
        res.redirect('/manage/clients');
    }
  }
}

module.exports = ClientController;
