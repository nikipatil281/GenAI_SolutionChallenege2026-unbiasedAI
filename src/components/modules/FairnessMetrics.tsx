import React from 'react';
import { useAudit } from '../../context/AuditContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Scale, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { LlmCompanion } from '../ui/llm-companion';

export function FairnessMetrics() {
  const { fairnessMetrics, targetColumn } = useAudit();

  if (!fairnessMetrics || Object.keys(fairnessMetrics).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-[#141414]/20 rounded-lg text-[#141414]/50">
        <Scale className="w-12 h-12 mb-4 opacity-50" />
        <p>Run dataset analysis with protected attributes to see metrics.</p>
      </div>
    );
  }

  const selectedCols = Object.keys(fairnessMetrics);

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight uppercase">Fairness Engine</h2>
        <p className="text-[10px] uppercase opacity-50 tracking-widest mt-1">Evaluating outcome disparities across protected attributes for target {targetColumn}.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
      <Tabs defaultValue={selectedCols[0]} className="w-full">
        <TabsList className="mb-4">
          {selectedCols.map(col => (
            <TabsTrigger key={col} value={col}>{col}</TabsTrigger>
          ))}
        </TabsList>

        {selectedCols.map(col => {
          const metrics = fairnessMetrics[col];
          const chartData = Object.keys(metrics.groupMetrics).map(k => ({
            name: k,
            rate: metrics.groupMetrics[k].positiveRate * 100
          }));

          return (
            <TabsContent key={col} value={col} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-1">
                      <CardDescription>Demographic Parity Difference</CardDescription>
                      <HoverCard>
                        <HoverCardTrigger><Info className="w-3.5 h-3.5 text-gray-400 hover:text-black cursor-help" /></HoverCardTrigger>
                        <HoverCardContent>
                          <p className="font-bold mb-1">What this means:</p>
                          <p className="text-gray-600">The absolute difference in success rates between the most favored group and the least favored group.</p>
                          <p className="font-bold mt-2 mb-1">Example:</p>
                          <p className="text-gray-600">If Group A gets the loan 50% of the time, and Group B gets it 30% of the time, the difference is 20%.</p>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                    <CardTitle className="text-3xl">{(metrics.demographicParityDifference * 100).toFixed(1)}%</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-500">Difference in positive outcome rates between highest and lowest groups. Note: Requires normative justification.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-1">
                      <CardDescription>Demographic Parity Ratio</CardDescription>
                      <HoverCard>
                        <HoverCardTrigger><Info className="w-3.5 h-3.5 text-gray-400 hover:text-black cursor-help" /></HoverCardTrigger>
                        <HoverCardContent>
                          <p className="font-bold mb-1">What this means:</p>
                          <p className="text-gray-600">The ratio between the lowest success rate and the highest success rate. It helps check for massive disparities.</p>
                          <p className="font-bold mt-2 mb-1">The 80% Rule:</p>
                          <p className="text-gray-600">In US hiring law (EEOC), if this ratio falls below 80%, the system is generally considered discriminatory.</p>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                    <CardTitle className="text-3xl">{(metrics.demographicParityRatio * 100).toFixed(1)}%</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-500">Ratio of lowest to highest positive outcome rates. Often compared to 80% rule.</p>
                  </CardContent>
                </Card>
              </div>

              {metrics.equalOpportunityDifference !== undefined && (
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-[#F27D26]/30 bg-[#F27D26]/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-1">
                        <CardDescription className="text-[#F27D26] font-bold">Equal Opportunity Diff</CardDescription>
                        <HoverCard>
                          <HoverCardTrigger><Info className="w-3.5 h-3.5 text-[#F27D26] hover:text-black cursor-help" /></HoverCardTrigger>
                          <HoverCardContent>
                            <p className="font-bold mb-1">What this means (AIF360 Metric):</p>
                            <p className="text-gray-600">The difference in True Positive Rates between groups. Out of all people who *actually deserved* the good outcome, what percentage of each group actually got it?</p>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                      <CardTitle className="text-3xl">{(metrics.equalOpportunityDifference * 100).toFixed(1)}%</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-[#F27D26]/80">Disparity in True Positive Rates (requires ground truth label).</p>
                    </CardContent>
                  </Card>
                  <Card className="border-[#F27D26]/30 bg-[#F27D26]/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-1">
                        <CardDescription className="text-[#F27D26] font-bold">Average Odds Diff</CardDescription>
                        <HoverCard>
                          <HoverCardTrigger><Info className="w-3.5 h-3.5 text-[#F27D26] hover:text-black cursor-help" /></HoverCardTrigger>
                          <HoverCardContent>
                            <p className="font-bold mb-1">What this means (AIF360 Metric):</p>
                            <p className="text-gray-600">The average of the False Positive Rate difference and the True Positive Rate difference.</p>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                      <CardTitle className="text-3xl">{(metrics.averageOddsDifference * 100).toFixed(1)}%</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-[#F27D26]/80">Average of FPR disparity and TPR disparity.</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>Positive Selection Rate by Group</CardTitle>
                    <HoverCard>
                      <HoverCardTrigger><Info className="w-4 h-4 text-gray-400 hover:text-black cursor-help" /></HoverCardTrigger>
                      <HoverCardContent>
                        <p className="font-bold mb-1">What this means:</p>
                        <p className="text-gray-600">Simply: Out of all the people in a specific group who applied, what percentage got the "good" outcome?</p>
                        <p className="font-bold mt-2 mb-1">Example:</p>
                        <p className="text-gray-600">If 100 women applied and 30 were hired, the Positive Selection Rate is 30%.</p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <CardDescription>Percentage of positive outcomes per demographic group.</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip 
                         formatter={(value: number, name: string) => [value.toFixed(1) + '%', 'Positive Rate']} 
                         labelFormatter={(label) => `Group: ${label}`}
                      />
                      <Bar dataKey="rate" fill="#141414" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
        </div>

        <div className="sticky top-6 h-[calc(100vh-8rem)]">
          <LlmCompanion 
            title="Fairness Engine Interpretation"
            description="LLM Evaluation of Disparity Metrics"
            message={useAudit().llmMessages.find(m => m.type === 'subgroup')}
            loading={useAudit().loadingModules['fairness-metrics'] || false}
          />
        </div>
      </div>
    </div>
  );
}
