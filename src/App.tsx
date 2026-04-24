/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sidebar } from './components/Sidebar';
import { MainWorkspace } from './components/MainWorkspace';
import { LlmPanel } from './components/LlmPanel';
import { AuditProvider } from './context/AuditContext';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <AuditProvider>
      <div className="flex h-screen bg-[#E4E3E0] text-[#141414] font-sans">
        <Sidebar className="w-56 border-r border-[#141414] bg-[#141414] shrink-0" />
        <MainWorkspace className="flex-1 overflow-hidden" />
        <LlmPanel className="w-96 border-l border-[#141414] bg-white hidden xl:flex shrink-0" />
      </div>
      <Toaster />
    </AuditProvider>
  )
}

