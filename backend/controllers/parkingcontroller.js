const db = require('../models');

// Get all Parking Lots (Malls)
exports.getAllLots = async (req, res) => {
  try {
    const lots = await db.ParkingLot.findAll({
      include: [{
        model: db.ParkingSlot,
        as: 'slots'
      }],
      // ORDER BY: First by Lot ID, then by Slot ID 
      order: [
        ['id', 'ASC'], // Sort Malls (Mall A, Mall B)
        [{ model: db.ParkingSlot, as: 'slots' }, 'id', 'ASC'] // Sort Slots inside the mall
      ]
    });
    res.json(lots);
  } catch (error) {
    res.status(500).json({ message: "Error fetching lots", error: error.message });
  }
};

// Get details for ONE specific Lot (Mall A or B)
exports.getLotDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const lot = await db.ParkingLot.findByPk(id, {
      include: [{ model: db.ParkingSlot, as: 'slots' }]
    });

    if (!lot) return res.status(404).json({ message: "Parking Lot not found" });
    res.json(lot);
  } catch (error) {
    res.status(500).json({ message: "Error fetching details", error: error.message });
  }
};

//
// ADMIN AREA ADMIN AREA ADMIN AREA ADMIN AREA ADMIN AREA ADMIN AREA ADMIN AREA ADMIN AREA 
//

// update a slot status (example is A1 occupied/available)
exports.updateSlotStatus = async (req, res) => {
  try {
    const { id } = req.params; // Slot ID
    const { status } = req.body; // Status

    const slot = await db.ParkingSlot.findByPk(id);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    slot.status = status;
    await slot.save();

    res.json({ message: `Slot ${slot.slot_number} updated to ${status}`, slot });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

// create new parking lot
exports.createLot = async (req, res) => {
  try {
    const { name, capacity } = req.body;

    // create the lot
    const newLot = await db.ParkingLot.create({ name, capacity });

    // generate slots based on input
    const slots = [];
    for (let i = 1; i <= capacity; i++) {
      slots.push({
        slot_number: `${newLot.id}-${i}`,
        status: 'AVAILABLE',
        parkingLotId: newLot.id
      });
    }

    // bulk insert the slots immediately
    await db.ParkingSlot.bulkCreate(slots);

    res.status(201).json({ message: "Parking Lot created with slots", lot: newLot });
  } catch (error) {
    res.status(500).json({ message: "Error creating lot", error: error.message });
  }
};

// delete a parking lot
exports.deleteLot = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.ParkingLot.destroy({ where: { id } });

    if (deleted) {
      res.json({ message: "Parking Lot deleted" });
    } else {
      res.status(404).json({ message: "Lot not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting lot", error: error.message });
  }
};

// update parking lot (name and capacity)
exports.updateLot = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity } = req.body;
    const newCapacity = parseInt(capacity);

    const lot = await db.ParkingLot.findByPk(id);
    if (!lot) return res.status(404).json({ message: "Lot not found" });

    const oldCapacity = lot.capacity;

    // update the lot info
    lot.name = name;
    lot.capacity = newCapacity;
    await lot.save();

    // handle capacity changes
    if (newCapacity > oldCapacity) {
      // GROWTH: Add new slots
      const slotsToAdd = [];
      for (let i = oldCapacity + 1; i <= newCapacity; i++) {
        slotsToAdd.push({
          slot_number: `${lot.id}-${i}`,
          status: 'AVAILABLE',
          parkingLotId: lot.id
        });
      }
      await db.ParkingSlot.bulkCreate(slotsToAdd);

    } else if (newCapacity < oldCapacity) {
      // if lower number, remove excress slot
      const difference = oldCapacity - newCapacity;

      // Find the last (x) slots [this is simplified, in a real web it should check occupancy of the slot first]
      const slotsToRemove = await db.ParkingSlot.findAll({
        where: { parkingLotId: lot.id },
        order: [['id', 'DESC']],
        limit: difference
      });

      // delete them
      const idsToDelete = slotsToRemove.map(s => s.id);
      await db.ParkingSlot.destroy({ where: { id: idsToDelete } });
    }

    res.json({ message: "Lot updated successfully", lot });
  } catch (error) {
    res.status(500).json({ message: "Error updating lot", error: error.message });
  }
};

// optional features B (analytics)
exports.getStats = async (req, res) => {
  try {
    const lots = await db.ParkingLot.findAll({
      include: [{ model: db.ParkingSlot, as: 'slots' }]
    });

    // total system stats declaration
    let totalSlots = 0;
    let totalOccupied = 0;

    // lot stats calc (percentage)
    const lotStats = lots.map(lot => {
      const occupiedCount = lot.slots.filter(s =>
        s.status === 'OCCUPIED' || s.status === 'RESERVED'
      ).length;
      const capacity = lot.capacity;

      totalSlots += capacity;
      totalOccupied += occupiedCount;

      return {
        name: lot.name,
        occupied: occupiedCount,
        available: capacity - occupiedCount,
        capacity: capacity,
        occupancyRate: capacity > 0 ? Math.round((occupiedCount / capacity) * 100) : 0
      };
    });

    const systemStats = {
      totalSlots,
      totalOccupied,
      totalAvailable: totalSlots - totalOccupied,
      occupancyRate: totalSlots > 0 ? Math.round((totalOccupied / totalSlots) * 100) : 0
    };

    res.json({ systemStats, lotStats });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats", error: error.message });
  }
};

//
// USER AREA USER AREA USER AREA USER AREA USER AREA USER AREA USER AREA USER AREA USER AREA USER AREA USER AREA 
//

// optional features A (booking system)

// booking available slot to reserved
exports.bookSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // user token

    const slot = await db.ParkingSlot.findByPk(id);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    if (slot.status !== 'AVAILABLE') {
      return res.status(400).json({ message: "Slot is not available" });
    }

    slot.status = 'RESERVED';
    slot.reservedBy = userId; // lock it for this user
    await slot.save();

    res.json({ message: "Slot Reserved", slot });
  } catch (error) {
    res.status(500).json({ message: "Booking failed", error: error.message });
  }
};

// check in slots reserved to occupied
exports.checkIn = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const slot = await db.ParkingSlot.findByPk(id);

    // only the user who booked the slot can check in
    if (slot.reservedBy !== userId) {
      return res.status(403).json({ message: "You are not the booker" });
    }

    slot.status = 'OCCUPIED';
    await slot.save();

    res.json({ message: "Checked In Successfully", slot });
  } catch (error) {
    res.status(500).json({ message: "Check-in failed", error: error.message });
  }
};

// check out occupied to available
exports.checkOut = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const slot = await db.ParkingSlot.findByPk(id);

    // only the user who booked AND checked in the slot can check out
    if (slot.reservedBy !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: "Not authorized to check out this slot" });
    }

    slot.status = 'AVAILABLE';
    slot.reservedBy = null; // release the lock allowing reuse
    await slot.save();

    res.json({ message: "Check out Successful", slot });
  } catch (error) {
    res.status(500).json({ message: "Check out failed", error: error.message });
  }
};