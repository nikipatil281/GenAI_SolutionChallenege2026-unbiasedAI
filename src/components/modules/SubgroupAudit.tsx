import React, { useState } from 'react';
import { useAudit } from '../../context/AuditContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Users, BrainCircuit, Info } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';
import { LlmCompanion } from '../ui/llm-companion';

export function SubgroupAudit() {
  const { subgroups, fairnessMetrics, addLlmMessage, loadingModules } = useAudit();
  const llmLoading = loadingModules['subgroup-audit'] || false;



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
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Worst-Affected Groups</CardTitle>
          <CardDescription>Groups sorted by lowest positive selection rate. Watch out for small samples!</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Subgroup Identity
                    <HoverCard>
                      <HoverCardTrigger><Info className="w-3.5 h-3.5 text-gray-400 hover:text-black cursor-help" /></HoverCardTrigger>
                      <HoverCardContent>
                        <p className="font-bold mb-1">What this means:</p>
                        <p className="text-gray-600">The intersection of multiple identities. Bias often hides here even if the overall group looks fair.</p>
                        <p className="font-bold mt-2 mb-1">Example:</p>
                        <p className="text-gray-600">Looking at "Black Women" instead of just "Black" people or just "Women".</p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    N (Sample Size)
                    <HoverCard>
                      <HoverCardTrigger><Info className="w-3.5 h-3.5 text-gray-400 hover:text-black cursor-help" /></HoverCardTrigger>
                      <HoverCardContent className="text-left">
                        <p className="font-bold mb-1">What this means:</p>
                        <p className="text-gray-600">The number of people in this specific subgroup.</p>
                        <p className="font-bold mt-2 mb-1">Why it matters:</p>
                        <p className="text-gray-600">If a group has fewer than 50 people, the success rates are statistically unreliable (Low N Alert).</p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    Positive Rate
                    <HoverCard>
                      <HoverCardTrigger><Info className="w-3.5 h-3.5 text-gray-400 hover:text-black cursor-help" /></HoverCardTrigger>
                      <HoverCardContent className="text-left">
                        <p className="font-bold mb-1">What this means:</p>
                        <p className="text-gray-600">The percentage of people in this specific subgroup who received the favorable outcome.</p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </TableHead>
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
      <div className="text-sm p-4 bg-amber-50 rounded-lg text-amber-800 border border-amber-200 mt-4">
         <strong>Fairness Gerrymandering Risk:</strong> Automatically selecting metric subsets can artificially make a system appear fair. Ensure your slices are grounded in sociological context, not just p-hacking.
      </div>
        </div>

        <div className="sticky top-6 h-[calc(100vh-8rem)]">
          <LlmCompanion 
            title="Subgroup & Fairness Interpretation"
            description="LLM Evaluation of Hidden Harms"
            message={useAudit().llmMessages.find(m => m.type === 'subgroup')}
            loading={llmLoading}
          />
        </div>
      </div>
    </div>
  );
}
