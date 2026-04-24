import React from 'react';
import { useAudit } from '../context/AuditContext';
import { ShieldAlert, Database, Scale, Users, FileBarChart, Settings, ListChecks, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  className?: string;
  onBackToHome?: () => void;
}

export function Sidebar({ className, onBackToHome }: SidebarProps) {
  const { activeModule, setActiveModule, datasetStats, llmMessages, loadingModules } = useAudit();
  
  const modules = [
    { id: 'project-setup', label: '01 Project Setup', icon: ShieldAlert },
    { id: 'proxy-screening', label: '02 Proxy Screening', icon: ListChecks },
    { id: 'fairness-metrics', label: '03 Fairness Engine', icon: Scale },
    { id: 'subgroup-audit', label: '04 Intersectional', icon: Users },
    { id: 'governance', label: '05 Governance Hub', icon: FileBarChart },
    { id: 'decision', label: '06 Decision Export', icon: Settings },
  ];

  const hasMessage = (type: string) => llmMessages.some(m => m.type === type);

  return (
    <aside className={cn("w-56 bg-[#141414] text-[#E4E3E0] flex flex-col", className)}>
      <div className="p-6 border-b border-white/10 relative">
        {onBackToHome && (
          <button 
            onClick={onBackToHome}
            className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <h1 className="text-xl font-bold tracking-tighter leading-none uppercase">BiasScope</h1>
        <p className="text-[10px] opacity-50 mt-1 uppercase tracking-widest">Sociotechnical Auditor</p>
      </div>

      <nav className="flex-grow text-[11px] uppercase tracking-wider font-semibold">
        <div className="p-4 opacity-30 text-[9px]">Audit Pipeline</div>
        {modules.map(mod => {
          const isActive = activeModule === mod.id;
          const isLoading = loadingModules[mod.id];
          
          let isLocked = false;
          if (mod.id === 'proxy-screening') isLocked = !hasMessage('project-setup');
          if (mod.id === 'fairness-metrics' || mod.id === 'subgroup-audit') isLocked = !hasMessage('proxy');
          if (mod.id === 'governance') isLocked = !hasMessage('subgroup');
          if (mod.id === 'decision') isLocked = !hasMessage('governance');
          
          // If a module is currently loading, it is unlocked so the user can watch it load!
          if (isLoading) isLocked = false;
          
          return (
            <button
              key={mod.id}
              onClick={() => { if (!isLocked) setActiveModule(mod.id); }}
              disabled={isLocked}
              className={cn(
                "w-full text-left p-4 transition-all duration-100 ease-in border-b border-white/10 flex items-center justify-between group",
                isActive 
                  ? "bg-white/5 text-[#F27D26]" 
                  : "hover:bg-[#F27D26] hover:text-[#141414]",
                isLocked ? "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-[#E4E3E0]" : ""
              )}
            >
              <span>{mod.label}</span>
              {isLoading ? (
                <div className="w-3 h-3 rounded-full border-2 border-[#F27D26] border-t-transparent animate-spin"></div>
              ) : isLocked ? (
                <div className="w-3 h-3 rounded-full border-2 border-current opacity-50 flex items-center justify-center text-[6px]">!</div>
              ) : null}
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
