import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      ai = new GoogleGenAI({ apiKey });
    }
  }
  return ai;
}

export async function evaluateLegitimacy(questionnaire: any) {
  const aiClient = getAI();
  if (!aiClient) return "LLM reasoning unavailable - API key required.";
  
  const prompt = `You are a sociotechnical bias auditor evaluating a proposed AI system.
Task: Write a Legitimacy Memo. 
Questionnaire Answers: ${JSON.stringify(questionnaire, null, 2)}
Is the target variable morally defensible? Will it encode historical deprivation? 
Could this decision be too socially contested to automate responsibly?`;

  const response = await aiClient.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt
  });
  return response.text;
}

export async function generateDatasetNarrative(stats: any) {
  const aiClient = getAI();
  if (!aiClient) return "LLM reasoning unavailable - API key required.";
  
  const prompt = `You are an AI auditor. Review these dataset statistics:
${JSON.stringify(stats, null, 2)}
Explain what these issues may mean socially. What hidden concerns like selective visibility, historical exclusion, or institutional over-surveillance might be present? Produce a narrative: "What this data may actually be measuring".`;

  const response = await aiClient.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt
  });
  return response.text;
}

export async function evaluateProxies(associations: any) {
  const aiClient = getAI();
  if (!aiClient) return "LLM reasoning unavailable - API key required.";
  
  const prompt = `Review these feature associations with the target variable:
${JSON.stringify(associations, null, 2)}

Provide a "proxy legitimacy review" explaining why top associated features may be job-relevant, structurally contaminated, or context-dependent.`;

  const response = await aiClient.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt
  });
  return response.text;
}

export async function generateFairnessSummary(fairnessMetrics: any, subgroups: any) {
  const aiClient = getAI();
  if (!aiClient) return "LLM reasoning unavailable - API key required.";
  
  const prompt = `Review these fairness metrics and subgroup statistics:
Fairness Metrics: ${JSON.stringify(fairnessMetrics, null, 2)}
Subgroups: ${JSON.stringify(subgroups, null, 2)}

Summarize subgroup harms in plain language. Explain why "fair overall" may still be harmful. Prioritize which subgroup harms deserve escalation. What does this capture and what does it miss?`;

  const response = await aiClient.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt
  });
  return response.text;
}

export async function summarizeGovernance(questionnaire: any) {
  const aiClient = getAI();
  if (!aiClient) return "LLM reasoning unavailable - API key required.";
  
  const prompt = `Review this governance questionnaire:
${JSON.stringify(questionnaire, null, 2)}

Generate a "human oversight failure memo". Identify whether oversight is meaningful or symbolic.`;

  const response = await aiClient.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt
  });
  return response.text;
}

export async function generateDeploymentDecision(context: any) {
  const aiClient = getAI();
  if (!aiClient) return {
    status: "Unknown",
    rationale: "LLM reasoning unavailable - API key required.",
    recommendedActions: [],
    unresolvedQuestions: []
  };
  
  const prompt = `You are a sociotechnical bias auditor making a final deployment decision based on the following context:
${JSON.stringify(context, null, 2)}

Output JSON ONLY with the following structure:
{
  "status": "Green" | "Amber" | "Red",
  "rationale": "Clear rationale for the decision based on subgroup harms, governance readiness, etc.",
  "recommendedActions": ["action 1", "action 2"],
  "unresolvedQuestions": ["question 1", "question 2"]
}
DO NOT wrap in \`\`\`json. Return raw JSON.`;

  const response = await aiClient.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt
  });
  
  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return {
      status: "Error",
      rationale: "Failed to parse LLM response: " + response.text,
      recommendedActions: [],
      unresolvedQuestions: []
    };
  }
}
