const { formToEntity } = require('../mapper/clientMapper');
const { ClientIdNotDefinedError } = require('../error/clientError');

module.exports = class ClientController {
  /**
   * @param {import('../service/ClientService')} ClientService
   */
  constructor(ClientService) {
    this.ClientService = ClientService;
    this.ROUTE_BASE = '/account';
    this.USER_VIEWS = 'client/views';
  }

  /**
   * @param {import('express').Application} app
   */
  configureRoutes(app) {
    const ROUTE = this.ROUTE_BASE;
    app.get(`${ROUTE}/manage`, this.manage.bind(this));
    app.get(`${ROUTE}/view/:clientId`, this.view.bind(this));
    app.get(`${ROUTE}/edit/:clientId`, this.edit.bind(this));
    app.get(`${ROUTE}/add`, this.add.bind(this));
    app.post(`${ROUTE}/save`, this.save.bind(this));
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async manage(req, res) {
    const clients = await this.ClientService.getAllClients();
    res.render(`${this.USER_VIEWS}/manage.njk`, {
      title: 'Client List',
      clients,
    });
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

    const client = await this.ClientService.getClientById(clientId);
    res.render(`${this.USER_VIEWS}/view.njk`, {
      title: `Viewing Client #${client.id}`,
      client,
      rentals: client.rentals,
    });
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async edit(req, res) {
    const { clientId } = req.params;
    if (!Number(clientId)) {
      throw new ClientIdNotDefinedError();
    }

    const client = await this.ClientService.getClientById(clientId);
    res.render(`${this.USER_VIEWS}/edit.njk`, {
      title: `Editing client #${client.id}`,
      client,
    });
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  add(req, res) {
    res.render(`${this.USER_VIEWS}/add.njk`, {
      title: 'Add New Client',
    });
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async save(req, res) {
    const client = formToEntity(req.body);
    await this.ClientService.save(client);
    res.redirect(`${this.ROUTE_BASE}/manage`);
  }
};
