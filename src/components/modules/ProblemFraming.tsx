import React, { useState } from 'react';
import { useAudit } from '../../context/AuditContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { BrainCircuit } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

export function ProblemFraming() {
  const { problemFraming, setProblemFraming, addLlmMessage } = useAudit();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/llm/legitimacy', { questionnaire: problemFraming });
      addLlmMessage({
        type: 'legitimacy',
        title: 'Problem Framing Review',
        content: res.data.memo
      });
      toast.success('LLM review generated.');
    } catch (e: any) {
      toast.error('Failed to generate LLM review.', { description: e.response?.data?.error || e.message });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight uppercase">Problem Framing</h2>
        <p className="text-[10px] uppercase opacity-50 tracking-widest mt-1">Catch fairness problems before they are reduced to metrics.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Decision Questionnaire</CardTitle>
          <CardDescription>Describe the system's intended function and impact.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 bg-[#E4E3E0] m-4 border border-[#141414] shadow-inner p-4">
          <div className="space-y-2">
            <Label htmlFor="task">What decision is being automated?</Label>
            <Input id="task" value={problemFraming.taskDescription} onChange={(e) => setProblemFraming({...problemFraming, taskDescription: e.target.value})} placeholder="e.g. Rejecting loan applications automatically" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input id="domain" value={problemFraming.domain} onChange={(e) => setProblemFraming({...problemFraming, domain: e.target.value})} placeholder="e.g. Healthcare, Lending, Hiring" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="harm">Who may be harmed?</Label>
            <Input id="harm" value={problemFraming.stakeholders} onChange={(e) => setProblemFraming({...problemFraming, stakeholders: e.target.value})} placeholder="e.g. Low-income applicants" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseline">What is the baseline human process?</Label>
            <Textarea id="baseline" value={problemFraming.humanBaseline} onChange={(e) => setProblemFraming({...problemFraming, humanBaseline: e.target.value})} placeholder="e.g. Loan officers manually review applications taking 30 minutes each" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="benefit">What is the intended benefit of automation?</Label>
            <Textarea id="benefit" value={problemFraming.benefit} onChange={(e) => setProblemFraming({...problemFraming, benefit: e.target.value})} placeholder="e.g. Reduce review time entirely for 80% of applications" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 bg-white py-4 px-6 border-t border-[#141414] mt-4">
          <Button disabled={loading} onClick={handleSubmit}>
            {loading ? 'Evaluating...' : (
              <>
                <BrainCircuit className="w-4 h-4 mr-2" />
                Generate Legitimacy Review
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
