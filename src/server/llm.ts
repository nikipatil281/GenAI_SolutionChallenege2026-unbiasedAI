import { VertexAI } from '@google-cloud/vertexai';

let generativeModel: any = null;

const TEXT_RESPONSE_FALLBACK = "LLM reasoning unavailable - GCP_PROJECT_ID required.";
const AUDIT_RESPONSE_STYLE = `IMPORTANT FORMATTING RULES:
Write your response in clear, concise, and user-friendly language. Avoid dense academic jargon. Use short paragraphs, bullet points, and bold text for readability.
Do not begin with filler such as "Of course", "Here is", "Certainly", or any similar meta-introduction. Start immediately with the substantive analysis.
Keep the response compact. Prefer no more than 3 short paragraphs or 4-6 bullets unless extra detail is genuinely necessary.`;

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

function sanitizeTextResponse(text: string) {
  let cleaned = text
    .replace(/^```(?:markdown)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  const leadingMetaPatterns = [
    /^(?:of course|sure|certainly|absolutely)[^.!?\n]*[.!?]\s*/i,
    /^(?:here(?:'|’)?s|here is|below is)\b[^.!?\n]*[.!?]\s*/i,
  ];

  let previous = '';
  while (cleaned && cleaned !== previous) {
    previous = cleaned;
    leadingMetaPatterns.forEach((pattern) => {
      cleaned = cleaned.replace(pattern, '').trimStart();
    });
  }

  return cleaned;
}

async function runTextPrompt(prompt: string) {
  const model = getAI();
  if (!model) return TEXT_RESPONSE_FALLBACK;

  const request = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
  const result = await model.generateContent(request);
  const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return sanitizeTextResponse(text);
}

export async function evaluateProxies(associations: any) {
  const prompt = `Review these feature associations with the target variable:
${JSON.stringify(associations, null, 2)}

We calculated a Mutual Information (MI) / Uncertainty Coefficient score for each feature against the model's prediction. A higher score (closer to 1.0) means the feature is highly predictive of the outcome and could be acting as a proxy for protected attributes.

Provide a "proxy legitimacy review" explaining why top associated features may be legitimate business drivers vs illegitimate proxies (e.g. 'zip_code').

${AUDIT_RESPONSE_STYLE}
Explain the issues simply and directly.`;

  return runTextPrompt(prompt);
}

export async function generateFairnessSummary(fairnessMetrics: any, subgroups: any) {
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

${AUDIT_RESPONSE_STYLE}
Explain the issues simply and directly.`;

  return runTextPrompt(prompt);
}

export async function summarizeGovernance(questionnaire: any) {
  const prompt = `Review this governance questionnaire:
${JSON.stringify(questionnaire, null, 2)}

Generate a "human oversight failure analysis". Identify whether oversight is meaningful or symbolic.

${AUDIT_RESPONSE_STYLE}
Explain the issues simply and directly.`;

  return runTextPrompt(prompt);
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

${AUDIT_RESPONSE_STYLE}
The user reading this might not be an AI ethics expert, so explain the risks simply, directly, and without overwhelming them with text. DO NOT include formal memo headers like "MEMORANDUM", "TO:", "FROM:", "DATE:", or "SUBJECT:". Start immediately with the analysis.`;

  return runTextPrompt(prompt);
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

function truncateText(value: string, maxChars = 1800) {
  if (!value) return value;
  return value.length > maxChars ? `${value.slice(0, maxChars)}...` : value;
}

function buildDatasetPreview(dataset: any[]) {
  if (!Array.isArray(dataset) || dataset.length === 0) {
    return { totalRows: 0, sampleRows: [] };
  }

  const columns = Object.keys(dataset[0] || {});
  const includeFullDataset = dataset.length <= 20 && columns.length <= 12;

  return {
    totalRows: dataset.length,
    columns,
    mode: includeFullDataset ? 'full-dataset' : 'sampled-preview',
    sampleRows: includeFullDataset ? dataset : dataset.slice(0, 15),
    tailRows: includeFullDataset ? [] : dataset.slice(-5),
  };
}

function buildStatsPreview(datasetStats: any) {
  if (!datasetStats?.stats) return datasetStats;

  const columns = datasetStats.columns || Object.keys(datasetStats.stats);
  const limitedColumns = columns.slice(0, 30);
  const stats: any = {};

  limitedColumns.forEach((column: string) => {
    stats[column] = datasetStats.stats[column];
  });

  return {
    totalRows: datasetStats.totalRows,
    columns: limitedColumns,
    stats,
    omittedColumnCount: Math.max(0, columns.length - limitedColumns.length),
  };
}

function buildAssociationPreview(associations: any[]) {
  if (!Array.isArray(associations)) return [];
  return associations.slice(0, 12);
}

function buildFairnessPreview(fairnessMetrics: any) {
  if (!fairnessMetrics || typeof fairnessMetrics !== 'object') return fairnessMetrics;

  const summary: any = {};

  Object.entries(fairnessMetrics).forEach(([column, metrics]: [string, any]) => {
    const groupMetrics = metrics?.groupMetrics || {};
    const sortedGroups = Object.entries(groupMetrics)
      .sort((a: any, b: any) => (a[1]?.positiveRate ?? 0) - (b[1]?.positiveRate ?? 0));

    summary[column] = {
      demographicParityDifference: metrics.demographicParityDifference,
      demographicParityRatio: metrics.demographicParityRatio,
      equalOpportunityDifference: metrics.equalOpportunityDifference,
      averageOddsDifference: metrics.averageOddsDifference,
      errorRateDifference: metrics.errorRateDifference,
      worstGroups: sortedGroups.slice(0, 5).map(([group, values]: [string, any]) => ({ group, ...values })),
      bestGroups: sortedGroups.slice(-3).reverse().map(([group, values]: [string, any]) => ({ group, ...values })),
    };
  });

  return summary;
}

function buildSubgroupPreview(subgroups: any) {
  if (!subgroups || typeof subgroups !== 'object') return subgroups;

  return Object.entries(subgroups)
    .map(([group, values]: [string, any]) => ({ group, ...values }))
    .sort((a: any, b: any) => (a.positiveRate ?? 0) - (b.positiveRate ?? 0))
    .slice(0, 12);
}

function buildMemoPreview(llmMessages: any[]) {
  if (!Array.isArray(llmMessages)) return [];
  return llmMessages.map((message) => ({
    type: message.type,
    title: message.title,
    content: truncateText(message.content, 2200),
  }));
}

function buildAuditChatContext(context: any) {
  return {
    problemFraming: context.problemFraming,
    targetColumn: context.targetColumn,
    groundTruthColumn: context.groundTruthColumn,
    protectedColumns: context.protectedColumns,
    datasetPreview: buildDatasetPreview(context.dataset),
    datasetStats: buildStatsPreview(context.datasetStats),
    topAssociations: buildAssociationPreview(context.associations),
    fairnessMetrics: buildFairnessPreview(context.fairnessMetrics),
    worstSubgroups: buildSubgroupPreview(context.subgroups),
    governance: context.governance,
    previousMemos: buildMemoPreview(context.llmMessages),
    finalDecision: context.systemDecision,
  };
}

export async function answerAuditQuestion(message: string, context: any, history: any[] = []) {
  const prompt = `You are BiasScope's AI audit copilot.
You answer questions about the user's uploaded dataset and the audit results that BiasScope already computed.

Rules:
1. Use only the provided audit context. Do not invent columns, groups, metrics, or findings.
2. If the answer depends on information that is not present, say that clearly.
3. Ground your answer in concrete fields, subgroup names, or metrics whenever possible.
4. The dataset may be represented as a preview if it is too large to include in full. If that limits certainty, say so.
5. Keep the tone practical, direct, and easy to understand.

Audit context:
${JSON.stringify(buildAuditChatContext(context), null, 2)}

Recent conversation:
${JSON.stringify(history.slice(-8), null, 2)}

User question:
${message}

Answer in markdown. Prefer short paragraphs and bullets when they improve clarity. Start directly with the answer and keep it compact. Do not use filler such as "Of course" or "Here is".`;

  return runTextPrompt(prompt);
}
