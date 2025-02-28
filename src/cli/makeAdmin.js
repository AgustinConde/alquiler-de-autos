const { Sequelize } = require('sequelize');
const AuthModel = require('../module/auth/model/authModel');
const ClientModel = require('../module/client/model/clientModel');
const path = require('path');
require('dotenv').config();

async function makeAdmin(email) {
    try {
        const dbPath = path.join(__dirname, '..', 'data', 'rentalDb.sqlite');
        console.log('Full database path:', dbPath);

        if (!require('fs').existsSync(dbPath)) {
            console.error(`Database file not found at: ${dbPath}`);
            process.exit(1);
        }

        const sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: dbPath,
            logging: msg => console.log('SQL:', msg)
        });

        await sequelize.authenticate();

        const Auth = AuthModel.setup(sequelize);
        const Client = ClientModel.setup(sequelize);
        await sequelize.sync();

        const auth = await Auth.findOne({ where: { username: email } });
        
        if (!auth) {
            console.error(`No auth found with username: ${email}`);
            process.exit(1);
        }

        const clientId = auth.clientId;
        
        // Buscar el cliente
        const client = await Client.findByPk(clientId);
        if (!client) {
            console.error(`No client found with ID: ${clientId}`);
            process.exit(1);
        }

        await client.update({ role: 'admin' });
        console.log(`Successfully made ${email} an admin by updating client #${clientId}`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

const email = process.argv[2];
if (!email) {
    console.error('Usage: node src/cli/makeAdmin.js <email>');
    console.error('Example: node src/cli/makeAdmin.js user@example.com');
    process.exit(1);
}

makeAdmin(email);