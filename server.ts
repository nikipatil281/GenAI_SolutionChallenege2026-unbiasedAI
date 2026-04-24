import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

import { analyzeDataset, analyzeAssociations, calculateFairnessMetrics, createSubgroupSlices } from "./src/server/stats.ts";
import { 
  evaluateLegitimacy, 
  generateDatasetNarrative, 
  evaluateProxies, 
  generateFairnessSummary,
  summarizeGovernance,
  generateDeploymentDecision,
  evaluateProjectSetup,
  detectProtectedAttributes
} from "./src/server/llm.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/audit/analyze", async (req, res) => {
    try {
      const { data, targetColumn, protectedColumns, groundTruthColumn } = req.body;
      
      const datasetStats = analyzeDataset(data);
      const associations = targetColumn ? analyzeAssociations(data, targetColumn) : null;
      let fairness: any = null;
      let subgroups = null;

      if (targetColumn && protectedColumns && protectedColumns.length > 0) {
        // Evaluate fairness metrics for each protected column
        fairness = {};
        protectedColumns.forEach((col: string) => {
          fairness[col] = calculateFairnessMetrics(data, targetColumn, col, groundTruthColumn === 'none' ? undefined : groundTruthColumn);
        });
        subgroups = createSubgroupSlices(data, protectedColumns, targetColumn, groundTruthColumn === 'none' ? undefined : groundTruthColumn);
      }

      res.json({ datasetStats, associations, fairness, subgroups });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/llm/legitimacy", async (req, res) => {
    try {
      const { questionnaire } = req.body;
      const memo = await evaluateLegitimacy(questionnaire);
      res.json({ memo });
    } catch (e: any) { res.status(500).json({error: e.message}); }
  });

  app.post("/api/llm/dataset", async (req, res) => {
    try {
      const { stats } = req.body;
      const narrative = await generateDatasetNarrative(stats);
      res.json({ narrative });
    } catch (e: any) { res.status(500).json({error: e.message}); }
  });

  app.post("/api/llm/project-setup", async (req, res) => {
    try {
      const { questionnaire, stats } = req.body;
      const memo = await evaluateProjectSetup(questionnaire, stats);
      res.json({ memo });
    } catch (e: any) { res.status(500).json({error: e.message}); }
  });

  app.post("/api/llm/detect-protected", async (req, res) => {
    try {
      const { columns, sampleData } = req.body;
      const protectedCols = await detectProtectedAttributes(columns, sampleData);
      res.json({ protectedCols });
    } catch (e: any) { res.status(500).json({error: e.message}); }
  });

  app.post("/api/llm/proxy", async (req, res) => {
    try {
      const { associations } = req.body;
      const evaluation = await evaluateProxies(associations);
      res.json({ evaluation });
    } catch (e: any) { res.status(500).json({error: e.message}); }
  });

  app.post("/api/llm/fairness", async (req, res) => {
    try {
      const { fairnessMetrics, subgroups } = req.body;
      const summary = await generateFairnessSummary(fairnessMetrics, subgroups);
      res.json({ summary });
    } catch (e: any) { res.status(500).json({error: e.message}); }
  });

  app.post("/api/llm/governance", async (req, res) => {
    try {
      const { questionnaire } = req.body;
      const summary = await summarizeGovernance(questionnaire);
      res.json({ summary });
    } catch (e: any) { res.status(500).json({error: e.message}); }
  });

  app.post("/api/llm/decision", async (req, res) => {
    try {
      const { context } = req.body;
      const decision = await generateDeploymentDecision(context);
      res.json(decision);
    } catch (e: any) { res.status(500).json({error: e.message}); }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In Express v4, we can use app.get('*', ...)
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
