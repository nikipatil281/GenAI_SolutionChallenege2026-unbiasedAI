import React, { useState } from 'react';
import { useAudit } from '../../context/AuditContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Target, AlertCircle, BrainCircuit, Check, X, HelpCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function ProxyScreening() {
  const { associations, targetColumn, addLlmMessage } = useAudit();
  const [llmLoading, setLlmLoading] = useState(false);
  const [featureStatus, setFeatureStatus] = useState<Record<string, string>>({});

  const handleStatusChange = (feature: string, status: string) => {
    setFeatureStatus(prev => ({ ...prev, [feature]: status }));
  };

  const getLlmReview = async () => {
    if (!associations) return;
    setLlmLoading(true);
    try {
      const res = await axios.post('/api/llm/proxy', { associations: associations.slice(0, 10) }); // Top 10
      addLlmMessage({
        type: 'proxy',
        title: 'Proxy Legitimacy Review',
        content: res.data.evaluation
      });
      toast.success('LLM proxy review generated.');
    } catch(e: any) {
      toast.error('LLM review failed', { description: e.response?.data?.error || e.message });
    }
    setLlmLoading(false);
  };

  if (!associations) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Target className="w-12 h-12 mb-4 opacity-20" />
        <p>Run dataset analysis first to see proxy screenings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight uppercase">Proxy Screening</h2>
          <p className="text-[10px] uppercase opacity-50 tracking-widest mt-1">Identify features that may be acting as discriminatory stand-ins for protected traits.</p>
        </div>
        <Button onClick={getLlmReview} disabled={llmLoading} variant="secondary">
          <BrainCircuit className="w-4 h-4 mr-2" />
          {llmLoading ? 'Reviewing...' : 'LLM Proxy Review'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Association with Target: {targetColumn}</CardTitle>
          <CardDescription>Deterministic correlation/overlap scores. Note: this is a simple approximation.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead>Association Score</TableHead>
                <TableHead>Review Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {associations.map((assoc) => {
                const status = featureStatus[assoc.feature] || 'Unreviewed';
                return (
                  <TableRow key={assoc.feature}>
                    <TableCell className="font-medium">{assoc.feature}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                         <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, Math.max(0, assoc.score * 100))}%` }} />
                         </div>
                         <span className="text-xs text-gray-500">{(assoc.score).toFixed(3)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status === 'Accepted' ? 'outline' : status === 'Contested' ? 'destructive' : 'secondary'}>
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                         <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleStatusChange(assoc.feature, 'Accepted')}>
                           <Check className="w-4 h-4" />
                         </Button>
                         <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600" onClick={() => handleStatusChange(assoc.feature, 'Requires Human Review')}>
                           <HelpCircle className="w-4 h-4" />
                         </Button>
                         <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleStatusChange(assoc.feature, 'Contested')}>
                           <X className="w-4 h-4" />
                         </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
