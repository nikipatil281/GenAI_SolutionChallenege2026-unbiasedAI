import React from 'react';
import { useAudit } from '../context/AuditContext';
import { ShieldAlert, Database, Scale, Users, FileBarChart, Settings, ListChecks } from 'lucide-react';
import { cn } from '../lib/utils';

export function Sidebar({ className }: { className?: string }) {
  const { activeModule, setActiveModule } = useAudit();
  
  const modules = [
    { id: 'problem-framing', label: '01 Problem Framing', icon: ShieldAlert },
    { id: 'dataset-audit', label: '02 Dataset Audit', icon: Database },
    { id: 'proxy-screening', label: '03 Proxy Screening', icon: ListChecks },
    { id: 'fairness-metrics', label: '04 Fairness Engine', icon: Scale },
    { id: 'subgroup-audit', label: '05 Intersectional', icon: Users },
    { id: 'governance', label: '06 Governance Hub', icon: FileBarChart },
    { id: 'decision', label: '07 Decision Export', icon: Settings },
  ];

  return (
    <aside className={cn("w-56 bg-[#141414] text-[#E4E3E0] flex flex-col", className)}>
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tighter leading-none uppercase">BiasScope</h1>
        <p className="text-[10px] opacity-50 mt-1 uppercase tracking-widest">Sociotechnical Auditor</p>
      </div>

      <nav className="flex-grow text-[11px] uppercase tracking-wider font-semibold">
        <div className="p-4 opacity-30 text-[9px]">Audit Pipeline</div>
        {modules.map(mod => {
          const isActive = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className={cn(
                "block w-full text-left p-4 transition-all duration-100 ease-in border-b border-white/10 hover:bg-[#F27D26] hover:text-[#141414]",
                isActive 
                  ? "bg-white/5 text-[#F27D26] hover:text-[#141414]" 
                  : ""
              )}
            >
              {mod.label}
            </button>
          )
        })}
      </nav>
      
      <div className="p-4 bg-white/5 text-[10px]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>Engine Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span>LLM Linked</span>
        </div>
      </div>
    </aside>
  );
}
