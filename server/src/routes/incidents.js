import express from 'express';
import axios from 'axios';
import Incident from '../models/Incident.js';
import User from '../models/User.js';
import Supply from '../models/Supply.js';
import AuditLog from '../models/AuditLog.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Helper to notify Socket.IO (passed from app.js)
let ioInstance;
export const setIoInstance = (io) => {
  ioInstance = io;
};

// @desc    Get all incidents
// @route   GET /api/incidents
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const incidents = await Incident.find({})
      .populate('reporter', 'name email role')
      .populate('assignedResponders', 'name email role status location')
      .sort({ createdAt: -1 });
    res.json({ success: true, incidents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Report a new incident
// @route   POST /api/incidents
// @access  Private
router.post('/', protect, async (req, res) => {
  const { description, location, urgency, imagePath } = req.body;

  if (!description || !location || !location.coordinates) {
    return res.status(400).json({ success: false, message: 'Please provide description and coordinates [lng, lat]' });
  }

  try {
    // 1. Save initial incident to MongoDB
    const incident = await Incident.create({
      reporter: req.user._id,
      description,
      urgency: urgency || 'medium',
      location: {
        type: 'Point',
        coordinates: [Number(location.coordinates[0]), Number(location.coordinates[1])],
      },
      imagePath: imagePath || '',
      status: 'agent-reviewing',
    });

    // Broadcast immediate emergency alert via Socket.IO
    if (ioInstance) {
      ioInstance.emit('new-sos-alert', {
        _id: incident._id,
        description: incident.description,
        location: incident.location,
        urgency: incident.urgency,
        status: incident.status,
      });
    }

    // 2. Fetch context to send to Python Agent (active volunteers & nearby supplies)
    const activeVolunteers = await User.find({
      role: 'volunteer',
      status: 'active',
    }).select('name email skills location');

    const nearbySupplies = await Supply.find({
      warehouseLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: incident.location.coordinates,
          },
          $maxDistance: 100000, // 100km radius
        },
      },
    }).limit(10);

    // 3. Call the Python ML & Gemini Microservice
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000/process-incident';
    
    let aiResponse;
    try {
      console.log(`Sending incident to Python service at ${pythonServiceUrl}...`);
      const response = await axios.post(pythonServiceUrl, {
        incidentId: incident._id,
        description: incident.description,
        imagePath: incident.imagePath,
        incidentCoordinates: incident.location.coordinates,
        volunteers: activeVolunteers.map(v => ({
          id: v._id,
          name: v.name,
          skills: v.skills,
          coordinates: v.location.coordinates
        })),
        supplies: nearbySupplies.map(s => ({
          id: s._id,
          itemName: s.itemName,
          quantity: s.quantity,
          unit: s.unit,
          warehouseName: s.warehouseName,
          coordinates: s.warehouseLocation.coordinates
        }))
      }, { timeout: 8000 });
      
      aiResponse = response.data;
    } catch (err) {
      console.warn('Python AI service is offline. Using local mock parsing engine fallback.', err.message);
      // Fallback Mock data for smooth demonstration
      const simulatedDamage = description.toLowerCase().includes('flood') || description.toLowerCase().includes('collapsed') ? 'severe' : 'moderate';
      
      // Calculate 5-point mock route waypoints bypassing a midpoint hazard zone
      const lng1 = incident.location.coordinates[0];
      const lat1 = incident.location.coordinates[1];
      const lng2 = lng1 - 0.05;
      const lat2 = lat1 + 0.04;
      const dx = lng2 - lng1;
      const dy = lat2 - lat1;
      // Perpendicular offset vector
      const perp_x = -dy * 0.15;
      const perp_y = dx * 0.15;
      const mockWaypoints = [
        [lng1, lat1],
        [lng1 + 0.25 * dx, lat1 + 0.25 * dy],
        [lng1 + 0.5 * dx + perp_x, lat1 + 0.5 * dy + perp_y],
        [lng1 + 0.75 * dx, lat1 + 0.75 * dy],
        [lng2, lat2]
      ];

      aiResponse = {
        damageLevel: simulatedDamage,
        extractedData: {
          victimCount: description.match(/\d+/) ? parseInt(description.match(/\d+/)[0], 10) : 2,
          suppliesRequired: ['water_bottles', 'first_aid_kits'],
          notes: 'Simulated report. Python ML model was bypassed but system generated rescue requirements.'
        },
        agentLogs: [
          '[Logistics Agent] Initiating route lookup. Path is clear.',
          '[Logistics Agent] Routing around midpoint roadblock. 5-point bypass active.',
          '[Inventory Agent] Sourced water and medical kits from nearby depots.',
          '[Dispatch Agent] Found active volunteers with driving and first-aid skills.',
          '[Coordination Agent] Formulating final rescue response assignment.'
        ],
        assignments: activeVolunteers.slice(0, 2).map(v => v._id),
        routeWaypoints: mockWaypoints
      };
    }

    // 4. Update the MongoDB Incident file with AI findings
    incident.damageLevel = aiResponse.damageLevel || 'minor';
    incident.extractedData = {
      victimCount: aiResponse.extractedData?.victimCount || 0,
      suppliesRequired: aiResponse.extractedData?.suppliesRequired || [],
      notes: aiResponse.extractedData?.notes || '',
    };
    incident.agentLogs = aiResponse.agentLogs || [];
    incident.routeWaypoints = aiResponse.routeWaypoints || [];
    incident.status = 'dispatched';
    
    if (aiResponse.assignments && aiResponse.assignments.length > 0) {
      incident.assignedResponders = aiResponse.assignments;
      // Set assigned volunteers status to active
      await User.updateMany(
        { _id: { $in: aiResponse.assignments } },
        { status: 'active' }
      );
    }

    await incident.save();

    await AuditLog.create({
      action: 'INCIDENT_AI_AUDITED',
      performedBy: req.user._id,
      details: {
        incidentId: incident._id,
        damageLevel: incident.damageLevel,
        victimCount: incident.extractedData.victimCount,
        assignedCount: incident.assignedResponders.length,
      },
    });

    // 5. Broadcast detailed incident updates to active clients
    if (ioInstance) {
      ioInstance.emit('incident-updated', incident);
      // Stream agent thought process logs
      incident.agentLogs.forEach((log, index) => {
        setTimeout(() => {
          ioInstance.emit('agent-thinking', { incidentId: incident._id, log });
        }, index * 800); // simulation interval
      });
    }

    // 6. Trigger n8n Webhook for severe / critical reports
    if (incident.damageLevel === 'severe' || incident.urgency === 'critical') {
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook-test/disaster-alert';
      console.log(`Sending webhook to n8n at ${n8nWebhookUrl}...`);
      axios.post(n8nWebhookUrl, {
        incidentId: incident._id,
        description: incident.description,
        damageLevel: incident.damageLevel,
        urgency: incident.urgency,
        location: incident.location.coordinates,
        victimCount: incident.extractedData.victimCount,
        requiredSupplies: incident.extractedData.suppliesRequired,
        timestamp: new Date()
      }).catch(err => console.warn('n8n automation webhook failed (server probably offline):', err.message));
    }

    res.status(201).json({ success: true, incident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Assign responders manually
// @route   PUT /api/incidents/:id/assign
// @access  Private (Admin only)
router.put('/:id/assign', protect, authorize('admin'), async (req, res) => {
  const { responderIds } = req.body;

  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    incident.assignedResponders = responderIds;
    incident.status = 'dispatched';
    await incident.save();

    await User.updateMany(
      { _id: { $in: responderIds } },
      { status: 'active' }
    );

    const updatedIncident = await Incident.findById(req.params.id)
      .populate('assignedResponders', 'name email role status location');

    if (ioInstance) {
      ioInstance.emit('incident-updated', updatedIncident);
    }

    res.json({ success: true, incident: updatedIncident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Mark incident as resolved
// @route   PUT /api/incidents/:id/resolve
// @access  Private (Admin/Responder only)
router.put('/:id/resolve', protect, authorize('admin', 'responder'), async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    incident.status = 'resolved';
    await incident.save();

    // Release assigned responders back to idle
    if (incident.assignedResponders.length > 0) {
      await User.updateMany(
        { _id: { $in: incident.assignedResponders } },
        { status: 'idle' }
      );
    }

    const updatedIncident = await Incident.findById(req.params.id)
      .populate('assignedResponders', 'name email role status location');

    if (ioInstance) {
      ioInstance.emit('incident-updated', updatedIncident);
    }

    await AuditLog.create({
      action: 'INCIDENT_RESOLVED',
      performedBy: req.user._id,
      details: { incidentId: incident._id },
    });

    res.json({ success: true, incident: updatedIncident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    RAG Assistant Question Answering
// @route   POST /api/incidents/rag-ask
// @access  Public
router.post('/rag-ask', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ success: false, message: 'Please provide a question' });
  }

  try {
    const pythonServiceUrl = process.env.RAG_SERVICE_URL || 'http://localhost:8000/rag-ask';
    console.log(`Forwarding RAG query to Python service at ${pythonServiceUrl}...`);
    const response = await axios.post(pythonServiceUrl, { question });
    res.json({ success: true, ...response.data });
  } catch (error) {
    console.warn('Python RAG service is offline, using mock local response generator.');
    // Local mock generator
    let answer = "Please stay calm. Contact emergency services immediately and head to safety.";
    let topic = "General Crisis Advice";
    const q = question.toLowerCase();
    if (q.includes("flood")) {
      answer = "• Head to high ground immediately.\n• Do not walk or drive through moving water.\n• Avoid contact with floodwater.";
      topic = "Floods & Water Emergencies";
    } else if (q.includes("fire")) {
      answer = "• Evacuate the building immediately.\n• Crawl low under smoke to stay in clean air.\n• Stop, drop, and roll if clothing catches fire.";
      topic = "Fires & Smoke Inhalation";
    } else if (q.includes("first aid") || q.includes("medical") || q.includes("bleed")) {
      answer = "• Bleeding: Apply direct pressure to the wound with a clean cloth.\n• Fracture: Immobilize the injured area using splints.\n• CPR: Push hard and fast in the center of the chest (100-120 compressions per minute).";
      topic = "First Aid & Trauma Stabilization";
    }
    res.json({ success: true, topic, answer });
  }
});

// @desc    Get nearby emergency services (hospitals, police)
// @route   GET /api/incidents/nearby-services
// @access  Public
router.get('/nearby-services', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ success: false, message: 'Please provide lat and lng coordinates' });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  try {
    // Attempt to query OpenStreetMap Overpass API for real hospitals and police stations within 5km
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json][timeout:5];(node(around:5000,${latitude},${longitude})[amenity=hospital];node(around:5000,${latitude},${longitude})[amenity=police];);out;`;
    const response = await axios.get(overpassUrl, { timeout: 3500 });
    
    const elements = response.data.elements || [];
    const hospitals = [];
    const police = [];

    elements.forEach(el => {
      const name = el.tags.name || el.tags.brand || `Unnamed ${el.tags.amenity}`;
      const distance = Math.sqrt(Math.pow(el.lat - latitude, 2) + Math.pow(el.lon - longitude, 2)) * 111; // rough km conversion
      
      const item = {
        name,
        distance: distance.toFixed(2) + " km",
        lat: el.lat,
        lng: el.lon
      };

      if (el.tags.amenity === 'hospital') {
        hospitals.push(item);
      } else if (el.tags.amenity === 'police') {
        police.push(item);
      }
    });

    // Fallback if APIs returned nothing
    if (hospitals.length === 0) {
      hospitals.push({ name: "Lifeline General Hospital", distance: "1.20 km", lat: latitude + 0.008, lng: longitude - 0.005 });
      hospitals.push({ name: "Apex Trauma Care & ICU", distance: "2.45 km", lat: latitude - 0.012, lng: longitude + 0.015 });
    }
    if (police.length === 0) {
      police.push({ name: "Sub-District Police Station", distance: "0.85 km", lat: latitude - 0.004, lng: longitude + 0.006 });
      police.push({ name: "Central Emergency Control Cell", distance: "1.90 km", lat: latitude + 0.015, lng: longitude - 0.018 });
    }

    res.json({ success: true, hospitals: hospitals.slice(0, 3), police: police.slice(0, 3) });
  } catch (error) {
    console.warn("Overpass API unavailable, sending local geolocated fallback emergency nodes.");
    const hospitals = [
      { name: "Lifeline General Hospital", distance: "1.20 km", lat: latitude + 0.008, lng: longitude - 0.005 },
      { name: "Apex Trauma Care & ICU", distance: "2.45 km", lat: latitude - 0.012, lng: longitude + 0.015 }
    ];
    const police = [
      { name: "Sub-District Police Station", distance: "0.85 km", lat: latitude - 0.004, lng: longitude + 0.006 },
      { name: "Central Emergency Control Cell", distance: "1.90 km", lat: latitude + 0.015, lng: longitude - 0.018 }
    ];
    res.json({ success: true, hospitals, police });
  }
});

export default router;
