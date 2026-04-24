import React, { createContext, useContext, useState, ReactNode } from 'react';

type AuditContextType = {
  activeModule: string;
  setActiveModule: (id: string) => void;
  dataset: any[] | null;
  setDataset: (data: any[] | null) => void;
  datasetStats: any | null;
  setDatasetStats: (stats: any) => void;
  problemFraming: any;
  setProblemFraming: (data: any) => void;
  associations: any[] | null;
  setAssociations: (assoc: any[]) => void;
  fairnessMetrics: any | null;
  setFairnessMetrics: (metrics: any) => void;
  subgroups: any | null;
  setSubgroups: (groups: any) => void;
  governance: any;
  setGovernance: (data: any) => void;
  targetColumn: string;
  setTargetColumn: (col: string) => void;
  groundTruthColumn: string;
  setGroundTruthColumn: (col: string) => void;
  protectedColumns: string[];
  setProtectedColumns: (cols: string[]) => void;
  llmMessages: { type: string; title: string; content: string }[];
  addLlmMessage: (message: { type: string; title: string; content: string }) => void;
  clearLlmMessages: (type?: string) => void;
  systemDecision: any | null;
  setSystemDecision: (decision: any) => void;
  loadingModules: Record<string, boolean>;
  setLoadingModules: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
};

const AuditContext = createContext<AuditContextType | undefined>(undefined);

export const AuditProvider = ({ children }: { children: ReactNode }) => {
  const [activeModule, setActiveModule] = useState('project-setup');
  const [dataset, setDataset] = useState<any[] | null>(null);
  const [datasetStats, setDatasetStats] = useState<any | null>(null);
  const [associations, setAssociations] = useState<any[] | null>(null);
  const [fairnessMetrics, setFairnessMetrics] = useState<any | null>(null);
  const [subgroups, setSubgroups] = useState<any | null>(null);
  const [targetColumn, setTargetColumn] = useState('');
  const [groundTruthColumn, setGroundTruthColumn] = useState('');
  const [protectedColumns, setProtectedColumns] = useState<string[]>([]);
  const [systemDecision, setSystemDecision] = useState<any | null>(null);
  
  const [problemFraming, setProblemFraming] = useState({
    taskDescription: '',
    domain: '',
    stakeholders: '',
    humanBaseline: '',
    benefit: ''
  });

  const [governance, setGovernance] = useState({
    reviewerId: '',
    canOverride: '',
    evidenceShown: '',
    speedOfDecision: ''
  });

  const [llmMessages, setLlmMessages] = useState<{ type: string; title: string; content: string }[]>([]);
  const [loadingModules, setLoadingModules] = useState<Record<string, boolean>>({});

  const addLlmMessage = (msg: { type: string; title: string; content: string }) => {
    setLlmMessages(prev => {
      const idx = prev.findIndex(m => m.type === msg.type);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = msg;
        return next;
      }
      return [msg, ...prev];
    });
  };

  const clearLlmMessages = (type?: string) => {
    if (type) {
      setLlmMessages(prev => prev.filter(m => m.type !== type));
    } else {
      setLlmMessages([]);
    }
  };

  return (
    <AuditContext.Provider value={{
      activeModule, setActiveModule,
      dataset, setDataset,
      datasetStats, setDatasetStats,
      problemFraming, setProblemFraming,
      associations, setAssociations,
      fairnessMetrics, setFairnessMetrics,
      subgroups, setSubgroups,
      governance, setGovernance,
      targetColumn, setTargetColumn,
      groundTruthColumn, setGroundTruthColumn,
      protectedColumns, setProtectedColumns,
      llmMessages, addLlmMessage, clearLlmMessages,
      systemDecision, setSystemDecision,
      loadingModules, setLoadingModules
    }}>
      {children}
    </AuditContext.Provider>
  );
};

export const useAudit = () => {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useAudit must be used within AuditProvider");
  return ctx;
};
