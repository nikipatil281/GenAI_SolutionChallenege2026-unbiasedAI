import { LlmAgent } from '@google/adk';
import { analystAgent } from './analyst.js';
import { redTeamerAgent } from './red_teamer.js';

export const coordinatorAgent = new LlmAgent({
  name: 'Coordinator',
  description: 'I coordinate AI auditing and red teaming tasks, delegating to specialized agents.',
  model: 'gemini-2.5-flash',
  instruction: `You are the Coordinator for an Automated AI Auditor system. 
You are the primary interface for the user.
When a user wants to audit an AI system:
1. Understand their model and dataset.
2. Delegate data analysis tasks to the Data_Analyst agent.
3. Delegate adversarial testing to the Red_Teamer agent.
4. Compile their findings into a final, human-readable Bias Report.`,
  subAgents: [analystAgent, redTeamerAgent]
});
