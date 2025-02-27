const rentalIsPaid = require('../../rental/entity/RentalIsPaid').isPaid;

module.exports = class DefaultController {

  /**
   * 
   * @param {import('../../rental/service/rentalService')} rentalService
   * @param {import('../../car/service/carService')} carService
   */
  constructor(rentalService, carService) {
    this.ROUTE_BASE = '/';
    this.rentalService = rentalService;
    this.carService = carService;
  }

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async index(req, res) {
    try {
        console.log('📍 Default controller: Starting index action');
        const cars = await this.carService.getAllCars();
        console.log(`✅ Found ${cars?.length || 0} cars`);
        return res.render('default/views/index.njk', { 
            cars,
            title: 'Home'
        });
    } catch (error) {
        console.error('❌ Error in default controller:', error);
        return res.status(500).render('error.njk', { 
            error: {
                message: 'Error loading homepage',
                stack: error.stack
            }
        });
    }
}

  /**
   * @param {import('express').Application} app
   */
  configureRoutes(app) {
    app.get('/', this.index.bind(this));
}

  async rentalProgress(req, res) {
    res.send(`window.RentalIsPaid = ${JSON.stringify(rentalIsPaid)}`);
  }
};
