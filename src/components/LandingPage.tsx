import React from 'react';
import { Database, FileCode2, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';

interface LandingPageProps {
  onSelectFlow: (flow: 'tabular' | 'model') => void;
}

export function LandingPage({ onSelectFlow }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#141414] text-[#E4E3E0] flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-[#F27D26]/10 rounded-full mb-4">
            <ShieldAlert className="w-12 h-12 text-[#F27D26]" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase">BiasScope</h1>
          <p className="text-xl text-[#E4E3E0]/60 uppercase tracking-widest">Sociotechnical AI Auditor</p>
          <p className="max-w-2xl mx-auto text-[#E4E3E0]/40 mt-6">
            Select the type of AI system you want to audit. BiasScope provides specialized sociotechnical workflows for both raw training data and compiled model weights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Tabular Option */}
          <Card 
            className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#F27D26] cursor-pointer transition-all duration-300 group"
            onClick={() => onSelectFlow('tabular')}
          >
            <CardHeader>
              <div className="p-3 bg-blue-500/10 w-fit rounded border border-blue-500/20 mb-4 group-hover:bg-blue-500/20 transition-colors">
                <Database className="w-8 h-8 text-blue-400" />
              </div>
              <CardTitle className="text-2xl text-white uppercase tracking-tight">Audit Tabular Dataset</CardTitle>
              <CardDescription className="text-[#E4E3E0]/50">CSV / Excel Files</CardDescription>
            </CardHeader>
            <CardContent className="text-[#E4E3E0]/70">
              <ul className="space-y-2 list-disc pl-4 marker:text-[#F27D26]">
                <li>Proxy feature legitimacy screening</li>
                <li>Intersectional hidden harms analysis</li>
                <li>Human oversight failure modeling</li>
                <li>Full sociotechnical deployment memo</li>
              </ul>
            </CardContent>
          </Card>

          {/* Model Option */}
          <Card 
            className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#F27D26] cursor-pointer transition-all duration-300 group"
            onClick={() => onSelectFlow('model')}
          >
            <CardHeader>
              <div className="p-3 bg-purple-500/10 w-fit rounded border border-purple-500/20 mb-4 group-hover:bg-purple-500/20 transition-colors">
                <FileCode2 className="w-8 h-8 text-purple-400" />
              </div>
              <CardTitle className="text-2xl text-white uppercase tracking-tight">Audit Model File</CardTitle>
              <CardDescription className="text-[#E4E3E0]/50">PKL, PT, ONNX, H5, GGUF</CardDescription>
            </CardHeader>
            <CardContent className="text-[#E4E3E0]/70">
              <ul className="space-y-2 list-disc pl-4 marker:text-[#F27D26]">
                <li>Model architecture validation</li>
                <li>Weights & biases extraction</li>
                <li>Explainability (SHAP/LIME) testing</li>
                <li>Adversarial robustness checks</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
