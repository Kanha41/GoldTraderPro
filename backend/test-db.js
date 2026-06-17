const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/goldtrader', { dialect: 'postgres', logging: false });
sequelize.query('SELECT id, username, password, "rawPassword" FROM "Users" LIMIT 5')
  .then(([res]) => { console.log(res); process.exit(0); })
  .catch(e => { console.error(e.message); process.exit(1); });
