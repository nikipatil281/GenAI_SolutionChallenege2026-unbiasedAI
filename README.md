# BiasScope

BiasScope is a sociotechnical AI auditing web app for tabular datasets. It combines deterministic fairness calculations with LLM-generated audit memos so teams can move from raw columns and outcome disparities to a structured deployment recommendation.

The current prototype is strongest for pre-deployment audits of CSV and Excel datasets. Users can upload a dataset, define the decision context, run the sociotechnical waterfall, inspect proxy and fairness risks, review governance readiness, chat with an audit copilot, and export a machine-readable audit trail.

## What The App Does

- Uploads and parses `CSV`, `XLSX`, and `XLS` files in the browser
- Collects decision-framing context through a structured questionnaire
- Auto-detects likely protected attributes from dataset columns and sample rows
- Runs a deterministic schema and fairness scan on the uploaded dataset
- Generates LLM memos for project setup, proxy legitimacy, fairness harms, governance, and final deployment decision
- Supports a grounded audit copilot chat once the core sociotechnical waterfall is complete
- Exports the audit record as JSON

## Current Product Scope

### Implemented

- Tabular dataset audit flow
- Deterministic data profiling
- Proxy screening with association scoring
- Group fairness metrics
- Intersectional subgroup analysis
- Governance questionnaire and memo
- Final decision synthesis
- Dataset-aware audit chat

### In Development

- Model-file auditing for `PKL`, `PT`, `ONNX`, `H5`, and `GGUF`
- Direct cloud model auditing
- Richer export formats beyond JSON
- Authentication, persistence, and multi-user audit history

## Audit Workflow

1. Start in the landing page and choose `Audit Tabular Dataset`.
2. Fill in the `Decision Questionnaire`.
3. Upload a dataset and configure:
   - prediction/target column
   - optional ground-truth column
   - one or more protected attributes
4. Run the deterministic scan and sociotechnical waterfall.
5. Review the generated modules:
   - `Project Setup`
   - `Proxy Screening`
   - `Fairness Engine`
   - `Intersectional`
6. Open `Talk To An AI Bot` after the sociotechnical waterfall is complete.
7. Complete `Governance Hub` if you want governance-specific reasoning added to the context.
8. Use `Decision Expert` to synthesize the final deployment recommendation.
9. Export the audit as JSON.

## Fairness And Analysis Features

### Deterministic Analysis

- Column type inference
- Missing-value counts and percentages
- Unique-value summaries
- Numeric summaries for quantitative fields

### Proxy Screening

- Mutual Information / Uncertainty Coefficient style association scoring between features and the target
- Human review controls for accepting, contesting, or flagging high-risk features

### Fairness Metrics

- Demographic Parity Difference
- Demographic Parity Ratio
- Equal Opportunity Difference when ground truth is available
- Average Odds Difference when ground truth is available
- Error Rate Difference when ground truth is available

### Intersectional Analysis

- Subgroup slicing across multiple protected attributes
- Positive-rate comparisons across combined groups
- LLM summary of the most exposed subgroups

## LLM Features

BiasScope uses server-side Vertex AI calls to generate compact, grounded audit memos. The app currently produces:

- project setup review
- protected-attribute detection
- proxy legitimacy review
- fairness and subgroup interpretation
- governance / oversight critique
- final deployment recommendation
- free-form audit copilot responses grounded in the current audit context

The LLM copy is intentionally constrained to be short, direct, and free of generic filler introductions.

## Architecture

BiasScope runs as a single TypeScript app with both frontend and backend code in the same repository.

- `React 19` renders the UI
- `Vite` provides the frontend build tooling
- `Express` serves API routes and the production build
- `TypeScript` is used across client and server
- `Tailwind CSS`, `shadcn/ui`, and `Base UI` power the interface
- `Vertex AI` powers the LLM reasoning layer

At runtime, the flow is:

1. The frontend collects problem framing and dataset inputs.
2. The Express backend runs deterministic analysis in `src/server/stats.ts`.
3. The backend sends structured context to the LLM layer in `src/server/llm.ts`.
4. The frontend renders both numeric outputs and plain-language memos.

## Repository Structure

- [src/components](./src/components)  
  Main UI, audit modules, chat, landing page, and sidebar
- [src/context/AuditContext.tsx](./src/context/AuditContext.tsx)  
  Shared client-side state for the audit flow
- [src/server/stats.ts](./src/server/stats.ts)  
  Deterministic dataset profiling, fairness metrics, and subgroup logic
- [src/server/llm.ts](./src/server/llm.ts)  
  Vertex AI prompts and audit copilot logic
- [server.ts](./server.ts)  
  Express server and API routes
- [sample_audit_data.csv](./sample_audit_data.csv)  
  Simple local sample dataset for testing the flow

## API Routes

- `GET /api/health`  
  Health check
- `POST /api/audit/analyze`  
  Runs deterministic dataset analysis
- `POST /api/llm/detect-protected`  
  Infers likely protected attributes
- `POST /api/llm/project-setup`  
  Generates the project setup memo
- `POST /api/llm/proxy`  
  Generates the proxy legitimacy review
- `POST /api/llm/fairness`  
  Generates the fairness and subgroup interpretation
- `POST /api/llm/governance`  
  Generates the governance memo
- `POST /api/llm/decision`  
  Synthesizes the final decision
- `POST /api/agent/chat`  
  Answers user questions against the current audit context

## Local Setup

### Prerequisites

- Node.js `22.x` recommended
- npm

### Environment Variables

Create a `.env` file in the repository root.

```env
GCP_PROJECT_ID=your-gcp-project-id
GCP_LOCATION=us-central1
GCP_CLIENT_EMAIL=your-service-account-email
GCP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Notes:

- The LLM features depend on the `GCP_*` variables above.
- If these values are missing, the deterministic audit still runs, but LLM responses will fall back to an unavailable message.
- `GEMINI_API_KEY` is referenced in the Vite config, but the current audit flow uses the server-side Vertex AI client for the actual LLM features.

### Install And Run

```bash
npm install
npm run dev
```

The app runs on:

```text
http://localhost:3000
```

## Available Scripts

- `npm run dev`  
  Starts the Express server with Vite middleware for local development
- `npm run build`  
  Builds the frontend and bundles the server
- `npm run start`  
  Starts the production server from `dist/server.cjs`
- `npm run lint`  
  Runs `tsc --noEmit`
- `npm run clean`  
  Removes the `dist` directory

## Production Build

```bash
npm run build
npm run start
```

## Important Product Behavior

- The `Decision Questionnaire` locks once the sociotechnical analysis has been initiated.
- `Data Upload & Configuration` also locks once analysis begins, preserving audit consistency.
- The audit chat unlocks after the sociotechnical waterfall is complete.
- Governance is not required to start chatting, but it enriches the available context.
- The final decision card becomes available after governance and is explicitly synthesized by the user.

## Known Limitations

- The model-validation flow shown on the landing page is still a placeholder UI.
- There is no persistent database yet; audit state lives in the current browser session.
- No authentication or role-based access control is implemented yet.
- The proxy-screening logic is lightweight and intended for prototype use rather than regulatory-grade certification.

## Suggested Demo Path

If you want a quick walkthrough:

1. Start the app locally.
2. Choose `Audit Tabular Dataset`.
3. Upload [sample_audit_data.csv](./sample_audit_data.csv).
4. Select a target column and one or more protected attributes.
5. Run the sociotechnical waterfall.
6. Open the chat copilot.
7. Complete governance.
8. Generate the final decision and export the JSON report.
