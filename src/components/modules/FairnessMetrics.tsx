import React from 'react';
import { useAudit } from '../../context/AuditContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Scale } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function FairnessMetrics() {
  const { fairnessMetrics, protectedColumns, targetColumn } = useAudit();

  if (!fairnessMetrics) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Scale className="w-12 h-12 mb-4 opacity-20" />
        <p>Run dataset analysis with protected attributes to see metrics.</p>
      </div>
    );
  }

  const chartData = Object.keys(fairnessMetrics.groupMetrics).map(group => ({
    name: group,
    positiveRate: fairnessMetrics.groupMetrics[group].positiveRate * 100,
    count: fairnessMetrics.groupMetrics[group].count
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight uppercase">Fairness Metrics Portfolio</h2>
        <p className="text-[10px] uppercase opacity-50 tracking-widest mt-1">
          Evaluating outcome disparities across <strong>{protectedColumns[0]}</strong> for target <strong>{targetColumn}</strong>.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Demographic Parity Difference</CardDescription>
            <CardTitle className="text-3xl">{(fairnessMetrics.demographicParityDifference * 100).toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">Difference in positive outcome rates between highest and lowest groups. Note: Requires normative justification.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Demographic Parity Ratio</CardDescription>
            <CardTitle className="text-3xl">{(fairnessMetrics.demographicParityRatio * 100).toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">Ratio of lowest to highest positive outcome rates. Often compared to 80% rule.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Positive Selection Rate by Group</CardTitle>
          <CardDescription>Percentage of positive outcomes per demographic group.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                 formatter={(value: number, name: string) => [value.toFixed(1) + '%', 'Positive Rate']} 
                 labelFormatter={(label) => `Group: ${label}`}
              />
              <Bar dataKey="positiveRate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
