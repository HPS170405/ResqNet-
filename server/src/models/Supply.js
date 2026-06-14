import mongoose from 'mongoose';

const supplySchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
  },
  unit: {
    type: String, // e.g., 'bottles', 'kits', 'kg'
    required: true,
  },
  warehouseLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  warehouseName: {
    type: String,
    required: true,
    trim: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

supplySchema.index({ warehouseLocation: '2dsphere' });

const Supply = mongoose.model('Supply', supplySchema);
export default Supply;
