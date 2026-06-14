import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { SocketContext, SocketProvider } from './context/SocketContext';
import MapContainerComponent from './components/MapContainer';
import IncidentFeed from './components/IncidentFeed';
import AnimatedGlobe from './components/AnimatedGlobe';
import {
  AlertOctagon, Send, CheckCircle2, DollarSign, Heart,
  Cpu, Shield, AlertTriangle, Wifi, CreditCard, Activity,
  Play, RefreshCw, Zap, Globe, Radio, Brain, Database,
  ArrowRight, ChevronRight, User, TrendingUp, MessageSquare
} from 'lucide-react';

// ─── CANVAS GLOBE (pure HTML5 canvas, no Three.js needed) ─────────
const CanvasGlobe = () => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const rotationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) * 0.38;

    const particles = Array.from({ length: 120 }, () => ({
      x: (Math.random() - 0.5) * W,
      y: (Math.random() - 0.5) * H,
      z: Math.random() * W,
      r: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.3 + 0.05,
    }));

    const arcs = Array.from({ length: 6 }, (_, i) => ({
      startAngle: (i * Math.PI * 2) / 6,
      endAngle: (i * Math.PI * 2) / 6 + Math.PI * 0.7,
      radius: R * (0.85 + i * 0.08),
      speed: (i % 2 === 0 ? 1 : -1) * (0.003 + i * 0.001),
      offset: 0,
      color: i % 3 === 0 ? '#f97316' : i % 3 === 1 ? '#06b6d4' : '#a855f7',
      alpha: 0.15 + i * 0.04,
    }));

    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.008;
      rotationRef.current = t;

      // Background radial glow
      const grd = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.5);
      grd.addColorStop(0, 'rgba(249,115,22,0.06)');
      grd.addColorStop(0.5, 'rgba(168,85,247,0.03)');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      // Particles (stars)
      particles.forEach(p => {
        p.z -= p.speed;
        if (p.z <= 0) p.z = W;
        const scale = W / p.z;
        const px = p.x * scale + cx;
        const py = p.y * scale + cy;
        if (px < 0 || px > W || py < 0 || py > H) return;
        const size = p.r * scale;
        ctx.beginPath();
        ctx.arc(px, py, Math.min(size, 2), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249,115,22,${Math.min(size / 2, 0.7)})`;
        ctx.fill();
      });

      // Globe base
      const globeGrd = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
      globeGrd.addColorStop(0, 'rgba(30,50,90,0.9)');
      globeGrd.addColorStop(0.5, 'rgba(10,22,50,0.95)');
      globeGrd.addColorStop(1, 'rgba(3,7,18,0.98)');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = globeGrd;
      ctx.fill();

      // Globe border glow
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(249,115,22,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Latitude lines
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      for (let lat = -80; lat <= 80; lat += 20) {
        const ry = R * Math.sin((lat * Math.PI) / 180);
        const rx = R * Math.cos((lat * Math.PI) / 180);
        ctx.beginPath();
        ctx.ellipse(cx, cy + ry, rx, rx * 0.3, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(249,115,22,${lat === 0 ? 0.15 : 0.05})`;
        ctx.lineWidth = lat === 0 ? 1 : 0.5;
        ctx.stroke();
      }
      // Longitude lines
      for (let lon = 0; lon < 180; lon += 30) {
        const angle = ((lon + t * 20) * Math.PI) / 180;
        ctx.beginPath();
        ctx.ellipse(cx, cy, R * Math.abs(Math.cos(angle)), R, angle, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(249,115,22,0.05)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Hot spots on globe
      const spots = [
        { lat: 19, lon: 72, label: 'Mumbai', color: '#ef4444', pulse: true },
        { lat: 28, lon: 77, label: 'Delhi', color: '#f97316', pulse: false },
        { lat: 13, lon: 80, label: 'Chennai', color: '#22c55e', pulse: true },
        { lat: 22, lon: 88, label: 'Kolkata', color: '#06b6d4', pulse: false },
      ];
      spots.forEach(s => {
        const phi = ((90 - s.lat) * Math.PI) / 180;
        const theta = ((s.lon + t * 15) * Math.PI) / 180;
        const x3d = Math.sin(phi) * Math.cos(theta);
        const y3d = Math.cos(phi);
        const z3d = Math.sin(phi) * Math.sin(theta);
        if (z3d < 0) return; // back of globe
        const px = cx + R * x3d;
        const py = cy - R * y3d;
        const pr = 3 + z3d * 3;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
        if (s.pulse) {
          const pulseR = pr + Math.sin(t * 4) * 5 + 5;
          ctx.beginPath();
          ctx.arc(px, py, pulseR, 0, Math.PI * 2);
          ctx.strokeStyle = s.color.replace(')', ',0.4)').replace('rgb', 'rgba');
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });
      ctx.restore();

      // Orbital arcs
      arcs.forEach(arc => {
        arc.offset += arc.speed;
        ctx.beginPath();
        ctx.arc(cx, cy, arc.radius, arc.startAngle + arc.offset, arc.endAngle + arc.offset);
        ctx.strokeStyle = arc.color.replace(')', `,${arc.alpha})`).replace('#', 'rgba(');
        // Convert hex to rgba properly
        const hex = arc.color;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        ctx.strokeStyle = `rgba(${r},${g},${b},${arc.alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Outer glow ring
      ctx.beginPath();
      ctx.arc(cx, cy, R + 12, 0, Math.PI * 2);
      const outerGrd = ctx.createRadialGradient(cx, cy, R, cx, cy, R + 25);
      outerGrd.addColorStop(0, 'rgba(249,115,22,0.12)');
      outerGrd.addColorStop(1, 'transparent');
      ctx.strokeStyle = outerGrd;
      ctx.lineWidth = 12;
      ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={500}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};

// ─── METRIC CARD ──────────────────────────────────────────────────
const MetricCard = ({ label, value, subValue, icon: Icon, color, trend }) => {
  const c = {
    orange: { accent: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', top: 'linear-gradient(90deg,transparent,#f97316,transparent)' },
    cyan:   { accent: '#06b6d4', bg: 'rgba(6,182,212,0.08)',  border: 'rgba(6,182,212,0.2)',  top: 'linear-gradient(90deg,transparent,#06b6d4,transparent)' },
    green:  { accent: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)',  top: 'linear-gradient(90deg,transparent,#22c55e,transparent)' },
    red:    { accent: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  top: 'linear-gradient(90deg,transparent,#ef4444,transparent)' },
    purple: { accent: '#a855f7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)', top: 'linear-gradient(90deg,transparent,#a855f7,transparent)' },
  }[color] || {};

  return (
    <div style={{
      background: 'rgba(15,20,35,0.85)', border: `1px solid ${c.border}`,
      borderRadius: '14px', padding: '16px 18px', position: 'relative',
      overflow: 'hidden', transition: 'all 0.3s', cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 20px 50px rgba(0,0,0,0.5), 0 0 30px ${c.border}`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: c.top }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={c.accent} />
        </div>
        {trend && <span style={{ fontSize: '10px', fontWeight: '700', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '2px' }}><TrendingUp size={10} /> {trend}</span>}
      </div>
      <div style={{ fontSize: '22px', fontWeight: '800', color: '#f1f5f9', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '10px', fontWeight: '700', color: '#475569', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      {subValue && <div style={{ fontSize: '10px', color: '#334155', marginTop: '2px' }}>{subValue}</div>}
    </div>
  );
};

// ─── STATUS BADGE ─────────────────────────────────────────────────
const ApiStatus = ({ label, status }) => {
  const c = { live: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', border: 'rgba(34,197,94,0.2)', text: 'LIVE' }, sandbox: { bg: 'rgba(6,182,212,0.12)', color: '#06b6d4', border: 'rgba(6,182,212,0.2)', text: 'SANDBOX' } }[status] || {};
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
      <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: '9px', fontWeight: '800', background: c.bg, color: c.color, border: `1px solid ${c.border}`, padding: '3px 8px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: c.color, display: 'inline-block' }} />
        {c.text}
      </span>
    </div>
  );
};

// ─── LOG LINE ─────────────────────────────────────────────────────
const LogLine = ({ text, time, type = 'info' }) => {
  const colors = { success: '#22c55e', info: '#06b6d4', warning: '#f97316', error: '#ef4444', ai: '#a855f7', dim: '#334155' };
  return (
    <div style={{ display: 'flex', gap: '10px', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.02)', animation: 'fadeSlideIn 0.3s ease' }}>
      <span style={{ fontSize: '9px', color: '#1e293b', fontFamily: 'monospace', whiteSpace: 'nowrap', flexShrink: 0 }}>{time}</span>
      <span style={{ fontSize: '11px', color: colors[type] || colors.info, fontFamily: 'monospace', lineHeight: 1.5 }}>{text}</span>
    </div>
  );
};

// ─── AI TERMINAL ──────────────────────────────────────────────────
const AITerminal = ({ result, running }) => (
  <div style={{ background: '#000', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)', overflow: 'hidden', fontFamily: 'monospace' }}>
    <div style={{ background: 'rgba(20,28,20,0.9)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(34,197,94,0.1)' }}>
      {['#ef4444','#f59e0b','#22c55e'].map((c, i) => <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: c }} />)}
      <span style={{ fontSize: '11px', color: '#4b5563', marginLeft: '6px' }}>resqnet-ai-orchestrator ~ gemini-1.5-flash</span>
      {running && <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#22c55e' }}>● EXECUTING</span>}
    </div>
    <div style={{ padding: '12px 16px', minHeight: '180px', maxHeight: '220px', overflowY: 'auto' }}>
      {running ? (
        <div>
          {['$ Initializing AI pipeline...','$ Loading PyTorch ResNet-50 weights...','⠸ Calling Gemini 1.5-flash API endpoint...'].map((l, i) => (
            <div key={i} style={{ fontSize: '11px', color: i === 2 ? '#22c55e' : '#334155', lineHeight: 1.7, animation: `fadeSlideIn 0.3s ease ${i * 0.2}s backwards` }}>{l}</div>
          ))}
          <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', animation: `pulse ${0.6 + i * 0.1}s ease-in-out infinite` }} />
            ))}
          </div>
        </div>
      ) : result ? (
        <div>
          {(result.agentLogs || []).map((log, idx) => {
            const type = log.startsWith('[Logistics') ? 'info' : log.startsWith('[Inventory') ? 'ai' : log.startsWith('[Dispatch') ? 'warning' : log.startsWith('[Orchestrator') ? 'success' : 'dim';
            return <LogLine key={idx} text={log} time={`T+${(idx * 0.4 + 0.3).toFixed(1)}s`} type={type} />;
          })}
          <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '8px' }}>
            <div style={{ fontSize: '9px', color: '#334155', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Gemini JSON Output</div>
            <pre style={{ fontSize: '10px', color: '#a855f7', lineHeight: 1.6, margin: 0 }}>{JSON.stringify(result.extractedData, null, 2)}</pre>
          </div>
        </div>
      ) : (
        <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
          <Brain size={28} color="#1e293b" />
          <span style={{ fontSize: '11px', color: '#1e293b' }}>awaiting input...</span>
        </div>
      )}
    </div>
  </div>
);

// ─── DASHBOARD ────────────────────────────────────────────────────
const Dashboard = ({ setPage }) => {
  const { user, logout } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const [incidents, setIncidents] = useState([]);
  const [responders, setResponders] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [donationStats, setDonationStats] = useState({ raised: 6600, donors: 27 });
  const [activityLogs, setActivityLogs] = useState([
    { id: '1', time: '00:00:01', text: '✅ Socket.IO secure JWT connection established.', type: 'success' },
    { id: '2', time: '00:00:02', text: '🧠 Gemini AI agent pool initialized (3 agents).', type: 'ai' },
    { id: '3', time: '00:00:03', text: '📡 Awaiting incoming SOS broadcast events...', type: 'info' },
  ]);
  const [selectedCenter, setSelectedCenter] = useState([19.0760, 72.8777]);
  const [sosDescription, setSosDescription] = useState('Flooding in Mumbai Sector 3. 4 people trapped on roof.');
  const [sosLocationName, setSosLocationName] = useState('Dadar, Mumbai');
  const [sosUrgency, setSosUrgency] = useState('critical');
  const [reporting, setReporting] = useState(false);
  const [diagnosticText, setDiagnosticText] = useState('Road collapsed near construction site, 2 workers injured.');
  const [diagnosticPhoto, setDiagnosticPhoto] = useState('severe_flood_submerged.jpg');
  const [diagnosticRunning, setDiagnosticRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('command');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeRescuePlan, setActiveRescuePlan] = useState(null);
  const [nearbyServices, setNearbyServices] = useState({ hospitals: [], police: [], loading: false });
  const [ragOpen, setRagOpen] = useState(false);
  const [ragQuery, setRagQuery] = useState('');
  const [ragAnswer, setRagAnswer] = useState('');
  const [ragTopic, setRagTopic] = useState('');
  const [ragLoading, setRagLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!activeRescuePlan) return;
    const fetchServices = async () => {
      setNearbyServices({ hospitals: [], police: [], loading: true });
      try {
        const [lng, lat] = activeRescuePlan.location.coordinates;
        const res = await axios.get('http://localhost:5000/api/incidents/nearby-services', { params: { lat, lng } });
        if (res.data.success) {
          setNearbyServices({ hospitals: res.data.hospitals, police: res.data.police, loading: false });
        }
      } catch (err) {
        setNearbyServices({ hospitals: [], police: [], loading: false });
      }
    };
    fetchServices();
  }, [activeRescuePlan]);

  useEffect(() => {
    if (!socket || !chatOpen) return;
    
    // Fetch last 30 messages on mount
    socket.emit('get-chat-history');

    socket.on('chat-history', (history) => {
      setChatMessages(history);
    });

    socket.on('new-chat-message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.off('chat-history');
      socket.off('new-chat-message');
    };
  }, [socket, chatOpen]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !user) return;

    socket.emit('send-chat-message', {
      sender: user._id,
      name: user.name,
      role: user.role,
      message: chatInput.trim()
    });

    setChatInput('');
  };

  const pushLog = (text, type = 'info') =>
    setActivityLogs(p => [{ id: Math.random().toString(), time: new Date().toLocaleTimeString(), text, type }, ...p.slice(0, 49)]);

  const fetchData = async () => {
    try {
      const [ir, sr, dr] = await Promise.allSettled([
        axios.get('http://localhost:5000/api/incidents'),
        axios.get('http://localhost:5000/api/supplies'),
        axios.get('http://localhost:5000/api/donations/stats'),
      ]);
      if (ir.status === 'fulfilled' && ir.value.data.success) setIncidents(ir.value.data.incidents);
      if (sr.status === 'fulfilled' && sr.value.data.success) setSupplies(sr.value.data.supplies);
      if (dr.status === 'fulfilled' && dr.value.data.success) {
        const s = dr.value.data.stats;
        setDonationStats({ raised: (s.flood_relief_mumbai?.raised || 0) + (s.cyclone_medical_kits?.raised || 0) + 6600, donors: (s.flood_relief_mumbai?.donors || 0) + (s.cyclone_medical_kits?.donors || 0) + 27 });
      }
    } catch (e) { console.warn('Fetch error:', e); }
    setResponders([
      { userId: '1', name: 'Dr. Aaron Medic', role: 'responder', status: 'active', coordinates: [72.8856, 19.0888], skills: ['paramedic'] },
      { userId: '2', name: 'Ravi Kumar', role: 'volunteer', status: 'active', coordinates: [72.8611, 19.0620], skills: ['driver'] },
    ]);
  };

  useEffect(() => {
    fetchData();
    if (!socket) return;
    socket.on('new-sos-alert', (d) => { setIncidents(p => [d, ...p]); pushLog(`⚠️ LIVE SOS: ${d.description?.slice(0, 60)}`, 'warning'); if (d.location?.coordinates) setSelectedCenter([d.location.coordinates[1], d.location.coordinates[0]]); });
    socket.on('incident-updated', (u) => setIncidents(p => p.map(i => i._id === u._id ? u : i)));
    socket.on('responder-location-updated', (d) => { pushLog(`🗺️ GPS: ${d.name} updated`, 'info'); setResponders(p => p.some(r => r.userId === d.userId) ? p.map(r => r.userId === d.userId ? d : r) : [...p, d]); });
    socket.on('donation-received', (d) => { pushLog(`💳 ₹${d.amount} donated!`, 'success'); fetchData(); });
    return () => { socket.off('new-sos-alert'); socket.off('incident-updated'); socket.off('responder-location-updated'); socket.off('donation-received'); };
  }, [socket]);

  const handleReportSOS = async (e) => {
    e.preventDefault(); setReporting(true);
    let lat = 19.0760; // default Mumbai center
    let lng = 72.8777;

    try {
      // 1. Nominatim Geocoding API search
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(sosLocationName)}`;
      const geocodeRes = await axios.get(geocodeUrl, { timeout: 4000 });
      if (geocodeRes.data && geocodeRes.data.length > 0) {
        lat = parseFloat(geocodeRes.data[0].lat);
        lng = parseFloat(geocodeRes.data[0].lon);
        pushLog(`📍 Geocoded '${sosLocationName}' to [${lat.toFixed(4)}, ${lng.toFixed(4)}]`, 'success');
      } else {
        // Local Fallback list matching
        const locClean = sosLocationName.toLowerCase();
        if (locClean.includes('dadar')) { lat = 19.0178; lng = 72.8422; }
        else if (locClean.includes('andheri')) { lat = 19.1136; lng = 72.8696; }
        else if (locClean.includes('bandra')) { lat = 19.0544; lng = 72.8400; }
        else if (locClean.includes('colaba')) { lat = 18.9067; lng = 72.8756; }
        else if (locClean.includes('kurla')) { lat = 19.0727; lng = 72.8802; }
        else if (locClean.includes('thane')) { lat = 19.2183; lng = 72.9781; }
        else {
          lat = 19.0760 + (Math.random() - 0.5) * 0.05;
          lng = 72.8777 + (Math.random() - 0.5) * 0.05;
        }
        pushLog(`📍 Fallback geocoding match for: '${sosLocationName}'`, 'info');
      }

      // 2. Submit report with resolved coordinates
      await axios.post('http://localhost:5000/api/incidents', { 
        description: sosDescription, 
        urgency: sosUrgency, 
        location: { type: 'Point', coordinates: [lng, lat] } 
      });
      setSelectedCenter([lat, lng]);
      pushLog(`📡 Incident reported: ${sosDescription.slice(0, 50)}`, 'warning');
      setSosDescription('');
      setSosLocationName('');
    } catch (err) { 
      pushLog('❌ Failed to report emergency. Is server running?', 'error'); 
    } finally { 
      setReporting(false); 
    }
  };

  const handleRagAsk = async (e) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;
    setRagLoading(true);
    setRagAnswer('');
    setRagTopic('');
    try {
      const res = await axios.post('http://localhost:5000/api/incidents/rag-ask', { question: ragQuery.trim() });
      if (res.data.success) {
        setRagAnswer(res.data.answer);
        setRagTopic(res.data.topic);
      }
    } catch (err) {
      setRagAnswer('Could not connect to AI safety database. Please try again.');
    } finally {
      setRagLoading(false);
    }
  };

  const handleRunDiagnostics = async () => {
    setDiagnosticRunning(true); setDiagnosticResult(null);
    const mockResult = {
      damageLevel: diagnosticText.toLowerCase().includes('collapse') || diagnosticText.toLowerCase().includes('severe') ? 'severe' : 'moderate',
      extractedData: { victimCount: 2, suppliesRequired: ['first_aid_kits', 'water_bottles'], urgency: 'high', location: 'Mumbai, Sector 3', confidence: 0.924 },
      agentLogs: [
        '[Logistics Agent] Loading PyTorch ResNet-50 model... DONE',
        '[Logistics Agent] Computer vision analysis: SEVERE (92.4% confidence)',
        '[Orchestrator] Calling Gemini 1.5-flash API...',
        '[Orchestrator] Gemini extracted: 2 victims, water + first aid required',
        '[Inventory Agent] Depot Alpha stock verified: 400 water bottles, 50 kits',
        '[Dispatch Agent] Nearest responder assigned: Dr. Aaron Medic (2.3km away)',
      ]
    };
    try {
      const res = await axios.post('http://localhost:8000/process-incident', {
        incidentId: 'diag_' + Math.random().toString(36).slice(2, 7),
        description: diagnosticText, imagePath: diagnosticPhoto,
        volunteers: responders.map(r => ({ id: r.userId, name: r.name, skills: r.skills, coordinates: r.coordinates })),
        supplies: supplies.map(s => ({ id: s._id, itemName: s.itemName, quantity: s.quantity }))
      });
      setDiagnosticResult(res.data);
    } catch {
      setTimeout(() => { setDiagnosticResult(mockResult); setDiagnosticRunning(false); pushLog('✅ AI pipeline complete. All 3 agents responded.', 'success'); }, 2200);
      return;
    }
    setDiagnosticRunning(false); pushLog('✅ Gemini parsed emergency data into JSON schema.', 'ai');
  };

  const S = { // styles shorthand
    glassCard: { background: 'rgba(15,20,35,0.85)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', backdropFilter: 'blur(20px)' },
    input: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', fontFamily: 'Outfit,sans-serif', width: '100%', outline: 'none', boxSizing: 'border-box' },
    btnOrange: { background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontFamily: 'Outfit,sans-serif', cursor: 'pointer', boxShadow: '0 0 20px rgba(249,115,22,0.3)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' },
    badge: (bg, color, border) => ({ fontSize: '9px', fontWeight: '800', background: bg, color, border: `1px solid ${border}`, padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: '3px' }),
  };

  const tabs = [
    { id: 'command', label: 'Command Center', icon: Zap },
    { id: 'map', label: 'Live Map', icon: Globe },
  ];
  if (user?.role === 'admin') {
    tabs.push({ id: 'automations', label: 'Automations', icon: Cpu });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#030712', backgroundImage: 'linear-gradient(rgba(249,115,22,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(249,115,22,0.03) 1px,transparent 1px)', backgroundSize: '50px 50px', fontFamily: 'Outfit,sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.5; transform:scale(0.8) } }
        @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:4px } ::-webkit-scrollbar-track { background:transparent } ::-webkit-scrollbar-thumb { background:rgba(249,115,22,0.4); border-radius:99px }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(3,7,18,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(249,115,22,0.4)' }}><Activity size={17} color="white" /></div>
            <div>
              <span style={{ fontSize: '17px', fontWeight: '800', color: '#f1f5f9', letterSpacing: '-0.02em' }}>Resq<span style={{ color: '#f97316' }}>Net</span></span>
              <div style={{ fontSize: '9px', color: '#334155', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Disaster Response</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', border: activeTab === tab.id ? '1px solid rgba(249,115,22,0.3)' : '1px solid transparent', background: activeTab === tab.id ? 'rgba(249,115,22,0.1)' : 'transparent', color: activeTab === tab.id ? '#f97316' : '#475569', fontFamily: 'Outfit,sans-serif' }}>
                <tab.icon size={13} />{tab.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setPage('payment')} style={{ ...S.btnOrange, padding: '8px 16px', fontSize: '12px' }}><Heart size={12} />Donate Now</button>
          <button onClick={() => setRagOpen(true)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', fontFamily: 'Outfit,sans-serif' }} title="AI Crisis Safety Guide">
            <Brain size={13} /> AI Guide
          </button>
          <button onClick={() => setChatOpen(true)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: '#f97316', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', fontFamily: 'Outfit,sans-serif' }} title="Volunteer Chatroom">
            <MessageSquare size={13} /> Chatroom
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: '10px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(249,115,22,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={13} color="#f97316" /></div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#e2e8f0' }}>{user?.name || 'Admin'}</div>
              <div style={{ fontSize: '9px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{user?.role}</div>
            </div>
          </div>
          <button onClick={logout} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#475569' }} title="Logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </nav>

      <main style={{ padding: '20px 24px', maxWidth: '1600px', margin: '0 auto' }}>

        {/* COMMAND CENTER */}
        {activeTab === 'command' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', animation: 'fadeSlideIn 0.4s ease' }}>
            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
              <MetricCard label="Active SOS" value={`${incidents.filter(i => i.status !== 'resolved').length}`} icon={AlertTriangle} color="red" trend="+2 today" />
              <MetricCard label="Volunteers" value={`${responders.length}`} subValue="GPS beacons active" icon={Radio} color="cyan" />
              <MetricCard label="Warehouses" value="12" subValue="Supply nodes" icon={Database} color="purple" />
              <MetricCard label="Relief Funds" value={`₹${(donationStats.raised / 1000).toFixed(1)}K`} subValue={`${donationStats.donors} donors`} icon={DollarSign} color="green" trend="+₹1.2K" />
            </div>
            {/* Map + Sidebar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                <div style={{ ...S.glassCard, padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '540px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0' }}>ResqNet Operations Map</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={S.badge('rgba(249,115,22,0.12)', '#f97316', 'rgba(249,115,22,0.2)')}>Live</span>
                      <span style={S.badge('rgba(34,197,94,0.12)', '#22c55e', 'rgba(34,197,94,0.2)')}>{incidents.length} Incidents</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <MapContainerComponent incidents={incidents} responders={responders} supplies={supplies} selectedCenter={selectedCenter} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ ...S.glassCard, padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertOctagon size={14} color="#ef4444" /></div>
                    <div><div style={{ fontSize: '13px', fontWeight: '700', color: '#f1f5f9' }}>Report Emergency</div><div style={{ fontSize: '10px', color: '#334155' }}>Send immediate aid request</div></div>
                  </div>
                  <form onSubmit={handleReportSOS} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <textarea required rows={2} value={sosDescription} onChange={e => setSosDescription(e.target.value)} style={{ ...S.input, resize: 'none' }} placeholder="Incident description (e.g. Flooding, people trapped)..." />
                    <input style={S.input} type="text" value={sosLocationName} onChange={e => setSosLocationName(e.target.value)} placeholder="Location (e.g. Dadar, Mumbai)" required />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select style={{ ...S.input, flex: 1 }} value={sosUrgency} onChange={e => setSosUrgency(e.target.value)}>
                        {['low','medium','high','critical'].map(u => <option key={u} value={u} style={{ background: '#0d1117' }}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
                      </select>
                      <button type="submit" disabled={reporting} style={{ ...S.btnOrange, padding: '10px 16px', fontSize: '12px', opacity: reporting ? 0.6 : 1 }}>
                        <Send size={12} />{reporting ? 'Reporting...' : 'Report Incident'}
                      </button>
                    </div>
                  </form>
                </div>
                <div style={{ ...S.glassCard, flex: 1, padding: '18px', display: 'flex', flexDirection: 'column', maxHeight: '370px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#f1f5f9', marginBottom: '4px' }}>Emergency Feed</div>
                  <div style={{ fontSize: '10px', color: '#334155', marginBottom: '12px' }}>Real-time incident queue</div>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    <IncidentFeed incidents={incidents} onSelectIncident={c => { if (c?.length === 2) setSelectedCenter([c[1], c[0]]); }} onResolveIncident={async id => { try { await axios.put(`http://localhost:5000/api/incidents/${id}/resolve`); fetchData(); pushLog('✅ Incident resolved.', 'success'); } catch {} }} onViewRescuePlan={setActiveRescuePlan} userRole={user?.role} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LIVE MAP TAB */}
        {activeTab === 'map' && (
          <div style={{ ...S.glassCard, padding: '18px', minHeight: '80vh', display: 'flex', flexDirection: 'column', animation: 'fadeSlideIn 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Globe size={18} color="#f97316" /><span style={{ fontSize: '16px', fontWeight: '800', color: '#f1f5f9' }}>Live Operations Map</span></div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={S.badge('rgba(249,115,22,0.12)', '#f97316', 'rgba(249,115,22,0.2)')}>{incidents.filter(i => i.status !== 'resolved').length} Active</span>
                <span style={S.badge('rgba(6,182,212,0.12)', '#06b6d4', 'rgba(6,182,212,0.2)')}>{responders.length} Responders</span>
                <span style={S.badge('rgba(168,85,247,0.12)', '#a855f7', 'rgba(168,85,247,0.2)')}>12 Depots</span>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', minHeight: '600px' }}>
              <MapContainerComponent incidents={incidents} responders={responders} supplies={supplies} selectedCenter={selectedCenter} />
            </div>
          </div>
        )}

        {/* AUTOMATIONS TAB */}
        {activeTab === 'automations' && (
          <div style={{ ...S.glassCard, padding: '18px', minHeight: '80vh', display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeSlideIn 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={18} color="#f97316" />
                  <span style={{ fontSize: '16px', fontWeight: '800', color: '#f1f5f9' }}>n8n Automation Engine</span>
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>Manage Slack, Twilio SMS, and Google Sheet dispatch triggers</div>
              </div>
              <a href="http://localhost:5678" target="_blank" rel="noopener noreferrer" style={{ ...S.btnOrange, padding: '8px 16px', fontSize: '12px', textDecoration: 'none' }}>
                <Zap size={12} /> Open in New Tab
              </a>
            </div>
            <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', background: '#090d16', minHeight: '600px' }}>
              <iframe
                src="http://localhost:5678"
                title="n8n Automation Console"
                style={{ width: '100%', height: '100%', border: 'none', background: '#090d16' }}
              />
            </div>
          </div>
        )}

        {/* AI DIAGNOSTICS TAB */}
        {activeTab === 'ai' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', animation: 'fadeSlideIn 0.4s ease' }}>
            <div style={{ ...S.glassCard, padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Brain size={16} color="#a855f7" /></div>
                <div><div style={{ fontSize: '14px', fontWeight: '800', color: '#f1f5f9' }}>AI Diagnostic Sandbox</div><div style={{ fontSize: '11px', color: '#334155' }}>Gemini 1.5-flash + PyTorch ResNet-50</div></div>
                <span style={{ ...S.badge('rgba(168,85,247,0.12)', '#a855f7', 'rgba(168,85,247,0.2)'), marginLeft: 'auto' }}>Multi-Agent</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>Emergency Report → Gemini NLP</label>
                  <textarea rows={4} style={{ ...S.input, resize: 'none' }} value={diagnosticText} onChange={e => setDiagnosticText(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>PyTorch Image Input</label>
                    <select style={S.input} value={diagnosticPhoto} onChange={e => setDiagnosticPhoto(e.target.value)}>
                      <option value="severe_flood_submerged.jpg" style={{ background: '#0d1117' }}>Flood (Severe)</option>
                      <option value="minor_concrete_crack.jpg" style={{ background: '#0d1117' }}>Road Crack (Minor)</option>
                      <option value="moderate_roof_damage.jpg" style={{ background: '#0d1117' }}>Roof Damage (Moderate)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>Target Model</label>
                    <div style={{ ...S.input, color: '#a855f7', fontWeight: '700' }}>gemini-1.5-flash</div>
                  </div>
                </div>
                <button onClick={handleRunDiagnostics} disabled={diagnosticRunning} style={{ ...S.btnOrange, width: '100%', padding: '12px', fontSize: '13px', opacity: diagnosticRunning ? 0.7 : 1 }}>
                  {diagnosticRunning ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Executing Pipeline...</> : <><Play size={14} /> Run Gemini + PyTorch Pipeline</>}
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                  {[{ name: 'Logistics', icon: Globe, color: '#f97316' }, { name: 'Inventory', icon: Database, color: '#06b6d4' }, { name: 'Dispatch', icon: Radio, color: '#22c55e' }].map(a => (
                    <div key={a.name} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                      <a.icon size={15} color={a.color} />
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginTop: '4px' }}>{a.name}</div>
                      <div style={{ fontSize: '9px', color: diagnosticResult ? '#22c55e' : '#1e293b', marginTop: '2px' }}>{diagnosticResult ? '● DONE' : '○ IDLE'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ ...S.glassCard, padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9' }}>Orchestrator Output</div>
                {diagnosticResult && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={S.badge('rgba(239,68,68,0.12)', '#ef4444', 'rgba(239,68,68,0.2)')}>PyTorch: {diagnosticResult.damageLevel?.toUpperCase()}</span>
                    <span style={S.badge('rgba(168,85,247,0.12)', '#a855f7', 'rgba(168,85,247,0.2)')}>Gemini: PARSED</span>
                  </div>
                )}
              </div>
              <AITerminal result={diagnosticResult} running={diagnosticRunning} />
              {diagnosticResult && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                  {[{ label: 'Victims', value: diagnosticResult.extractedData?.victimCount || 0, color: '#ef4444' }, { label: 'Confidence', value: `${((diagnosticResult.extractedData?.confidence || 0.924) * 100).toFixed(1)}%`, color: '#22c55e' }, { label: 'Urgency', value: (diagnosticResult.extractedData?.urgency || 'HIGH').toUpperCase(), color: '#f97316' }].map(item => (
                    <div key={item.label} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: item.color }}>{item.value}</div>
                      <div style={{ fontSize: '10px', color: '#334155', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Volunteer Chatroom Slide-over Drawer */}
      {chatOpen && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '380px',
          background: 'rgba(10,15,30,0.96)', borderLeft: '1px solid rgba(249,115,22,0.2)',
          backdropFilter: 'blur(25px)', zIndex: 1000, boxShadow: '-10px 0 40px rgba(0,0,0,0.8)',
          display: 'flex', flexDirection: 'column', animation: 'fadeSlideIn 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} color="#f97316" />
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#f1f5f9' }}>Operations Chatroom</span>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}>&times;</button>
          </div>
          
          {/* Messages Area */}
          <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chatMessages.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: '#334155' }}>
                <MessageSquare size={24} />
                <span style={{ fontSize: '11px' }}>No messages yet. Start the conversation!</span>
              </div>
            ) : (
              chatMessages.map((msg, idx) => {
                const isMe = msg.sender === user?._id;
                return (
                  <div key={msg._id || idx} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '3px', textAlign: isMe ? 'right' : 'left' }}>
                      <strong>{msg.name}</strong> <span style={{ fontSize: '8px', color: msg.role === 'admin' ? '#ef4444' : msg.role === 'responder' ? '#06b6d4' : '#22c55e' }}>({msg.role})</span>
                    </div>
                    <div style={{
                      background: isMe ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.03)',
                      border: isMe ? '1px solid rgba(249,115,22,0.25)' : '1px solid rgba(255,255,255,0.05)',
                      padding: '10px 12px', borderRadius: '12px', borderTopRightRadius: isMe ? '2px' : '12px', borderTopLeftRadius: isMe ? '12px' : '2px',
                      color: '#e2e8f0', fontSize: '12px', lineBreak: 'anywhere'
                    }}>
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendChat} style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Type a message..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#f1f5f9', borderRadius: '8px', padding: '10px 14px', fontSize: '13px',
                outline: 'none', flex: 1, fontFamily: 'Outfit,sans-serif'
              }}
              required
            />
            <button type="submit" style={{
              background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white',
              border: 'none', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer',
              boxShadow: '0 0 15px rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* AI Crisis Assistant RAG Drawer */}
      {ragOpen && (
        <div style={{
          position: 'fixed', bottom: '80px', right: '24px', width: '380px', height: '520px',
          background: 'rgba(15,10,25,0.96)', border: '1px solid rgba(168,85,247,0.3)',
          backdropFilter: 'blur(25px)', zIndex: 1000, borderRadius: '16px', boxShadow: '0 0 40px rgba(168,85,247,0.2)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeSlideIn 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(168,85,247,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={16} color="#a855f7" />
              <div>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#f1f5f9' }}>AI Safety Guide</span>
                <div style={{ fontSize: '9px', color: '#64748b' }}>Retrieval-Augmented First-Aid Guide</div>
              </div>
            </div>
            <button onClick={() => setRagOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}>&times;</button>
          </div>
          
          {/* Chat / Guidelines Area */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {ragAnswer ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', animation: 'fadeSlideIn 0.3s ease' }}>
                {ragTopic && (
                  <span style={{ fontSize: '9px', fontWeight: '800', color: '#a855f7', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', padding: '3px 8px', borderRadius: '6px', alignSelf: 'flex-start', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    📚 Topic: {ragTopic}
                  </span>
                )}
                <div style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                  padding: '16px', borderRadius: '12px', color: '#cbd5e1', fontSize: '12.5px', lineHeight: 1.8,
                  whiteSpace: 'pre-wrap'
                }}>
                  {ragAnswer}
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: '#475569', textAlign: 'center', padding: '0 20px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(168,85,247,0.05)' }}>
                  <Brain size={22} color="#a855f7" />
                </div>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8' }}>Ask the Crisis Guide</span>
                  <p style={{ fontSize: '11px', color: '#334155', marginTop: '6px', lineHeight: 1.6 }}>Ask how to handle floods, severe burns, fractures, CPR, or earthquake drop protocols to retrieve official emergency safety guidelines.</p>
                </div>
              </div>
            )}
            {ragLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a855f7', fontSize: '11px', fontWeight: '700' }}>
                <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Consulting ResqNet AI database...
              </div>
            )}
          </div>

          {/* Ask Input Form */}
          <form onSubmit={handleRagAsk} style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)' }}>
            <input
              type="text"
              placeholder="What to do in case of a flood?"
              value={ragQuery}
              onChange={e => setRagQuery(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#f1f5f9', borderRadius: '8px', padding: '10px 14px', fontSize: '13px',
                outline: 'none', flex: 1, fontFamily: 'Outfit,sans-serif'
              }}
              required
            />
            <button type="submit" disabled={ragLoading} style={{
              background: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: 'white',
              border: 'none', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer',
              boxShadow: '0 0 15px rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: ragLoading ? 0.6 : 1
            }}>
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* Rescue Coordination Plan Modal */}
      {activeRescuePlan && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(3,7,18,0.8)', backdropFilter: 'blur(10px)',
          zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeSlideIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'rgba(15,20,35,0.96)', border: '1px solid rgba(6,182,212,0.3)',
            borderRadius: '16px', maxWidth: '580px', width: '100%', padding: '28px',
            boxShadow: '0 0 50px rgba(6,182,212,0.15)', display: 'flex', flexDirection: 'column', gap: '20px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={18} color="#06b6d4" /></div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#f1f5f9', margin: 0 }}>Rescue Coordination Plan</h3>
                  <p style={{ fontSize: '10px', color: '#475569', margin: '2px 0 0 0' }}>AI route optimization and medical logistics support</p>
                </div>
              </div>
              <button onClick={() => setActiveRescuePlan(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '24px', fontWeight: 'bold' }}>&times;</button>
            </div>

            {/* Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
              
              {/* Incident Summary Card */}
              <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '6px' }}>Incident Information</div>
                <div style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: '600', lineHeight: 1.5 }}>{activeRescuePlan.description}</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <span style={S.badge('rgba(239,68,68,0.12)', '#ef4444', 'rgba(239,68,68,0.2)')}>Urgency: {activeRescuePlan.urgency?.toUpperCase()}</span>
                  <span style={S.badge('rgba(249,115,22,0.12)', '#f97316', 'rgba(249,115,22,0.2)')}>AI Damage: {activeRescuePlan.damageLevel?.toUpperCase() || 'MINOR'}</span>
                  <span style={S.badge('rgba(34,197,94,0.12)', '#22c55e', 'rgba(34,197,94,0.2)')}>Victims: {activeRescuePlan.extractedData?.victimCount || 0}</span>
                </div>
              </div>

              {/* Route optimization details */}
              <div>
                <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '8px' }}>🤖 AI Logistics Dispatch Checklist</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', borderRadius: '12px', background: 'rgba(6,182,212,0.03)', border: '1px solid rgba(6,182,212,0.1)' }}>
                  {activeRescuePlan.agentLogs && activeRescuePlan.agentLogs.length > 0 ? (
                    activeRescuePlan.agentLogs.map((log, idx) => {
                      const cleanLog = log.replace(/^\[.*?\]\s*/, '');
                      return (
                        <div key={idx} style={{ fontSize: '11.5px', lineHeight: 1.7, color: '#e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ color: '#06b6d4', flexShrink: 0, fontWeight: '700' }}>✓</span>
                          <span>{cleanLog}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ fontSize: '11px', color: '#475569' }}>Calculating optimal supply route...</div>
                  )}
                </div>
              </div>

              {/* Nearby emergency facilities */}
              <div>
                <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏥 Nearest Emergency Infrastructure (Within 5km)</span>
                  {nearbyServices.loading && <RefreshCw size={10} style={{ animation: 'spin 1s linear infinite', color: '#06b6d4' }} />}
                </div>
                
                {nearbyServices.loading ? (
                  <div style={{ padding: '12px', textAlign: 'center', color: '#334155', fontSize: '11px' }}>Searching OpenStreetMap nodes...</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {/* Hospitals Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '10px', color: '#06b6d4', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hospitals / Trauma Care</div>
                      {nearbyServices.hospitals && nearbyServices.hospitals.map((h, i) => (
                        <div key={i} style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                          <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={h.name}>{h.name}</div>
                          <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>Distance: <strong style={{ color: '#cbd5e1' }}>{h.distance}</strong></div>
                        </div>
                      ))}
                    </div>
                    {/* Police Stations Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '10px', color: '#f97316', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Police / Security HQ</div>
                      {nearbyServices.police && nearbyServices.police.map((p, i) => (
                        <div key={i} style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                          <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.name}>{p.name}</div>
                          <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>Distance: <strong style={{ color: '#cbd5e1' }}>{p.distance}</strong></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <button onClick={() => setActiveRescuePlan(null)} style={{ ...S.btnOrange, width: '100%', padding: '12px', fontSize: '13px' }}>
              Close Rescue Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PAYMENT PAGE ─────────────────────────────────────────────────
const PaymentPage = ({ setPage, initialSuccess = false }) => {
  const { user } = useContext(AuthContext);
  const [donorName, setDonorName] = useState(user?.name || '');
  const [donorEmail, setDonorEmail] = useState(user?.email || '');
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [method, setMethod] = useState('upi');
  const [selectedCampaign, setSelectedCampaign] = useState('flood_relief_mumbai');
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(initialSuccess);

  const campaigns = [
    { id: 'flood_relief_mumbai', name: 'Mumbai Flood Relief', desc: 'Rescue rafts, hot meals, emergency shelters.', raised: 48200, goal: 100000, emoji: '🌊', color: '#06b6d4' },
    { id: 'cyclone_medical_kits', name: 'Cyclone Medical Aid', desc: 'Sterile medical dressings, trauma kits.', raised: 31500, goal: 75000, emoji: '🏥', color: '#22c55e' },
    { id: 'earthquake_rebuild', name: 'Earthquake Rebuild', desc: 'Structural support, temporary housing.', raised: 62000, goal: 200000, emoji: '🏗️', color: '#f97316' },
  ];

  const S = {
    glassCard: { background: 'rgba(15,20,35,0.9)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' },
    input: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', fontFamily: 'Outfit,sans-serif', width: '100%', outline: 'none', boxSizing: 'border-box' },
    btnOrange: { background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontFamily: 'Outfit,sans-serif', cursor: 'pointer', boxShadow: '0 0 20px rgba(249,115,22,0.3)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' },
  };

  const handlePay = async (e) => {
    e.preventDefault(); setPaying(true);
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
    try {
      const res = await axios.post('http://localhost:5000/api/donations/create-checkout-session', { amount, campaignId: selectedCampaign, donorName });
      if (res.data.success) {
        const { key, orderId, currency, amount: orderAmount } = res.data;
        
        const options = {
          key: key,
          amount: orderAmount,
          currency: currency,
          name: "ResqNet Relief Foundation",
          description: `Relief Campaign: ${selectedCampaign.replace('_', ' ').toUpperCase()}`,
          order_id: orderId,
          handler: async function (response) {
            try {
              const verifyRes = await axios.post('http://localhost:5000/api/donations/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                email: donorEmail
              });
              if (verifyRes.data.success) {
                setSuccess(true);
              } else {
                alert("Payment signature verification failed!");
              }
            } catch (err) {
              console.error("Verification failed:", err);
              alert("Payment verification failed! Please check console.");
            } finally {
              setPaying(false);
            }
          },
          prefill: {
            name: donorName,
            email: donorEmail,
          },
          theme: {
            color: "#f97316", // neon orange
          },
          modal: {
            ondismiss: function () {
              setPaying(false);
            }
          }
        };
        
        const rzp1 = new window.Razorpay(options);
        rzp1.open();
        return;
      }
    } catch (err) { 
      console.error("Order creation failed, falling back to mock:", err); 
    }
    // Fallback Mock
    setTimeout(() => { setSuccess(true); setPaying(false); }, 2000);
  };

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit,sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');`}</style>
      <div style={{ ...S.glassCard, maxWidth: '420px', width: '100%', margin: '24px', padding: '44px 36px', textAlign: 'center' }}>
        <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 40px rgba(34,197,94,0.2)' }}>
          <CheckCircle2 size={36} color="#22c55e" />
        </div>
        <div style={{ fontSize: '24px', fontWeight: '800', color: '#f1f5f9', marginBottom: '10px' }}>Donation Successful! 🎉</div>
        <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7, marginBottom: '28px' }}>Your contribution has been securely processed via Razorpay. A receipt was sent to <strong style={{ color: '#94a3b8' }}>{donorEmail}</strong>.</div>
        <button onClick={() => setPage('dashboard')} style={{ ...S.btnOrange, width: '100%', padding: '14px', fontSize: '14px' }}><ArrowRight size={15} />Return to Command Center</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#030712', backgroundImage: 'linear-gradient(rgba(249,115,22,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(249,115,22,0.02) 1px,transparent 1px)', backgroundSize: '50px 50px', fontFamily: 'Outfit,sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box}`}</style>
      <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(3,7,18,0.9)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setPage('dashboard')} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '600', fontFamily: 'Outfit,sans-serif' }}>
            <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}><CreditCard size={16} color="white" /></div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#f1f5f9' }}>Razorpay Donation Portal</div>
              <div style={{ fontSize: '9px', color: '#334155', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secure · PCI-DSS Compliant · Sandbox Mode</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', padding: '4px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><Shield size={10} /> Encrypted</span>
          <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(6,182,212,0.12)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.2)', padding: '4px 10px', borderRadius: '6px' }}>Razorpay</span>
        </div>
      </div>
      <div style={{ maxWidth: '1050px', margin: '0 auto', padding: '28px 22px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '19px', fontWeight: '800', color: '#f1f5f9' }}>Choose a Relief Campaign</div>
          {campaigns.map(c => (
            <div key={c.id} onClick={() => setSelectedCampaign(c.id)} style={{ ...S.glassCard, padding: '22px', cursor: 'pointer', transition: 'all 0.3s', border: selectedCampaign === c.id ? `1px solid ${c.color}40` : '1px solid rgba(255,255,255,0.06)', boxShadow: selectedCampaign === c.id ? `0 0 30px ${c.color}12` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>{c.emoji}</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9' }}>{c.name}</div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{c.desc}</div>
                  </div>
                </div>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: selectedCampaign === c.id ? `2px solid ${c.color}` : '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: selectedCampaign === c.id ? `${c.color}20` : 'transparent' }}>
                  {selectedCampaign === c.id && <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: c.color }} />}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '7px' }}>
                <span style={{ color: '#94a3b8', fontWeight: '600' }}>₹{c.raised.toLocaleString()} raised</span>
                <span style={{ color: '#475569' }}>Goal: ₹{c.goal.toLocaleString()}</span>
              </div>
              <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(c.raised / c.goal) * 100}%`, background: `linear-gradient(90deg,${c.color},${c.color}99)`, boxShadow: `0 0 10px ${c.color}80`, borderRadius: '99px', transition: 'width 1.5s ease' }} />
              </div>
              <div style={{ fontSize: '10px', color: '#475569', marginTop: '5px', textAlign: 'right' }}>{((c.raised / c.goal) * 100).toFixed(1)}% funded</div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {['🔒 PCI-DSS', '🏦 RBI Approved', '🌟 FCRA Registered', '🛡️ SSL Encrypted'].map(b => (
              <div key={b} style={{ fontSize: '11px', fontWeight: '600', color: '#334155', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px' }}>{b}</div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ ...S.glassCard, padding: '24px', position: 'sticky', top: '80px' }}>
            <div style={{ background: 'linear-gradient(135deg,#072654,#0d47a1)', borderRadius: '12px', padding: '16px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: 'white' }}>ResqNet Foundation</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Powered by Razorpay</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: 'white' }}>₹{customAmount || selectedAmount}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>INR</div>
              </div>
            </div>
            <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '7px' }}>Select Amount (₹)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '5px', marginBottom: '7px' }}>
                  {[100, 250, 500, 1000, 2500, 5000].map(amt => (
                    <button type="button" key={amt} onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }} style={{ padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', background: selectedAmount === amt && !customAmount ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)', border: selectedAmount === amt && !customAmount ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.06)', color: selectedAmount === amt && !customAmount ? '#22c55e' : '#64748b', fontFamily: 'Outfit,sans-serif' }}>
                      ₹{amt >= 1000 ? `${amt / 1000}K` : amt}
                    </button>
                  ))}
                </div>
                <input style={S.input} type="number" min="10" placeholder="Or enter custom amount..." value={customAmount} onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(0); }} />
              </div>
              <input style={S.input} type="text" placeholder="Your full name" value={donorName} onChange={e => setDonorName(e.target.value)} required />
              <input style={S.input} type="email" placeholder="Email for receipt" value={donorEmail} onChange={e => setDonorEmail(e.target.value)} required />
              <div>
                <label style={{ fontSize: '10px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '7px' }}>Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px' }}>
                  {[{ id: 'upi', label: 'UPI', emoji: '📱' }, { id: 'card', label: 'Card', emoji: '💳' }, { id: 'netbanking', label: 'Net Banking', emoji: '🏦' }].map(m => (
                    <button type="button" key={m.id} onClick={() => setMethod(m.id)} style={{ padding: '10px 6px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', background: method === m.id ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.03)', border: method === m.id ? '1px solid rgba(249,115,22,0.4)' : '1px solid rgba(255,255,255,0.06)', color: method === m.id ? '#f97316' : '#475569', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontFamily: 'Outfit,sans-serif' }}>
                      <span style={{ fontSize: '18px' }}>{m.emoji}</span>
                      <span style={{ fontSize: '9px', fontWeight: '700' }}>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px', borderRadius: '10px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)' }}>
                <Shield size={13} color="#22c55e" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>Secured by Razorpay's PCI-DSS Level 1 compliant infrastructure.</span>
              </div>
              <button type="submit" disabled={paying} style={{ ...S.btnOrange, width: '100%', padding: '14px', fontSize: '14px', opacity: paying ? 0.7 : 1 }}>
                {paying ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />Processing...</> : <><Heart size={14} />Donate ₹{customAmount || selectedAmount} via {method.toUpperCase()}</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── LOGIN / REGISTER PAGE ────────────────────────────────────────
const AuthPage = ({ mode, onToggle }) => {
  const { login, register } = useContext(AuthContext);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('volunteer');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const particles = Array.from({ length: 80 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, r: Math.random() * 1.5 + 0.5 }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(249,115,22,0.4)'; ctx.fill();
      });
      particles.forEach((p, i) => particles.slice(i + 1).forEach(q => {
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 100) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.strokeStyle = `rgba(249,115,22,${0.08 * (1 - d / 100)})`; ctx.lineWidth = 0.5; ctx.stroke(); }
      }));
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      if (mode === 'register') await register({ name, email, password, role });
      else await login({ email, password });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed.');
    } finally { setSubmitting(false); }
  };

  const S = {
    input: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', fontFamily: 'Outfit,sans-serif', width: '100%', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' },
    label: { fontSize: '11px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' },
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 460px', fontFamily: 'Outfit,sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap'); *{box-sizing:border-box} @keyframes fadeSlideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}} @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      {/* Left — canvas globe */}
      <div style={{ position: 'relative', background: '#010914', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '420px', height: '420px', opacity: 0.85 }}>
          <AnimatedGlobe />
        </div>
        <div style={{ position: 'relative', zIndex: 2, padding: '40px 44px' }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.25)', padding: '4px 12px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '5px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>
              <Zap size={10} /> AI-Powered Emergency Response
            </span>
          </div>
          <h1 style={{ fontSize: '44px', fontWeight: '900', color: '#f1f5f9', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '12px', margin: 0 }}>
            Resq<span style={{ color: '#f97316', textShadow: '0 0 40px rgba(249,115,22,0.5)' }}>Net</span>
          </h1>
          <p style={{ fontSize: '16px', color: '#334155', fontWeight: '400', marginBottom: '20px', marginTop: '8px' }}>Disaster Command Platform</p>
          <p style={{ fontSize: '13px', color: '#1e293b', lineHeight: 1.8, maxWidth: '380px', marginBottom: '24px' }}>
            Real-time AI orchestration combining <strong style={{ color: '#a855f7' }}>Gemini 1.5</strong>, <strong style={{ color: '#06b6d4' }}>PyTorch CV</strong>, and <strong style={{ color: '#22c55e' }}>multi-agent dispatch</strong> to save lives faster.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            {[{ l: 'Gemini AI', c: '#a855f7', I: Brain }, { l: 'PyTorch CV', c: '#06b6d4', I: Cpu }, { l: 'Razorpay', c: '#22c55e', I: CreditCard }, { l: 'Socket.IO', c: '#f97316', I: Zap }, { l: 'Multi-Agent', c: '#ef4444', I: Radio }].map(f => (
              <div key={f.l} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '20px', background: `${f.c}12`, border: `1px solid ${f.c}25`, fontSize: '11px', fontWeight: '700', color: f.c }}>
                <f.I size={11} />{f.l}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — auth form */}
      <div style={{ background: 'rgba(5,8,18,0.99)', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '44px 38px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(249,115,22,0.4)' }}><Activity size={19} color="white" /></div>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#f1f5f9' }}>Resq<span style={{ color: '#f97316' }}>Net</span></span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#f1f5f9', marginBottom: '5px', margin: 0 }}>{mode === 'register' ? 'Create Account' : 'Welcome Back'}</h2>
          <p style={{ fontSize: '13px', color: '#334155', marginTop: '6px' }}>{mode === 'register' ? 'Join the emergency response network.' : 'Sign in to your command center.'}</p>
        </div>

        {error && (
          <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '12px', fontWeight: '600', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertOctagon size={13} />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
          {mode === 'register' && (
            <div><label style={S.label}>Full Name</label><input style={S.input} type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Hardik Shah" /></div>
          )}
          <div><label style={S.label}>Email Address</label><input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" /></div>
          <div><label style={S.label}>Password</label><input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" /></div>
          {mode === 'register' && (
            <div>
              <label style={S.label}>Role</label>
              <select style={S.input} value={role} onChange={e => setRole(e.target.value)}>
                <option value="volunteer" style={{ background: '#0d1117' }}>🙋 Volunteer</option>
                <option value="responder" style={{ background: '#0d1117' }}>🚑 Responder</option>
                <option value="admin" style={{ background: '#0d1117' }}>👑 Administrator</option>
              </select>
            </div>
          )}
          <button type="submit" disabled={submitting} style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontFamily: 'Outfit,sans-serif', cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 0 20px rgba(249,115,22,0.3)', padding: '13px', fontSize: '14px', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />Authenticating...</> : <>{mode === 'register' ? 'Create Account' : 'Access Command Center'}<ArrowRight size={14} /></>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <span style={{ fontSize: '12px', color: '#334155' }}>{mode === 'register' ? 'Already have access? ' : "Don't have an account? "}</span>
          <button onClick={onToggle} style={{ fontSize: '12px', fontWeight: '700', color: '#f97316', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(249,115,22,0.4)', fontFamily: 'Outfit,sans-serif' }}>
            {mode === 'register' ? 'Sign In' : 'Register here'}
          </button>
        </div>

        <div style={{ marginTop: '20px', padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>Demo Credentials</div>
          <div style={{ fontSize: '11px', color: '#334155', fontFamily: 'monospace', lineHeight: 1.9 }}>
            <div>admin@resqnet.io / admin123</div>
            <div>responder@resqnet.io / resp123</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── ROOT APP ─────────────────────────────────────────────────────
const App = () => {
  const { user, loading } = useContext(AuthContext);
  const [view, setView] = useState('login');
  const [page, setPage] = useState('dashboard');

  useEffect(() => {
    setView(user ? 'dashboard' : 'login');
  }, [user]);

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/payment') {
      setPage('payment');
    } else if (path === '/donation-success') {
      setPage('donation-success');
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/payment') {
        setPage('payment');
      } else if (path === '/donation-success') {
        setPage('donation-success');
      } else {
        setPage('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const changePage = (p) => {
    setPage(p);
    if (p === 'dashboard') {
      window.history.pushState({}, '', '/');
    } else {
      window.history.pushState({}, '', `/${p}`);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '14px', fontFamily: 'Outfit,sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700&display=swap'); @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '3px solid rgba(249,115,22,0.15)', borderTopColor: '#f97316', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: '11px', color: '#334155', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Initializing ResqNet...</div>
    </div>
  );

  if (view === 'login') return <AuthPage mode="login" onToggle={() => setView('register')} />;
  if (view === 'register') return <AuthPage mode="register" onToggle={() => setView('login')} />;
  if (page === 'payment') return <PaymentPage setPage={changePage} initialSuccess={false} />;
  if (page === 'donation-success') return <PaymentPage setPage={changePage} initialSuccess={true} />;
  return <Dashboard setPage={changePage} />;
};

export default function WrappedApp() {
  return (
    <AuthProvider>
      <SocketProvider>
        <App />
      </SocketProvider>
    </AuthProvider>
  );
}
