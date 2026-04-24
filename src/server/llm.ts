import { VertexAI } from '@google-cloud/vertexai';

let generativeModel: any = null;

function getAI() {
  if (!generativeModel) {
    const project = process.env.GCP_PROJECT_ID;
    const location = process.env.GCP_LOCATION || 'us-central1';
    const client_email = process.env.GCP_CLIENT_EMAIL;
    const private_key = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (project && client_email && private_key) {
      try {
        const vertexAI = new VertexAI({ 
          project, 
          location,
          googleAuthOptions: {
            credentials: {
              client_email,
              private_key
            }
          }
        });
        generativeModel = vertexAI.getGenerativeModel({
          model: 'gemini-2.5-pro',
        });
      } catch (e) {
        console.error("Failed to initialize Vertex AI client:", e);
      }
    } else {
        console.warn("GCP_PROJECT_ID, GCP_CLIENT_EMAIL, or GCP_PRIVATE_KEY is missing. Vertex AI client cannot be initialized.");
    }
  }
  return generativeModel;
}

export async function evaluateLegitimacy(questionnaire: any) {
  const model = getAI();
  if (!model) return "LLM reasoning unavailable - GCP_PROJECT_ID required.";
  
  const prompt = `You are a sociotechnical bias auditor evaluating a proposed AI system.
Task: Write a Legitimacy Analysis. 
Questionnaire Answers: ${JSON.stringify(questionnaire, null, 2)}
Is the target variable morally defensible? Will it encode historical deprivation? 
Could this decision be too socially contested to automate responsibly?

IMPORTANT FORMATTING RULES: 
Write your response in clear, concise, and user-friendly language. Avoid dense academic jargon. Use short paragraphs, bullet points, and bold text for readability. The user reading this might not be an AI ethics expert, so explain the risks simply, directly, and without overwhelming them with text.`;

  const request = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
  const result = await model.generateContent(request);
  return result.response.candidates[0].content.parts[0].text;
}

export async function generateDatasetNarrative(stats: any) {
  const model = getAI();
  if (!model) return "LLM reasoning unavailable - GCP_PROJECT_ID required.";
  
  const prompt = `You are an AI auditor. Review these dataset statistics:
${JSON.stringify(stats, null, 2)}
Explain what these issues may mean socially. What hidden concerns like selective visibility, historical exclusion, or institutional over-surveillance might be present? Produce a narrative: "What this data may actually be measuring".

IMPORTANT FORMATTING RULES: 
Write your response in clear, concise, and user-friendly language. Avoid dense academic jargon. Use short paragraphs, bullet points, and bold text for readability. Explain the issues simply and directly.`;

  const request = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
  const result = await model.generateContent(request);
  return result.response.candidates[0].content.parts[0].text;
}

export async function evaluateProxies(associations: any) {
  const model = getAI();
  if (!model) return "LLM reasoning unavailable - GCP_PROJECT_ID required.";
  
  const prompt = `Review these feature associations with the target variable:
${JSON.stringify(associations, null, 2)}

We calculated a Mutual Information (MI) / Uncertainty Coefficient score for each feature against the model's prediction. A higher score (closer to 1.0) means the feature is highly predictive of the outcome and could be acting as a proxy for protected attributes.

Provide a "proxy legitimacy review" explaining why top associated features may be legitimate business drivers vs illegitimate proxies (e.g. 'zip_code').

IMPORTANT FORMATTING RULES: 
Write your response in clear, concise, and user-friendly language. Avoid dense academic jargon. Use short paragraphs, bullet points, and bold text for readability. Explain the issues simply and directly.`;

  const request = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
  const result = await model.generateContent(request);
  return result.response.candidates[0].content.parts[0].text;
}

