const db = require('./models');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
    try {
        console.log('Start database seeding');

        // "Clean State" Wipe everything clean first | force: true drops tables
        await db.sequelize.sync({ force: true });
        console.log('🧹 Database cleared.');

        // create user w/ password hashing for seed data
        const hashedPassword = await bcrypt.hash('secretpass99', 10);

        await db.User.bulkCreate([
            { email: 'admin@smartpark.com', password: hashedPassword, role: 'ADMIN' },
            { email: 'user@smartpark.com', password: hashedPassword, role: 'USER' }
        ]);
        console.log('Users created (password: secretpass99)');

        // create parking lots
        const mallA = await db.ParkingLot.create({ name: 'Mall A - Basement', capacity: 15 });
        const mallB = await db.ParkingLot.create({ name: 'Mall B - Floor 1', capacity: 10 });
        console.log('malls (floors) created.');

        // create slots for mall A (20 slots)
        const slotsA = [];
        for (let i = 1; i <= 15; i++) {
            slotsA.push({
                slot_number: `${mallA.id}-${i}`,
                status: 'AVAILABLE',
                parkingLotId: mallA.id // linked to mall A
            });
        }

        // create slots for mall B (20 slots)
        const slotsB = [];
        for (let i = 1; i <= 10; i++) {
            slotsB.push({
                slot_number: `${mallB.id}-${i}`,
                status: 'AVAILABLE',
                parkingLotId: mallB.id // linked to mall B
            });
        }

        // Bulk insert all slots at once
        await db.ParkingSlot.bulkCreate([...slotsA, ...slotsB]);
        console.log('Parking Slots created.');

        console.log('Seeding complete. Database is ready.');
        process.exit(0); // Exit w/ success seed
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1); // Exit w/ error
    }
};

seedDatabase();