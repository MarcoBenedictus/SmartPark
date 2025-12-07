const Sequelize = require('sequelize');
const config = require('../config/config.js').development;

const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import Models
db.User = require('./user')(sequelize, Sequelize);
db.ParkingLot = require('./parkinglot')(sequelize, Sequelize);
db.ParkingSlot = require('./parkingslot')(sequelize, Sequelize);

// Define Relations
db.ParkingLot.hasMany(db.ParkingSlot, { 
  as: "slots", 
  foreignKey: "parkingLotId" 
});

db.ParkingSlot.belongsTo(db.ParkingLot, { 
  foreignKey: "parkingLotId", 
  as: "lot" 
});

module.exports = db;