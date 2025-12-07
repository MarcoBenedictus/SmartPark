const express = require('express');
const router = express.Router();
const controller = require('../controllers/parkingcontroller');

// middleware
const { verifyToken, verifyAdmin } = require('../middleware/authmiddleware');

// Public Routes
router.get('/lots', controller.getAllLots);
router.get('/lots/:id', controller.getLotDetails);

// Admin Routes
router.put('/slots/:id', verifyToken, verifyAdmin, controller.updateSlotStatus); //update
router.post('/lots', verifyToken, verifyAdmin, controller.createLot); //create
router.delete('/lots/:id', verifyToken, verifyAdmin, controller.deleteLot); //delete
router.put('/lots/:id', verifyToken, verifyAdmin, controller.updateLot); //update
// Bonus : Analytics / stats
router.get('/stats', verifyToken, verifyAdmin, controller.getStats);

// BONUSES
// User Routes
router.post('/slots/:id/book', verifyToken, controller.bookSlot);
router.post('/slots/:id/checkin', verifyToken, controller.checkIn);
router.post('/slots/:id/checkout', verifyToken, controller.checkOut);

module.exports = router;