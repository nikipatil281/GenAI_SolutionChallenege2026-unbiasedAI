import React from 'react';
import { useAudit } from '../context/AuditContext';
import { ProblemFraming } from './modules/ProblemFraming';
import { DatasetAudit } from './modules/DatasetAudit';
import { ProxyScreening } from './modules/ProxyScreening';
import { FairnessMetrics } from './modules/FairnessMetrics';
import { SubgroupAudit } from './modules/SubgroupAudit';
import { Governance } from './modules/Governance';
import { DecisionExport } from './modules/DecisionExport';
import { cn } from '../lib/utils';

export function MainWorkspace({ className }: { className?: string }) {
  const { activeModule } = useAudit();
  
  return (
    <main className={cn("flex-grow flex flex-col overflow-hidden bg-[#E4E3E0]", className)}>
      <header className="h-16 border-b border-[#141414] flex items-center justify-between px-6 bg-white/30 backdrop-blur-sm shrink-0">
        <div>
          <span className="text-[10px] uppercase font-bold opacity-50 block">Active Project</span>
          <span className="font-bold text-lg leading-tight block">BIASSCOPE_AUDIT_ACTIVE</span>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right">
             <span className="text-[10px] uppercase font-bold opacity-50 block">System Mode</span>
             <span className="f-mono font-bold text-[#F27D26]">DETERMINISTIC + LLM</span>
           </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl mx-auto">
          {activeModule === 'problem-framing' && <ProblemFraming />}
          {activeModule === 'dataset-audit' && <DatasetAudit />}
          {activeModule === 'proxy-screening' && <ProxyScreening />}
          {activeModule === 'fairness-metrics' && <FairnessMetrics />}
          {activeModule === 'subgroup-audit' && <SubgroupAudit />}
          {activeModule === 'governance' && <Governance />}
          {activeModule === 'decision' && <DecisionExport />}
        </div>
      </div>
    </main>
  );
}
