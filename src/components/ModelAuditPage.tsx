import React from 'react';
import { ArrowLeft, Construction, FileCode2 } from 'lucide-react';
import { Button } from './ui/button';

interface ModelAuditPageProps {
  onBack: () => void;
}

export function ModelAuditPage({ onBack }: ModelAuditPageProps) {
  return (
    <div className="flex flex-col h-screen bg-[#E4E3E0] text-[#141414]">
      <header className="h-16 border-b border-[#141414] flex items-center justify-between px-6 bg-white/30 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-[#141414]/60 hover:text-[#141414]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="h-6 w-px bg-[#141414]/20"></div>
          <div>
            <span className="text-[10px] uppercase font-bold opacity-50 block">Audit Flow</span>
            <span className="font-bold text-lg leading-tight block">MODEL_VALIDATION</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold opacity-50 block">Status</span>
          <span className="f-mono font-bold text-purple-600">IN DEVELOPMENT</span>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="relative mb-8">
          <FileCode2 className="w-32 h-32 text-[#141414]/10" />
          <Construction className="w-12 h-12 text-[#F27D26] absolute bottom-0 right-0 animate-bounce" />
        </div>
        
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Model Validation Engine</h1>
        <p className="text-lg text-[#141414]/60 max-w-xl mx-auto mb-8">
          The deep learning model validation flow (PKL, PT, ONNX, GGUF, H5) is currently under construction. Please check back later.
        </p>
        
        <Button size="lg" onClick={onBack} className="bg-[#141414] text-white hover:bg-[#F27D26]">
          Return to Dashboard
        </Button>
      </main>
    </div>
  );
}
