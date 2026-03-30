import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { 
  Activity, 
  ArrowRight, 
  Settings, 
  Trash2, 
  Play, 
  Square, 
  Plus, 
  ChevronRight, 
  Globe,
  Shield,
  Zap,
  Cpu,
  Network,
  Lock,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TrafficLog {
  id: string;
  timestamp: string;
  type: "request" | "response" | "intercept" | "error";
  method?: string;
  url: string;
  status?: number;
  headers?: any;
  reroutedTo?: string;
}

interface Rule {
  id: string;
  match: string;
  reroute: string;
  active: boolean;
}

export default function App() {
  const [logs, setLogs] = useState<TrafficLog[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [selectedLog, setSelectedLog] = useState<TrafficLog | null>(null);
  const [isRecording, setIsRecording] = useState(true);
  const [newRule, setNewRule] = useState({ match: "", reroute: "" });
  const [showRules, setShowRules] = useState(false);
  const [filter, setFilter] = useState("");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io();
    socketRef.current.on("traffic", (log: TrafficLog) => {
      if (isRecording) {
        setLogs((prev) => [log, ...prev].slice(0, 200));
      }
    });

    fetch("/api/rules").then(res => res.json()).then(data => setRules(data));
    return () => { socketRef.current?.disconnect(); };
  }, [isRecording]);

  const saveRules = (updatedRules: Rule[]) => {
    setRules(updatedRules);
    fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedRules),
    });
  };

  const addRule = () => {
    if (!newRule.match || !newRule.reroute) return;
    const rule: Rule = {
      id: Math.random().toString(36).substr(2, 9),
      match: newRule.match,
      reroute: newRule.reroute,
      active: true,
    };
    saveRules([...rules, rule]);
    setNewRule({ match: "", reroute: "" });
  };

  const filteredLogs = logs.filter(l => l.url?.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#0F0F11] text-[#D1D1D1] font-mono selection:bg-[#F27D26] selection:text-white flex flex-col">
      {/* Top Bar: System Status */}
      <div className="h-8 bg-[#151619] border-b border-[#2A2A30] flex items-center justify-between px-4 text-[9px] uppercase tracking-[0.2em] text-[#5A5A60]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Cpu size={10} className="text-[#F27D26]" />
            Engine: MockTTP/v3.0
          </span>
          <span className="flex items-center gap-1.5">
            <Network size={10} className="text-green-500" />
            Proxy Port: 8080
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Lock size={10} className="text-blue-400" />
            SSL Interception: Active
          </span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-[#0F0F11] border-b border-[#1F1F23]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#1A1B1E] border border-[#2A2A30] rounded-lg flex items-center justify-center shadow-inner">
            <Shield className="w-6 h-6 text-[#F27D26]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-widest uppercase">NetRoute Pro</h1>
            <p className="text-[10px] text-[#5A5A60] mt-0.5">macOS Network Interceptor & Router</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative mr-4">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A60]" />
            <input 
              type="text"
              placeholder="FILTER TRAFFIC..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-[#151619] border border-[#2A2A30] rounded px-8 py-1.5 text-[10px] w-48 focus:outline-none focus:border-[#F27D26] transition-all"
            />
          </div>

          <button 
            onClick={() => setIsRecording(!isRecording)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded text-[10px] font-bold transition-all border ${
              isRecording 
                ? 'bg-[#1F1F23] border-red-500/30 text-red-400 hover:bg-red-500/10' 
                : 'bg-[#F27D26] border-[#F27D26] text-black hover:bg-[#FF8E3D]'
            }`}
          >
            {isRecording ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
            {isRecording ? 'STOP CAPTURE' : 'START CAPTURE'}
          </button>
          
          <button 
            onClick={() => setShowRules(!showRules)}
            className={`p-2 rounded border transition-all ${showRules ? 'bg-[#F27D26] border-[#F27D26] text-black' : 'bg-[#151619] border-[#2A2A30] text-[#8E9299] hover:text-white'}`}
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Rules Sidebar */}
        <AnimatePresence>
          {showRules && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-[#1F1F23] bg-[#0A0A0B] flex flex-col overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[10px] font-bold text-[#F27D26] uppercase tracking-widest">Routing Rules</h2>
                  <Zap size={14} className="text-[#F27D26]" />
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-[#5A5A60] uppercase font-bold">Match Pattern</label>
                    <input 
                      type="text" 
                      placeholder="e.g. *.apple.com"
                      value={newRule.match}
                      onChange={(e) => setNewRule({ ...newRule, match: e.target.value })}
                      className="w-full bg-[#151619] border border-[#2A2A30] rounded px-3 py-2 text-[11px] focus:outline-none focus:border-[#F27D26]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-[#5A5A60] uppercase font-bold">Reroute To</label>
                    <input 
                      type="text" 
                      placeholder="e.g. localhost:9000"
                      value={newRule.reroute}
                      onChange={(e) => setNewRule({ ...newRule, reroute: e.target.value })}
                      className="w-full bg-[#151619] border border-[#2A2A30] rounded px-3 py-2 text-[11px] focus:outline-none focus:border-[#F27D26]"
                    />
                  </div>
                  <button 
                    onClick={addRule}
                    className="w-full bg-[#1F1F23] border border-[#2A2A30] text-white font-bold py-2 rounded text-[10px] hover:bg-[#2A2A30] transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> REGISTER RULE
                  </button>
                </div>

                <div className="mt-8 space-y-2">
                  {rules.map((rule) => (
                    <div key={rule.id} className={`p-3 rounded border transition-all ${rule.active ? 'bg-[#151619] border-[#F27D26]/20' : 'bg-transparent border-[#1F1F23] opacity-40'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-white truncate max-w-[180px]">{rule.match}</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={rule.active} 
                            onChange={() => saveRules(rules.map(r => r.id === rule.id ? {...r, active: !r.active} : r))}
                            className="accent-[#F27D26]"
                          />
                          <button onClick={() => saveRules(rules.filter(r => r.id !== rule.id))} className="text-[#5A5A60] hover:text-red-500">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-[#8E9299]">
                        <ArrowRight size={10} className="text-[#F27D26]" />
                        <span className="truncate">{rule.reroute}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Traffic List */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#0F0F11]">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-[#0F0F11] z-10">
                <tr className="text-[9px] text-[#5A5A60] uppercase tracking-[0.2em] border-b border-[#1F1F23]">
                  <th className="text-left py-3 px-6 font-bold">Timestamp</th>
                  <th className="text-left py-3 px-6 font-bold">Method</th>
                  <th className="text-left py-3 px-6 font-bold">Domain / Path</th>
                  <th className="text-left py-3 px-6 font-bold">Status</th>
                  <th className="text-left py-3 px-6 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F23]/30">
                {filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    onClick={() => setSelectedLog(log)}
                    className={`group cursor-pointer transition-all ${
                      selectedLog?.id === log.id ? 'bg-[#1A1B1E]' : 'hover:bg-[#151619]'
                    }`}
                  >
                    <td className="py-3 px-6 text-[10px] text-[#5A5A60]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-6">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                        log.method === 'GET' ? 'border-blue-500/30 text-blue-400 bg-blue-500/5' :
                        log.method === 'POST' ? 'border-green-500/30 text-green-400 bg-green-500/5' :
                        'border-gray-500/30 text-gray-400 bg-gray-500/5'
                      }`}>
                        {log.method || '---'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-[11px] text-[#E1E1E3] truncate max-w-xl">
                      {log.url}
                    </td>
                    <td className="py-3 px-6">
                      {log.status ? (
                        <span className={`text-[10px] font-bold ${log.status < 400 ? 'text-green-400' : 'text-red-400'}`}>
                          {log.status}
                        </span>
                      ) : <Activity size={12} className="text-[#5A5A60] animate-pulse" />}
                    </td>
                    <td className="py-3 px-6">
                      {log.type === 'intercept' && (
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#F27D26] uppercase">
                          <Zap size={10} /> Intercepted
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedLog && (
            <motion.aside 
              initial={{ x: 500 }}
              animate={{ x: 0 }}
              exit={{ x: 500 }}
              className="w-[500px] border-l border-[#1F1F23] bg-[#0A0A0B] flex flex-col z-40 shadow-2xl"
            >
              <div className="p-6 border-b border-[#1F1F23] flex items-center justify-between bg-[#0F0F11]">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#F27D26]" />
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">Inspector</h3>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-[#5A5A60] hover:text-white transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8 text-[11px]">
                <div className="space-y-3">
                  <h4 className="text-[9px] text-[#5A5A60] uppercase font-bold tracking-widest border-b border-[#1F1F23] pb-2">Resource</h4>
                  <div className="bg-[#151619] rounded-lg p-4 border border-[#1F1F23] space-y-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[#5A5A60] text-[9px] uppercase">Full URL</span>
                      <span className="text-white break-all leading-relaxed">{selectedLog.url}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[#5A5A60] text-[9px] uppercase">Method</span>
                        <span className="text-[#F27D26] font-bold">{selectedLog.method}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[#5A5A60] text-[9px] uppercase">Status</span>
                        <span className="text-green-400 font-bold">{selectedLog.status || 'PENDING'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedLog.type === 'intercept' && (
                  <div className="p-4 bg-[#F27D26]/5 border border-[#F27D26]/20 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-[#F27D26] font-bold text-[10px] uppercase">
                      <Zap size={14} /> Reroute Triggered
                    </div>
                    <div className="text-[10px] text-[#8E9299]">This request was diverted to a custom endpoint:</div>
                    <div className="text-[11px] text-white font-bold break-all bg-black/40 p-2 rounded border border-white/5">{selectedLog.reroutedTo}</div>
                  </div>
                )}

                {selectedLog.headers && (
                  <div className="space-y-3">
                    <h4 className="text-[9px] text-[#5A5A60] uppercase font-bold tracking-widest border-b border-[#1F1F23] pb-2">Headers</h4>
                    <div className="bg-[#0F0F11] rounded-lg p-4 border border-[#1F1F23] overflow-x-auto">
                      <pre className="text-[10px] text-[#8E9299] leading-relaxed">
                        {JSON.stringify(selectedLog.headers, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1F1F23; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #F27D26; }
      `}</style>
    </div>
  );
}
