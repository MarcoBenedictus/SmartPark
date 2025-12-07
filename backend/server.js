const express = require('express');
const cors = require('cors');
const db = require('./models');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authroutes');
const parkingRoutes = require('./routes/parkingroutes');

app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes);

// Test Route in postman
app.get('/', (req, res) => {
    res.json({ message: "SmartPark API is running..." });
});

const PORT = 5000;

// Sync DB and Start Server
db.sequelize.sync().then(() => {
    console.log("Database Connected and Tables Synced");
    app.listen(PORT, () => {
        console.log(`server running on ${PORT}`);
    });
}).catch(err => {
    console.error("failed to connect to database:", err);
});