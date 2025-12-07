module.exports = (sequelize, DataTypes) => {
    return sequelize.define("ParkingSlot", {
        slot_number: { type: DataTypes.STRING, allowNull: false },
        status: {
            type: DataTypes.ENUM('AVAILABLE', 'OCCUPIED', 'RESERVED'),
            defaultValue: 'AVAILABLE'
        },
        reservedBy: { type: DataTypes.INTEGER, allowNull: true }
    });
};