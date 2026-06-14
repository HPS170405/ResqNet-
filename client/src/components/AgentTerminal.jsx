import React, { useEffect, useState, useRef, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { Cpu, Terminal, RefreshCw, Trash } from 'lucide-react';

const AgentTerminal = () => {
  const { socket } = useContext(SocketContext);
  const [logs, setLogs] = useState([
    { timestamp: new Date().toLocaleTimeString(), message: '[System] ResqNet Multi-Agent Orchestrator initialized. Online.', type: 'sys' }
  ]);
  
  const bottomRef = useRef(null);

  useEffect(() => {
    if (socket) {
      socket.on('agent-thinking', (data) => {
        const timestamp = new Date().toLocaleTimeString();
        let logType = 'sys';
        const msg = data.log;

        if (msg.includes('[Logistics')) logType = 'logistics';
        else if (msg.includes('[Inventory')) logType = 'inventory';
        else if (msg.includes('[Dispatch')) logType = 'dispatch';
        else if (msg.includes('[Orchestrator')) logType = 'orchestrator';

        setLogs(prev => [...prev, { timestamp, message: msg, type: logType }]);
      });
    }

    return () => {
      if (socket) {
        socket.off('agent-thinking');
      }
    };
  }, [socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const clearTerminal = () => {
    setLogs([{ timestamp: new Date().toLocaleTimeString(), message: '[System] Terminal logs cleared. Standing by.', type: 'sys' }]);
  };

  const getLogStyle = (type) => {
    switch (type) {
      case 'logistics': return 'text-sky-600 font-semibold';
      case 'inventory': return 'text-indigo-600 font-semibold';
      case 'dispatch': return 'text-amber-600 font-semibold';
      case 'orchestrator': return 'text-slate-800 font-extrabold';
      case 'sys': return 'text-slate-400 italic';
      default: return 'text-slate-600';
    }
  };

  return (
    <div class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col h-[350px]">
      {/* Console Header */}
      <div class="flex items-center justify-between border-b border-slate-50 pb-3 mb-3">
        <div class="flex items-center gap-2">
          <div class="p-1.5 bg-amber-100 text-amber-500 rounded-lg">
            <Cpu class="h-4 w-4" />
          </div>
          <div>
            <h4 class="font-extrabold text-brand-navy text-sm">Agentic Workspace Monitor</h4>
            <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Live Logic Stream</p>
          </div>
        </div>
        <button
          onClick={clearTerminal}
          class="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
          title="Clear Logs"
        >
          <Trash class="h-4 w-4" />
        </button>
      </div>

      {/* Terminal Screen */}
      <div class="flex-1 overflow-y-auto bg-slate-50 border border-slate-100 rounded-xl p-4 font-mono text-xs leading-relaxed text-left space-y-2 select-text">
        {logs.map((log, index) => (
          <div key={index} class="flex items-start gap-2 border-b border-slate-100/50 pb-1.5 last:border-0 last:pb-0">
            <span class="text-[10px] text-slate-300 font-bold select-none">{log.timestamp}</span>
            <span class={getLogStyle(log.type)}>{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default AgentTerminal;
