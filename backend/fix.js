const { Sequelize, DataTypes } = require('sequelize');
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/goldtrader';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: DATABASE_URL.includes('neon.tech') || process.env.NODE_ENV === 'production' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
});

async function fix() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    await sequelize.query('UPDATE "ChallengeData" SET "tradesToday" = 0 WHERE "type" = \'7_DAY\' AND "tradesToday" > 3');
    await sequelize.query('UPDATE "ChallengeData" SET "tradesToday" = 0 WHERE "type" = \'30_DAY\' AND "tradesToday" > 2');
    console.log('Fixed DB');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}
fix();
