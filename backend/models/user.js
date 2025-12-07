module.exports = (sequelize, DataTypes) => {
    return sequelize.define("user", {
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false },
        role: { type: DataTypes.ENUM('USER', 'ADMIN'), defaultValue: 'USER' }
    });
};