export async function generateFairnessSummary(fairnessMetrics: any, subgroups: any) {
  const model = getAI();
  if (!model) return "LLM reasoning unavailable - GCP_PROJECT_ID required.";
  
  const prompt = `Review these fairness metrics and subgroup statistics:
Fairness Metrics: ${JSON.stringify(fairnessMetrics, null, 2)}
Subgroups: ${JSON.stringify(subgroups, null, 2)}

Summarize subgroup harms in plain language. Prioritize which subgroup harms deserve escalation.

CRITICAL INSTRUCTIONS:
1. Explain the "Demographic Parity" (Disparate Impact) numbers simply. Who is favored? Who is penalized?
2. If the data includes "equalOpportunityDifference", "averageOddsDifference", or "errorRateDifference", you MUST explain these! 
   - Equal Opportunity Diff means the difference in True Positive Rates (e.g., "Out of the people who actually deserved the job, Black women were 20% less likely to get it than White men").
   - Error Rate Diff means the model is generally more inaccurate for certain groups.
3. Highlight the worst intersectional harms (e.g., "Black Women" experiencing compounded disadvantage).
4. Conclude with concrete operational recommendations.

IMPORTANT FORMATTING RULES: 
Write your response in clear, concise, and user-friendly language. Avoid dense academic jargon. Use short paragraphs, bullet points, and bold text for readability. Explain the issues simply and directly.`;

  const request = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
  const result = await model.generateContent(request);
  return result.response.candidates[0].content.parts[0].text;
}

export async function summarizeGovernance(questionnaire: any) {
  const model = getAI();
  if (!model) return "LLM reasoning unavailable - GCP_PROJECT_ID required.";
  
  const prompt = `Review this governance questionnaire:
${JSON.stringify(questionnaire, null, 2)}

Generate a "human oversight failure analysis". Identify whether oversight is meaningful or symbolic.

IMPORTANT FORMATTING RULES: 
Write your response in clear, concise, and user-friendly language. Avoid dense academic jargon. Use short paragraphs, bullet points, and bold text for readability. Explain the issues simply and directly.`;

  const request = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
  const result = await model.generateContent(request);
  return result.response.candidates[0].content.parts[0].text;
}

export async function generateDeploymentDecision(context: any) {
  const model = getAI();
  if (!model) return {
    status: "Unknown",
    rationale: "LLM reasoning unavailable - GCP_PROJECT_ID required.",
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

  const request = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
  const result = await model.generateContent(request);
  const text = result.response.candidates[0].content.parts[0].text;
  
  try {
    const cleanedText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(cleanedText || '{}');
  } catch (e) {
    return {
      status: "Error",
      rationale: "Failed to parse LLM response: " + text,
      recommendedActions: [],
      unresolvedQuestions: []
    };
  }
}

export async function evaluateProjectSetup(questionnaire: any, stats: any) {
  const model = getAI();
  if (!model) return "LLM reasoning unavailable - GCP_PROJECT_ID required.";
  
  const prompt = `You are a sociotechnical bias auditor evaluating a proposed AI system and its initial dataset.
Task: Write a comprehensive Project Setup Analysis.

Problem Framing Questionnaire Answers:
${JSON.stringify(questionnaire, null, 2)}

Dataset Statistics:
${JSON.stringify(stats, null, 2)}

Please evaluate the following:
1. Legitimacy: Is the target variable morally defensible given the domain? Could this decision be too socially contested to automate responsibly?
2. Data Risks: What do these dataset statistics mean socially? What hidden concerns like selective visibility, historical exclusion, or institutional over-surveillance might be present in this data schema?
3. Synthesis: How does the proposed framing interact with the reality of the dataset?

IMPORTANT FORMATTING RULES: 
Write your response in clear, concise, and user-friendly language. Avoid dense academic jargon. Use short paragraphs, bullet points, and bold text for readability. The user reading this might not be an AI ethics expert, so explain the risks simply, directly, and without overwhelming them with text. DO NOT include formal memo headers like "MEMORANDUM", "TO:", "FROM:", "DATE:", or "SUBJECT:". Start immediately with the analysis.`;

  const request = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
  const result = await model.generateContent(request);
  return result.response.candidates[0].content.parts[0].text;
}

export async function detectProtectedAttributes(columns: string[], sampleData: any[]) {
  const model = getAI();
  if (!model) return [];
  
  const prompt = `You are a data schema analyzer.
I am providing you with a list of column names and a few sample rows from a dataset.
Your task is to identify which column (if any) represents a "Protected Attribute" or demographic characteristic (e.g., race, gender, sex, age, ethnicity, religion, disability, marital status).

Columns: ${JSON.stringify(columns)}
Sample Data: ${JSON.stringify(sampleData, null, 2)}

Return ONLY a JSON array containing the exact string name(s) of the column(s) that are likely protected attributes. 
If none are found, return an empty array [].
DO NOT wrap in \`\`\`json or add any other text. Output raw JSON only.`;

  try {
    const request = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
    const result = await model.generateContent(request);
    const text = result.response.candidates[0].content.parts[0].text.trim();
    const cleanText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to detect protected attributes", e);
    return [];
  }
}
