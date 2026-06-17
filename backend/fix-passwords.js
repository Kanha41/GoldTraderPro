require('dotenv').config();
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  },
  logging: false
});

async function fixPasswords() {
  try {
    await sequelize.authenticate();
    // Update admin passwords to Admin@123 if they are kanhaiya15 or smrutika26
    await sequelize.query(`UPDATE "Users" SET "rawPassword" = 'Admin@123' WHERE username IN ('kanhaiya15', 'smrutika26')`);
    
    // For others, we can't reverse the hash, but let's set them to '[Encrypted - Please Reset]' so the admin doesn't see a huge hash.
    await sequelize.query(`UPDATE "Users" SET "rawPassword" = '[Reset Required to View]' WHERE "rawPassword" IS NULL AND username NOT IN ('kanhaiya15', 'smrutika26')`);
    
    console.log("Database passwords updated.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixPasswords();
