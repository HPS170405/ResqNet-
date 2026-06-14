import express from 'express';
import Supply from '../models/Supply.js';
import AuditLog from '../models/AuditLog.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all supplies
// @route   GET /api/supplies
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const supplies = await Supply.find({});
    res.json({ success: true, supplies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create or update supply stock
// @route   POST /api/supplies
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  const { itemName, quantity, unit, coordinates, warehouseName } = req.body;

  try {
    let supply = await Supply.findOne({ itemName });

    if (supply) {
      // Update existing
      supply.quantity = quantity;
      supply.updatedAt = Date.now();
      await supply.save();
    } else {
      // Create new
      if (!coordinates || coordinates.length !== 2) {
        return res.status(400).json({ success: false, message: 'Valid coordinates [lng, lat] required for new warehouses' });
      }

      supply = await Supply.create({
        itemName,
        quantity,
        unit,
        warehouseLocation: {
          type: 'Point',
          coordinates: [Number(coordinates[0]), Number(coordinates[1])],
        },
        warehouseName,
      });
    }

    await AuditLog.create({
      action: 'SUPPLY_STOCK_UPDATED',
      performedBy: req.user._id,
      details: { itemName, quantity, warehouseName },
    });

    res.status(200).json({ success: true, supply });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get supplies near a coordinate
// @route   GET /api/supplies/nearby
// @access  Private
router.get('/nearby', protect, async (req, res) => {
  const { longitude, latitude, maxDistance = 50000 } = req.query; // default max dist 50km

  if (!longitude || !latitude) {
    return res.status(400).json({ success: false, message: 'Please provide longitude and latitude queries' });
  }

  try {
    const supplies = await Supply.find({
      warehouseLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(longitude), Number(latitude)],
          },
          $maxDistance: Number(maxDistance),
        },
      },
    });

    res.json({ success: true, supplies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
