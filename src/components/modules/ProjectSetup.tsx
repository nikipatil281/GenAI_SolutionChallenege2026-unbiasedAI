import React, { useState } from 'react';
import { useAudit } from '../../context/AuditContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { BrainCircuit, Upload, Database, Sparkles, Info } from 'lucide-react';
import { Badge } from '../ui/badge';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';
import { LlmCompanion } from '../ui/llm-companion';

export function ProjectSetup() {
  // Context state
  const { 
    problemFraming, setProblemFraming, addLlmMessage, clearLlmMessages,
    dataset, setDataset, datasetStats, setDatasetStats, setAssociations, setFairnessMetrics, setSubgroups, 
    targetColumn, setTargetColumn, groundTruthColumn, setGroundTruthColumn, 
    protectedColumns, setProtectedColumns, loadingModules, setLoadingModules
  } = useAudit();
  
  // Local loading states
  const [uploadLoading, setUploadLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);

  // Dataset Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);

    const processData = async (data: any[]) => {
      setDataset(data);
      toast.success(`Successfully parsed ${data.length} rows. Analyzing schema...`);
      
      // Auto-detect protected attributes
      try {
        const columns = Object.keys(data[0] || {});
        const sampleData = data.slice(0, 3);
        const res = await axios.post('/api/llm/detect-protected', { columns, sampleData });
        
        if (res.data.protectedCols && res.data.protectedCols.length > 0) {
          setProtectedColumns(res.data.protectedCols);
          toast.success(`Auto-detected protected attribute: ${res.data.protectedCols[0]}`);
        } else {
          toast.info('Could not auto-detect protected attribute. Please select manually.');
        }
      } catch (err) {
        console.error("Auto-detect failed", err);
      }

      setUploadLoading(false);
    };

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => processData(results.data),
        error: (err) => {
          toast.error('Failed to parse CSV.', { description: err.message });
          setUploadLoading(false);
        }
      });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { defval: null });
          processData(data);
        } catch (err: any) {
          toast.error('Failed to parse Excel file.', { description: err.message });
          setUploadLoading(false);
        }
      };
      reader.onerror = () => {
         toast.error('Error reading file.');
         setUploadLoading(false);
      };
      reader.readAsBinaryString(file);
    } else {
      toast.error('Unsupported file type. Please upload CSV or Excel.');
      setUploadLoading(false);
    }
  };

  const runUnifiedAudit = async () => {
    if (!dataset) {
      toast.error('Please upload a dataset first.');
      return;
    }
    
    setAuditLoading(true);
    
    try {
      // 1. Run Deterministic Scan
      const scanRes = await axios.post('/api/audit/analyze', {
        data: dataset,
        targetColumn,
        groundTruthColumn,
        protectedColumns
      });
      
      setDatasetStats(scanRes.data.datasetStats);
      if (scanRes.data.associations) setAssociations(scanRes.data.associations);
      if (scanRes.data.fairness) setFairnessMetrics(scanRes.data.fairness);
      if (scanRes.data.subgroups) setSubgroups(scanRes.data.subgroups);
      
      toast.success('Deterministic analysis complete. Initiating Sociotechnical Waterfall...');
      setAuditLoading(false); // Turn off main button loading, as we shift to modules

      // Clear previous memos
      clearLlmMessages();

      // ==========================================
      // WATERFALL LLM PIPELINE
      // ==========================================

      // STEP 1: Project Setup Memo
      setLoadingModules(prev => ({ ...prev, 'project-setup': true }));
      const llmRes1 = await axios.post('/api/llm/project-setup', { 
        questionnaire: problemFraming,
        stats: scanRes.data.datasetStats
      });
      addLlmMessage({
        type: 'project-setup',
        title: 'Project Setup Review',
        content: llmRes1.data.memo
      });
      setLoadingModules(prev => ({ ...prev, 'project-setup': false }));

      // STEP 2: Proxy Legitimacy Review
      setLoadingModules(prev => ({ ...prev, 'proxy-screening': true }));
      const llmRes2 = await axios.post('/api/llm/proxy', { associations: scanRes.data.associations.slice(0, 10) });
      addLlmMessage({
        type: 'proxy',
        title: 'Proxy Legitimacy Review',
        content: llmRes2.data.evaluation
      });
      setLoadingModules(prev => ({ ...prev, 'proxy-screening': false }));

      // STEP 3 & 4: Subgroup & Fairness Interpretation
      setLoadingModules(prev => ({ ...prev, 'fairness-metrics': true, 'subgroup-audit': true }));
      const llmRes3 = await axios.post('/api/llm/fairness', { 
        fairnessMetrics: scanRes.data.fairness, 
        subgroups: scanRes.data.subgroups 
      });
      addLlmMessage({
        type: 'subgroup',
        title: 'Subgroup & Fairness Interpretation',
        content: llmRes3.data.summary
      });
      setLoadingModules(prev => ({ ...prev, 'fairness-metrics': false, 'subgroup-audit': false }));

      toast.success('Sociotechnical analysis complete. Awaiting Governance review.');

    } catch (e: any) {
      toast.error('Audit failed.', { description: e.response?.data?.error || e.message });
      setAuditLoading(false);
      setLoadingModules({});
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight uppercase">Project Setup</h2>
        <p className="text-[10px] uppercase opacity-50 tracking-widest mt-1">Define the problem framing and upload your dataset to begin the audit.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">

      {/* SECTION 1: PROBLEM FRAMING */}
      <Card>
        <CardHeader>
          <CardTitle>Decision Questionnaire</CardTitle>
          <CardDescription>Describe the system's intended function and impact.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 bg-[#E4E3E0] m-4 border border-[#141414] shadow-inner p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="task">What decision is being automated?</Label>
              <HoverCard>
                <HoverCardTrigger><Info className="w-4 h-4 text-gray-500 hover:text-black cursor-help" /></HoverCardTrigger>
                <HoverCardContent>
                  <p className="font-bold mb-1">What this means:</p>
                  <p className="text-gray-600">The specific yes/no or classification choice the AI will make.</p>
                  <p className="font-bold mt-2 mb-1">Example:</p>
                  <p className="text-gray-600">"Automatically rejecting resumes without human review" or "Flagging a transaction as fraudulent."</p>
                </HoverCardContent>
              </HoverCard>
            </div>
            <Input id="task" value={problemFraming.taskDescription} onChange={(e) => setProblemFraming({...problemFraming, taskDescription: e.target.value})} placeholder="e.g. Rejecting loan applications automatically" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="domain">Domain</Label>
              <HoverCard>
                <HoverCardTrigger><Info className="w-4 h-4 text-gray-500 hover:text-black cursor-help" /></HoverCardTrigger>
                <HoverCardContent>
                  <p className="font-bold mb-1">What this means:</p>
                  <p className="text-gray-600">The industry or context where the AI is operating. Some domains have strict legal regulations.</p>
                  <p className="font-bold mt-2 mb-1">Example:</p>
                  <p className="text-gray-600">Healthcare, Criminal Justice, Financial Lending, Hiring.</p>
                </HoverCardContent>
              </HoverCard>
            </div>
            <Input id="domain" value={problemFraming.domain} onChange={(e) => setProblemFraming({...problemFraming, domain: e.target.value})} placeholder="e.g. Healthcare, Lending, Hiring" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="harm">Who may be harmed?</Label>
              <HoverCard>
                <HoverCardTrigger><Info className="w-4 h-4 text-gray-500 hover:text-black cursor-help" /></HoverCardTrigger>
                <HoverCardContent>
                  <p className="font-bold mb-1">What this means:</p>
                  <p className="text-gray-600">The specific groups of people who might suffer if the AI makes a mistake.</p>
                  <p className="font-bold mt-2 mb-1">Example:</p>
                  <p className="text-gray-600">"Low-income loan applicants" or "Patients with rare diseases."</p>
                </HoverCardContent>
              </HoverCard>
            </div>
            <Input id="harm" value={problemFraming.stakeholders} onChange={(e) => setProblemFraming({...problemFraming, stakeholders: e.target.value})} placeholder="e.g. Low-income applicants" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="baseline">What is the baseline human process?</Label>
              <HoverCard>
                <HoverCardTrigger><Info className="w-4 h-4 text-gray-500 hover:text-black cursor-help" /></HoverCardTrigger>
                <HoverCardContent>
                  <p className="font-bold mb-1">What this means:</p>
                  <p className="text-gray-600">How is this decision made *today* without AI? We need to know what we are replacing.</p>
                  <p className="font-bold mt-2 mb-1">Example:</p>
                  <p className="text-gray-600">"Three loan officers manually review files taking 45 mins each."</p>
                </HoverCardContent>
              </HoverCard>
            </div>
            <Textarea id="baseline" value={problemFraming.humanBaseline} onChange={(e) => setProblemFraming({...problemFraming, humanBaseline: e.target.value})} placeholder="e.g. Loan officers manually review applications taking 30 minutes each" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="benefit">What is the intended benefit of automation?</Label>
              <HoverCard>
                <HoverCardTrigger><Info className="w-4 h-4 text-gray-500 hover:text-black cursor-help" /></HoverCardTrigger>
                <HoverCardContent>
                  <p className="font-bold mb-1">What this means:</p>
                  <p className="text-gray-600">Why are you building this? What metric are you trying to improve?</p>
                  <p className="font-bold mt-2 mb-1">Example:</p>
                  <p className="text-gray-600">"To reduce review time by 80% so humans only review edge cases."</p>
                </HoverCardContent>
              </HoverCard>
            </div>
            <Textarea id="benefit" value={problemFraming.benefit} onChange={(e) => setProblemFraming({...problemFraming, benefit: e.target.value})} placeholder="e.g. Reduce review time entirely for 80% of applications" />
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: DATASET UPLOAD */}
      <Card>
        <CardHeader>
          <CardTitle>Data Upload & Configuration</CardTitle>
          <CardDescription>Upload a CSV file and specify key columns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" className="relative cursor-pointer" disabled={uploadLoading}>
               <Upload className="w-4 h-4 mr-2" />
               {uploadLoading ? 'Uploading...' : 'Upload CSV / Excel'}
               <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploadLoading} />
            </Button>
            {dataset && (
              <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
                <Database className="w-3 h-3 mr-1" />
                {dataset.length} rows loaded
              </Badge>
            )}
          </div>

          {dataset && dataset.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-[#F27D26]">Model Prediction (Target)</label>
                    <HoverCard>
                      <HoverCardTrigger><Info className="w-4 h-4 text-gray-500 hover:text-black cursor-help" /></HoverCardTrigger>
                      <HoverCardContent>
                        <p className="font-bold mb-1">What this means:</p>
                        <p className="text-gray-600">The specific column containing the AI's predicted outcome or score.</p>
                        <p className="font-bold mt-2 mb-1">Example:</p>
                        <p className="text-gray-600">"Model_Decision" or "Risk Score" (1-100).</p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <Select value={targetColumn} onValueChange={setTargetColumn}>
                    <SelectTrigger><SelectValue placeholder="Select prediction column" /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(dataset[0]).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-purple-600">Ground Truth Label (Optional)</label>
                    <HoverCard>
                      <HoverCardTrigger><Info className="w-4 h-4 text-gray-500 hover:text-black cursor-help" /></HoverCardTrigger>
                      <HoverCardContent>
                        <p className="font-bold mb-1">Why provide this?</p>
                        <p className="text-gray-600">If you have the actual, real-world outcomes, select it here. This unlocks advanced AIF360 Classification Metrics like True Positive Rate and Equal Opportunity.</p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <Select value={groundTruthColumn} onValueChange={setGroundTruthColumn}>
                    <SelectTrigger><SelectValue placeholder="Select ground truth column" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- None --</SelectItem>
                      {Object.keys(dataset[0]).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Primary Protected Attribute</label>
                    <HoverCard>
                      <HoverCardTrigger><Info className="w-4 h-4 text-gray-500 hover:text-black cursor-help" /></HoverCardTrigger>
                      <HoverCardContent>
                        <p className="font-bold mb-1">What this means:</p>
                        <p className="text-gray-600">The demographic columns used to test if the model is biased against a certain group. You can select multiple!</p>
                        <p className="font-bold mt-2 mb-1">Example:</p>
                        <p className="text-gray-600">Race, Gender, Age, or Zip Code.</p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  {protectedColumns.length > 0 && (
                    <span className="text-[10px] text-green-600 font-bold flex items-center bg-green-100 px-2 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3 mr-1" /> Auto-detected
                    </span>
                  )}
                </div>
                <div className="border rounded-md h-32 overflow-y-auto p-2 space-y-1 bg-white">
                  {Object.keys(dataset[0]).map(k => (
                    <label key={k} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300"
                        checked={protectedColumns.includes(k)}
                        onChange={() => {
                          if (protectedColumns.includes(k)) {
                            setProtectedColumns(protectedColumns.filter(c => c !== k));
                          } else {
                            setProtectedColumns([...protectedColumns, k]);
                          }
                        }}
                      />
                      {k}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 3: SCAN RESULTS */}
      {datasetStats && (
        <Card>
          <CardHeader>
            <CardTitle>Deterministic Scan Results</CardTitle>
            <CardDescription>Basic statistical summaries and data schema</CardDescription>
          </CardHeader>
          <CardContent>
             <ScrollArea className="h-80 w-full rounded-md border">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>
                       <div className="flex items-center gap-1">
                         Column
                         <HoverCard>
                           <HoverCardTrigger><Info className="w-3.5 h-3.5 text-gray-400 hover:text-black cursor-help" /></HoverCardTrigger>
                           <HoverCardContent>
                             <p className="font-bold mb-1">What this means:</p>
                             <p className="text-gray-600">The exact name of the column found in your CSV file.</p>
                           </HoverCardContent>
                         </HoverCard>
                       </div>
                     </TableHead>
                     <TableHead>
                       <div className="flex items-center gap-1">
                         Type
                         <HoverCard>
                           <HoverCardTrigger><Info className="w-3.5 h-3.5 text-gray-400 hover:text-black cursor-help" /></HoverCardTrigger>
                           <HoverCardContent>
                             <p className="font-bold mb-1">What this means:</p>
                             <p className="text-gray-600">Whether the data is text (string) or numbers. The engine infers this automatically.</p>
                           </HoverCardContent>
                         </HoverCard>
                       </div>
                     </TableHead>
                     <TableHead>
                       <div className="flex items-center gap-1">
                         Missing
                         <HoverCard>
                           <HoverCardTrigger><Info className="w-3.5 h-3.5 text-gray-400 hover:text-black cursor-help" /></HoverCardTrigger>
                           <HoverCardContent>
                             <p className="font-bold mb-1">What this means:</p>
                             <p className="text-gray-600">How many rows have blank or missing values for this column. High missingness can ruin fairness metrics.</p>
                           </HoverCardContent>
                         </HoverCard>
                       </div>
                     </TableHead>
                     <TableHead>
                       <div className="flex items-center gap-1">
                         Unique Vals
                         <HoverCard>
                           <HoverCardTrigger><Info className="w-3.5 h-3.5 text-gray-400 hover:text-black cursor-help" /></HoverCardTrigger>
                           <HoverCardContent>
                             <p className="font-bold mb-1">What this means:</p>
                             <p className="text-gray-600">How many distinct values exist in this column. (e.g., a "Gender" column might have 3 unique values).</p>
                           </HoverCardContent>
                         </HoverCard>
                       </div>
                     </TableHead>
                     <TableHead>
                       <div className="flex items-center gap-1">
                         Summary
                         <HoverCard>
                           <HoverCardTrigger><Info className="w-3.5 h-3.5 text-gray-400 hover:text-black cursor-help" /></HoverCardTrigger>
                           <HoverCardContent>
                             <p className="font-bold mb-1">What this means:</p>
                             <p className="text-gray-600">A quick snapshot of the data: Min/Max for numbers, or a list of options for text categories.</p>
                           </HoverCardContent>
                         </HoverCard>
                       </div>
                     </TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                    {datasetStats.columns.map((col: string) => {
                      const stat = datasetStats.stats[col];
                      return (
                        <TableRow key={col}>
                          <TableCell className="font-medium whitespace-nowrap">{col}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{stat.inferredType}</Badge>
                          </TableCell>
                          <TableCell>
                            {stat.missing} 
                            {stat.missingPercentage > 0 && <span className="text-red-500 text-xs ml-1">({stat.missingPercentage.toFixed(1)}%)</span>}
                          </TableCell>
                          <TableCell>{stat.uniqueCount}</TableCell>
                          <TableCell className="text-xs text-gray-500">
                             {stat.inferredType === 'number' && stat.mean !== undefined && (
                               <span>Mean: {stat.mean.toFixed(2)} | Min: {stat.min} | Max: {stat.max}</span>
                             )}
                             {stat.inferredType === 'string' && stat.uniqueCount < 5 && stat.uniqueValues && (
                               <span>Vals: {stat.uniqueValues.join(', ')}</span>
                             )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                 </TableBody>
               </Table>
             </ScrollArea>
          </CardContent>
        </Card>
      )}
      </div>

      <div className="sticky top-6 h-[calc(100vh-8rem)]">
        <LlmCompanion 
          title="Sociotechnical Setup Review"
          description="LLM Evaluation of Problem Framing & Data"
          message={useAudit().llmMessages.find(m => m.type === 'project-setup')}
          loading={loadingModules['project-setup']}
        />
      </div>
    </div>

      {/* UNIFIED SUBMIT ACTION */}
      <div className="fixed bottom-0 left-56 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-[#141414] flex justify-end z-10">
        <div className="relative group">
          <Button size="lg" className="w-full sm:w-auto" onClick={runUnifiedAudit} disabled={!dataset || !targetColumn || protectedColumns.length === 0 || auditLoading}>
            <BrainCircuit className="w-5 h-5 mr-2" />
            {auditLoading ? 'Running Comprehensive Audit...' : 'Run Unified Setup Audit'}
          </Button>
          {(!dataset || !targetColumn || protectedColumns.length === 0) && (
            <div className="absolute -top-12 right-0 hidden group-hover:block z-50">
              <div className="w-64 p-3 bg-red-100 border border-red-500 rounded text-xs text-red-900 shadow-lg">
                <strong>Cannot Run Audit Yet:</strong>
                <ul className="list-disc pl-4 mt-1">
                  {!dataset && <li>Please upload a dataset.</li>}
                  {dataset && !targetColumn && <li>Please select a Target Variable.</li>}
                  {dataset && protectedColumns.length === 0 && <li>Please select a Protected Attribute.</li>}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
