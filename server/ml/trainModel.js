import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { trainRidgeRegression } from "./ridgeRegression.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, "trainedModel.json");
const publicDatasetUrl =
  "https://raw.githubusercontent.com/plotly/datasets/master/finance-charts-apple.csv";

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(",");
  return lines.map((line) => {
    const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    return Object.fromEntries(
      headers.map((header, index) => [
        header.trim().replace(/^"|"$/g, ""),
        (values[index] || "").trim().replace(/^"|"$/g, ""),
      ]),
    );
  });
}

function toNumber(row, names) {
  for (const name of names) {
    const value = Number(row[name]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function buildRows(records) {
  const clean = records
    .map((row) => ({
      date: row.Date || row.date,
      open: toNumber(row, ["Open", "open", "AAPL.Open"]),
      high: toNumber(row, ["High", "high", "AAPL.High"]),
      low: toNumber(row, ["Low", "low", "AAPL.Low"]),
      close: toNumber(row, ["Close", "close", "Adj Close", "AAPL.Close"]),
      volume: toNumber(row, ["Volume", "volume", "Shares Traded", "AAPL.Volume"]),
    }))
    .filter((row) => row.open && row.high && row.low && row.close && row.volume)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const rows = [];
  for (let index = 30; index < clean.length - 21; index += 1) {
    const current = clean[index];
    const prev7 = clean[index - 7];
    const prev21 = clean[index - 21];
    const next21 = clean[index + 21];
    const range = (current.high - current.low) / current.close;
    const return7 = (current.close - prev7.close) / prev7.close;
    const return21 = (current.close - prev21.close) / prev21.close;
    const volumeRatio =
      current.volume /
      (clean
        .slice(index - 21, index)
        .reduce((sum, row) => sum + row.volume, 0) /
        21);
    const target = (next21.close - current.close) / current.close;

    rows.push({
      features: [return7, return21, range, Math.log(volumeRatio || 1)],
      target,
    });
  }

  return rows;
}

async function loadDataset() {
  if (process.env.TRAINING_CSV_PATH) {
    return fs.readFile(process.env.TRAINING_CSV_PATH, "utf8");
  }

  if (process.env.KAGGLE_JSON && process.env.KAGGLE_DATASET) {
    throw new Error(
      "Kaggle credential flow is documented in README. Download the Kaggle CSV and rerun with TRAINING_CSV_PATH.",
    );
  }

  const url = process.env.TRAINING_DATASET_URL || publicDatasetUrl;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download training dataset: ${response.status}`);
  }
  return response.text();
}

async function main() {
  const csv = await loadDataset();
  const rows = buildRows(parseCsv(csv));
  if (rows.length < 80) {
    throw new Error(`Need at least 80 usable rows; found ${rows.length}`);
  }

  const split = Math.floor(rows.length * 0.82);
  const train = rows.slice(0, split);
  const test = rows.slice(split);
  const model = trainRidgeRegression(train);
  const testPredictions = test.map((row) => {
    const normalized = row.features.map(
      (value, index) => (value - model.means[index]) / model.stds[index],
    );
    const vector = [1, ...normalized];
    return model.coefficients.reduce(
      (sum, coefficient, index) => sum + coefficient * vector[index],
      0,
    );
  });
  const mae =
    test.reduce((sum, row, index) => sum + Math.abs(row.target - testPredictions[index]), 0) /
    test.length;

  const artifact = {
    ...model,
    modelName: "market-return-ridge",
    modelVersion: new Date().toISOString().slice(0, 10),
    target: "next_21_trading_day_return",
    featureNames: ["return_7d", "return_21d", "intraday_range", "volume_ratio_log"],
    testMetrics: { mae, samples: test.length },
    source:
      process.env.TRAINING_CSV_PATH ||
      process.env.TRAINING_DATASET_URL ||
      publicDatasetUrl,
  };

  await fs.writeFile(outputPath, JSON.stringify(artifact, null, 2));
  console.log(
    `Trained ${artifact.modelName} with ${rows.length} samples. Train R2=${model.metrics.r2.toFixed(
      3,
    )}, test MAE=${mae.toFixed(4)}. Saved ${outputPath}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
