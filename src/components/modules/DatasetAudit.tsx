import React, { useState } from 'react';
import { useAudit } from '../../context/AuditContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Upload, Database, AlertTriangle, BrainCircuit } from 'lucide-react';
import Papa from 'papaparse';
import axios from 'axios';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';

export function DatasetAudit() {
  const { dataset, setDataset, datasetStats, setDatasetStats, setAssociations, setFairnessMetrics, setSubgroups, targetColumn, setTargetColumn, protectedColumns, setProtectedColumns, addLlmMessage } = useAudit();
  const [loading, setLoading] = useState(false);
  const [llmLoading, setLlmLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        setDataset(results.data);
        toast.success(`Successfully parsed ${results.data.length} rows.`);
        setLoading(false);
      },
      error: (err) => {
        toast.error('Failed to parse CSV.', { description: err.message });
        setLoading(false);
      }
    });
  };

  const runAnalysis = async () => {
    if (!dataset) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/audit/analyze', {
        data: dataset,
        targetColumn,
        protectedColumns,
        scoreColumn: null
      });
      setDatasetStats(res.data.datasetStats);
      if (res.data.associations) setAssociations(res.data.associations);
      if (res.data.fairness) setFairnessMetrics(res.data.fairness);
      if (res.data.subgroups) setSubgroups(res.data.subgroups);
      
      toast.success('Deterministic analysis complete.');
    } catch (e: any) {
      toast.error('Analysis failed.', { description: e.response?.data?.error || e.message });
    }
    setLoading(false);
  };

  const getLlmReview = async () => {
    if (!datasetStats) return;
    setLlmLoading(true);
    try {
      const res = await axios.post('/api/llm/dataset', { stats: datasetStats });
      addLlmMessage({
        type: 'dataset',
        title: 'Dataset Narrative Review',
        content: res.data.narrative
      });
      toast.success('LLM dataset review generated.');
    } catch(e: any) {
      toast.error('LLM review failed', { description: e.response?.data?.error || e.message });
    }
    setLlmLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight uppercase">Dataset Audit</h2>
        <p className="text-[10px] uppercase opacity-50 tracking-widest mt-1">Audit the dataset for representational and institutional distortions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Upload & Configuration</CardTitle>
          <CardDescription>Upload a CSV file and specify key columns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" className="relative cursor-pointer">
               <Upload className="w-4 h-4 mr-2" />
               Upload CSV
               <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Variable (Outcome)</label>
                <Select value={targetColumn} onValueChange={setTargetColumn}>
                  <SelectTrigger><SelectValue placeholder="Select outcome column" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(dataset[0]).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Primary Protected Attribute</label>
                <Select value={protectedColumns[0] || ''} onValueChange={(val) => setProtectedColumns([val])}>
                  <SelectTrigger><SelectValue placeholder="Select demographic feature" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(dataset[0]).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex gap-3">
             <Button onClick={runAnalysis} disabled={!dataset || loading}>
               {loading ? 'Analyzing...' : 'Run Deterministic Scan'}
             </Button>
             
             {datasetStats && (
               <Button onClick={getLlmReview} variant="secondary" disabled={llmLoading}>
                 <BrainCircuit className="w-4 h-4 mr-2" />
                 {llmLoading ? 'Generating Review...' : 'Generate LLM Narrative'}
               </Button>
             )}
          </div>
        </CardContent>
      </Card>

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
                     <TableHead>Column</TableHead>
                     <TableHead>Type</TableHead>
                     <TableHead>Missing</TableHead>
                     <TableHead>Unique Vals</TableHead>
                     <TableHead>Summary</TableHead>
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
  );
}
