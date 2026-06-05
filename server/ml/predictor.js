import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { predictRidge } from "./ridgeRegression.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelPath = path.join(__dirname, "trainedModel.json");

function fallbackPrediction(model) {
  const baseAnnualReturn = model.returnRate;
  const complianceBoost = Math.min(model.itcGap / Math.max(model.outputGst, 1), 0.25);
  const taxBoost = Math.min(model.incomeTaxSaved / Math.max(model.income, 1), 0.08);
  return {
    monthlyReturn: baseAnnualReturn / 12 + complianceBoost / 12 + taxBoost / 6,
    confidence: 0.62,
    source: "fallback-finance-heuristic",
    metrics: null,
  };
}

function loadArtifact() {
  if (!fs.existsSync(modelPath)) return null;
  return JSON.parse(fs.readFileSync(modelPath, "utf8"));
}

export function predictFinancialOutcome(model) {
  const artifact = loadArtifact();
  if (!artifact) return fallbackPrediction(model);

  const return7 = Math.min(Math.max(model.portfolioReturn / 6, -0.2), 0.2);
  const return21 = Math.min(Math.max(model.portfolioReturn / 3, -0.3), 0.3);
  const range = Math.min(0.06, 0.012 + (100 - model.expenseScore) / 2500);
  const volumeRatioLog = Math.log(1 + Math.min(model.plannedInvestment / 100000, 5));
  const predictedMonthlyReturn = predictRidge(artifact, [
    return7,
    return21,
    range,
    volumeRatioLog,
  ]);
  const confidence = Math.max(0.45, Math.min(0.88, 1 - (artifact.testMetrics?.mae || 0.16)));

  return {
    monthlyReturn: predictedMonthlyReturn,
    confidence,
    source: artifact.source,
    modelName: artifact.modelName,
    modelVersion: artifact.modelVersion,
    metrics: artifact.testMetrics,
  };
}
