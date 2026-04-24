/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainWorkspace } from './components/MainWorkspace';
import { LandingPage } from './components/LandingPage';
import { ModelAuditPage } from './components/ModelAuditPage';
import { AuditProvider } from './context/AuditContext';
import { Toaster } from 'sonner';

export default function App() {
  const [flow, setFlow] = useState<'landing' | 'tabular' | 'model'>('landing');

  return (
    <AuditProvider>
      {flow === 'landing' && <LandingPage onSelectFlow={setFlow} />}
      
      {flow === 'model' && <ModelAuditPage onBack={() => setFlow('landing')} />}

      {flow === 'tabular' && (
        <div className="flex h-screen bg-[#E4E3E0] text-[#141414] font-sans">
          <Sidebar 
            className="w-56 border-r border-[#141414] bg-[#141414] shrink-0" 
            onBackToHome={() => setFlow('landing')} 
          />
          <MainWorkspace className="flex-1 overflow-hidden" />
        </div>
      )}
      
      <Toaster />
    </AuditProvider>
  )
}

