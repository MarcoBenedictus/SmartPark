module.exports = (sequelize, DataTypes) => {
    return sequelize.define("parkinglot", {
        name: { type: DataTypes.STRING, allowNull: false },
        capacity: { type: DataTypes.INTEGER, allowNull: false }
    });
};