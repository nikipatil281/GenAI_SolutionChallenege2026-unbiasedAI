import React from 'react';
import { useAudit } from '../context/AuditContext';
import { cn } from '../lib/utils';
import { BrainCircuit } from 'lucide-react';
import Markdown from 'react-markdown';

export function LlmPanel({ className }: { className?: string }) {
  const { llmMessages } = useAudit();
  
  return (
    <div className={cn("flex flex-col bg-white border-l border-[#141414]", className)}>
      <div className="p-6 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
          <h2 className="text-xs uppercase font-black tracking-tighter">LLM Interpretive Reasoning</h2>
        </div>
        <p className="text-[10px] opacity-50 uppercase tracking-widest">Audit Module: Synthesis & Trade-offs</p>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-6 text-sm leading-snug p-6 pt-0">
        {llmMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 mt-20">
            <BrainCircuit className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-[10px] uppercase font-bold max-w-[200px]">LLM interpretations will appear here as you run audits.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {llmMessages.map((msg, i) => (
              <div key={i} className="space-y-4">
                <div className="f-serif text-lg text-blue-900 border-l-2 border-blue-600 pl-4">
                  <h3 className="text-[10px] font-bold text-blue-900 tracking-wider uppercase mb-2">
                    {msg.title}
                  </h3>
                  <div className="text-sm prose prose-sm max-w-none text-blue-900">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
