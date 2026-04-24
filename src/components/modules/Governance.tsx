import React, { useState } from 'react';
import { useAudit } from '../../context/AuditContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { BrainCircuit } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

export function Governance() {
  const { governance, setGovernance, addLlmMessage } = useAudit();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/llm/governance', { questionnaire: governance });
      addLlmMessage({
        type: 'governance',
        title: 'Governance & Human Oversight Risk',
        content: res.data.summary
      });
      toast.success('Governance review generated.');
    } catch (e: any) {
      toast.error('Failed to generate governance review.', { description: e.response?.data?.error || e.message });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight uppercase">Governance & Oversight</h2>
        <p className="text-[10px] uppercase opacity-50 tracking-widest mt-1">Challenge the naive assumption that humans fix bias.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Human Oversight Preparedness</CardTitle>
          <CardDescription>Detail the mechanisms for contesting and overriding automated decisions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Who reviews model outputs?</Label>
            <Select onValueChange={(v) => setGovernance({...governance, reviewerId: v})} value={governance.reviewerId}>
              <SelectTrigger><SelectValue placeholder="Select reviewer" /></SelectTrigger>
              <SelectContent>
                 <SelectItem value="expert">Dedicated Domain Expert</SelectItem>
                 <SelectItem value="worker">Frontline Worker (time constrained)</SelectItem>
                 <SelectItem value="automated">Fully Automated (no human in loop)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Can human reviewers override the system?</Label>
            <Select onValueChange={(v) => setGovernance({...governance, canOverride: v})} value={governance.canOverride}>
              <SelectTrigger><SelectValue placeholder="Select override policy" /></SelectTrigger>
              <SelectContent>
                 <SelectItem value="easily">Yes, easily with no penalty</SelectItem>
                 <SelectItem value="justification">Yes, but requires heavy written justification</SelectItem>
                 <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

           <div className="space-y-2">
            <Label>What evidence is shown to the reviewer?</Label>
            <Select onValueChange={(v) => setGovernance({...governance, evidenceShown: v})} value={governance.evidenceShown}>
              <SelectTrigger><SelectValue placeholder="Select evidence level" /></SelectTrigger>
              <SelectContent>
                 <SelectItem value="full">Full contextual file + model score</SelectItem>
                 <SelectItem value="score_only">Only the model score and top 3 factors</SelectItem>
                 <SelectItem value="none">No insight into model reasoning</SelectItem>
              </SelectContent>
            </Select>
          </div>

           <div className="space-y-2">
            <Label>Expected speed of decision per case</Label>
            <Select onValueChange={(v) => setGovernance({...governance, speedOfDecision: v})} value={governance.speedOfDecision}>
              <SelectTrigger><SelectValue placeholder="Select speed" /></SelectTrigger>
              <SelectContent>
                 <SelectItem value="seconds">Seconds (High risk of automation bias)</SelectItem>
                 <SelectItem value="minutes">Minutes</SelectItem>
                 <SelectItem value="hours">Hours or Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 bg-white py-4 px-6 border-t border-[#141414] mt-4">
          <Button disabled={loading} onClick={handleSubmit}>
            {loading ? 'Evaluating...' : (
              <>
                <BrainCircuit className="w-4 h-4 mr-2" />
                Generate Oversight Failure Memo
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
