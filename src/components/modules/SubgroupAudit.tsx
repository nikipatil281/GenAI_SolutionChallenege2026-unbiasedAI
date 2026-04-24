import React, { useState } from 'react';
import { useAudit } from '../../context/AuditContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Users, BrainCircuit } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function SubgroupAudit() {
  const { subgroups, fairnessMetrics, addLlmMessage } = useAudit();
  const [llmLoading, setLlmLoading] = useState(false);

  const getLlmReview = async () => {
    if (!subgroups) return;
    setLlmLoading(true);
    try {
      const res = await axios.post('/api/llm/fairness', { fairnessMetrics, subgroups });
      addLlmMessage({
        type: 'subgroup',
        title: 'Subgroup & Fairness Interpretation',
        content: res.data.summary
      });
      toast.success('LLM subgroup review generated.');
    } catch(e: any) {
      toast.error('LLM review failed', { description: e.response?.data?.error || e.message });
    }
    setLlmLoading(false);
  };

  if (!subgroups) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Users className="w-12 h-12 mb-4 opacity-20" />
        <p>Run dataset analysis with protected attributes to see subgroups.</p>
      </div>
    );
  }

  const sortedGroups = Object.keys(subgroups)
    .sort((a, b) => subgroups[a].positiveRate - subgroups[b].positiveRate);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight uppercase">Subgroup & Intersectional Audit</h2>
          <p className="text-[10px] uppercase opacity-50 tracking-widest mt-1">Detect harms hidden by aggregate analysis.</p>
        </div>
        <Button onClick={getLlmReview} disabled={llmLoading} variant="secondary">
          <BrainCircuit className="w-4 h-4 mr-2" />
          {llmLoading ? 'Reviewing...' : 'LLM Subgroup Review'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Worst-Affected Groups</CardTitle>
          <CardDescription>Groups sorted by lowest positive selection rate. Watch out for small samples!</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subgroup Identity</TableHead>
                <TableHead className="text-right">N (Sample Size)</TableHead>
                <TableHead className="text-right">Positive Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedGroups.map(group => {
                const count = subgroups[group].count;
                const isSmall = count < 50;
                return (
                  <TableRow key={group}>
                    <TableCell className="font-medium">{group}</TableCell>
                    <TableCell className="text-right">
                       {count}
                       {isSmall && <span className="ml-2 text-xs text-red-500 bg-red-50 px-1 py-0.5 rounded">Low N Alert</span>}
                    </TableCell>
                    <TableCell className="text-right">
                       <span className={subgroups[group].positiveRate < 0.2 ? 'text-red-600 font-bold' : ''}>
                         {(subgroups[group].positiveRate * 100).toFixed(1)}%
                       </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="text-sm p-4 bg-amber-50 rounded-lg text-amber-800 border border-amber-200">
         <strong>Fairness Gerrymandering Risk:</strong> Automatically selecting metric subsets can artificially make a system appear fair. Ensure your slices are grounded in sociological context, not just p-hacking.
      </div>
    </div>
  );
}
