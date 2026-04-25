import { LlmAgent } from '@google/adk';
import { dataAnalysisTool } from './tools.js';

export const analystAgent = new LlmAgent({
  name: 'Data_Analyst',
  description: 'An expert data analyst agent that analyzes datasets for demographic bias.',
  model: 'gemini-2.5-flash',
  instruction: `You are an AI auditor data analyst. 
Your job is to analyze datasets to find demographic imbalances and correlations between protected attributes and outcomes. 
Always use your analyze_dataset tool when a user provides a dataset.`,
  tools: [dataAnalysisTool]
});
