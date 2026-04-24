import React from 'react';
import { BrainCircuit, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';
import { Button } from './button';

interface LlmCompanionProps {
  title: string;
  description: string;
  message?: { title: string; content: string };
  loading?: boolean;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
}

export function LlmCompanion({ title, description, message, loading, action }: LlmCompanionProps) {
  return (
    <div className="bg-white border border-[#141414] shadow-[4px_4px_0px_#141414] p-6 h-full flex flex-col min-h-[500px]">
       <div className="border-b border-[#141414]/20 pb-4 mb-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F27D26]/10 rounded border border-[#F27D26]/20 text-[#F27D26]">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold uppercase tracking-tight text-lg text-[#141414]">{title}</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">{description}</p>
            </div>
          </div>
          {action && message && (
            <Button size="sm" onClick={action.onClick} disabled={action.disabled || loading} variant="outline" className="text-xs">
              <Sparkles className="w-3 h-3 mr-2 text-[#F27D26]" />
              {loading ? 'Thinking...' : 'Regenerate'}
            </Button>
          )}
       </div>
       <div className="flex-1 overflow-y-auto">
         {loading ? (
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-6 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-3">
                  <div className="h-2 bg-gray-200 rounded"></div>
                  <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-3 pt-4">
                  <div className="h-2 bg-gray-200 rounded w-4/5"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                  <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
         ) : message ? (
            <div className="prose prose-sm max-w-none text-[#141414] prose-headings:uppercase prose-headings:tracking-wider prose-headings:text-sm prose-a:text-[#F27D26] marker:text-[#F27D26] pr-4">
              <Markdown>{message.content}</Markdown>
            </div>
         ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
               <BrainCircuit className="w-12 h-12 mb-3 opacity-20 text-[#141414]" />
               <p className="text-xs uppercase tracking-widest font-bold text-[#141414]/50 mb-4">Awaiting Analysis</p>
               {action ? (
                 <Button onClick={action.onClick} disabled={action.disabled || loading} size="lg" className="shadow-[2px_2px_0px_#141414]">
                   <Sparkles className="w-4 h-4 mr-2" />
                   {action.label}
                 </Button>
               ) : (
                 <p className="text-xs max-w-[200px] text-[#141414]/40">Run the deterministic engine to unlock sociotechnical insights.</p>
               )}
            </div>
         )}
       </div>
    </div>
  );
}
