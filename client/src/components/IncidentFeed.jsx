import React, { useState } from 'react';
import { AlertCircle, Clock, CheckCircle2, ChevronDown, ChevronUp, FileText } from 'lucide-react';

const IncidentFeed = ({ incidents, onSelectIncident, onResolveIncident, onViewRescuePlan, userRole }) => {

  const urgencyColor = {
    critical: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
    high: { bg: 'rgba(249,115,22,0.12)', color: '#f97316', border: 'rgba(249,115,22,0.25)' },
    medium: { bg: 'rgba(234,179,8,0.12)', color: '#eab308', border: 'rgba(234,179,8,0.25)' },
    low: { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
  };

  const damageColor = {
    severe: '#ef4444',
    moderate: '#f97316',
    minor: '#eab308',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {incidents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <CheckCircle2 size={32} color="#1e293b" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: '12px', color: '#334155', fontWeight: '600' }}>All clear. No active emergencies.</p>
        </div>
      ) : (
        incidents.map((incident) => {
          const urg = urgencyColor[incident.urgency] || urgencyColor.low;
          const isResolved = incident.status === 'resolved';
          return (
            <div
              key={incident._id}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${isResolved ? 'rgba(255,255,255,0.04)' : urg.border}`,
                borderRadius: '12px',
                padding: '12px 14px',
                opacity: isResolved ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 7px', borderRadius: '5px', background: urg.bg, color: urg.color, border: `1px solid ${urg.border}` }}>
                    {incident.urgency}
                  </span>
                  {incident.damageLevel && (
                    <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 7px', borderRadius: '5px', background: `${damageColor[incident.damageLevel] || '#94a3b8'}15`, color: damageColor[incident.damageLevel] || '#94a3b8', border: `1px solid ${damageColor[incident.damageLevel] || '#94a3b8'}30` }}>
                      AI: {incident.damageLevel}
                    </span>
                  )}
                  {incident.status === 'dispatched' && (
                    <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 7px', borderRadius: '5px', background: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.2)' }}>
                      Dispatched
                    </span>
                  )}
                  {isResolved && (
                    <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 7px', borderRadius: '5px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                      Resolved ✓
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '10px', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={10} />
                  {incident.createdAt ? new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                </span>
              </div>

              {/* Description */}
              <p
                onClick={() => onSelectIncident(incident.location?.coordinates)}
                style={{ fontSize: '12px', fontWeight: '600', color: '#cbd5e1', cursor: 'pointer', marginBottom: '8px', lineHeight: 1.5 }}
                title="Click to focus on map"
              >
                {incident.description}
              </p>

              {/* Extracted data */}
              {incident.extractedData && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '9px', color: '#334155', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Victims</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#ef4444' }}>{incident.extractedData.victimCount || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: '#334155', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Supplies</div>
                    <div style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8' }}>{incident.extractedData.suppliesRequired?.slice(0, 2).join(', ') || 'General'}</div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                {incident.agentLogs?.length > 0 && (
                  <button
                    onClick={() => onViewRescuePlan(incident)}
                    style={{ fontSize: '11px', fontWeight: '700', color: '#06b6d4', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Outfit,sans-serif' }}
                  >
                    <FileText size={11} />
                    View Rescue Plan
                  </button>
                )}
                {!isResolved && (userRole === 'admin' || userRole === 'responder') && (
                  <button
                    onClick={() => onResolveIncident(incident._id)}
                    style={{ fontSize: '11px', fontWeight: '700', color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', marginLeft: 'auto', transition: 'all 0.2s' }}
                  >
                    ✓ Resolve
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default IncidentFeed;
