import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  location: {
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
  imagePath: {
    type: String, // Path to uploaded disaster photo
    default: '',
  },
  damageLevel: {
    type: String, // Output of PyTorch Model: 'none', 'minor', 'moderate', 'severe'
    enum: ['none', 'minor', 'moderate', 'severe'],
    default: 'minor',
  },
  extractedData: {
    victimCount: { type: Number, default: 0 },
    suppliesRequired: { type: [String], default: [] }, // e.g. ['water', 'first_aid']
    notes: { type: String, default: '' },
  },
  status: {
    type: String,
    enum: ['reported', 'agent-reviewing', 'dispatched', 'resolved'],
    default: 'reported',
  },
  assignedResponders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  agentLogs: [{
    type: String, // Holds the streaming logs of the AI agents' reasoning
  }],
  routeWaypoints: {
    type: [[Number]], // Array of coordinates: [[lng, lat], ...]
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

incidentSchema.index({ location: '2dsphere' });

const Incident = mongoose.model('Incident', incidentSchema);
export default Incident;
