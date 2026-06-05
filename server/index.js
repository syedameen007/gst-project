import cors from "cors";
import crypto from "node:crypto";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import ChatMessage from "./models/ChatMessage.js";
import FinancialProfile from "./models/FinancialProfile.js";
import Portfolio from "./models/Portfolio.js";
import Prediction from "./models/Prediction.js";
import Scenario from "./models/Scenario.js";
import User from "./models/User.js";
import { advisorReply } from "./lib/advisor.js";
import { buildModel, DEFAULT_INPUTS } from "./lib/taxEngine.js";
import { predictFinancialOutcome } from "./ml/predictor.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/fiscal_lens";

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || ["http://127.0.0.1:5173", "http://localhost:5173"],
  }),
);
app.use(express.json({ limit: "1mb" }));

function payloadFor(profile) {
  const inputs = { ...DEFAULT_INPUTS, ...(profile?.inputs?.toObject?.() || profile?.inputs || {}) };
  const regime = profile?.regime || "old";
  const model = buildModel(inputs, regime);
  const prediction = predictFinancialOutcome(model);
  return { userId: profile?.userId, inputs, regime, model, prediction };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mongo: mongoose.connection.readyState === 1 });
});

function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password)).digest("hex");
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Login required" });

    const user = await User.findOne({ sessionToken: token });
    if (!user) return res.status(401).json({ error: "Invalid session" });

    req.authUser = user;
    next();
  } catch (error) {
    next(error);
  }
}

function ensureOwnUser(req, res) {
  if (String(req.authUser.id) !== String(req.params.userId || req.body.userId)) {
    res.status(403).json({ error: "You can only access your own data" });
    return false;
  }
  return true;
}

function portfolioSummary(assets) {
  const totalValue = assets.reduce((sum, asset) => sum + Number(asset.amount || 0), 0);
  const taxSavingAssets = assets
    .filter((asset) => asset.taxBucket && asset.taxBucket !== "Tax neutral")
    .reduce((sum, asset) => sum + Number(asset.amount || 0), 0);
  const weightedReturn =
    totalValue > 0
      ? assets.reduce(
          (sum, asset) =>
            sum + Number(asset.amount || 0) * (Number(asset.expectedReturn || 0) / 100),
          0,
        ) / totalValue
      : 0;
  const highRiskShare =
    totalValue > 0
      ? assets
          .filter((asset) => asset.risk === "High")
          .reduce((sum, asset) => sum + Number(asset.amount || 0), 0) / totalValue
      : 0;

  return { totalValue, taxSavingAssets, weightedReturn, highRiskShare };
}

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const name = String(req.body.name || "Fiscal Lens User").trim();
    const password = String(req.body.password || "demo-password");

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    const passwordHash = hashPassword(password);
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, name, passwordHash });
    } else {
      user.name = name;
      await user.save();
    }
    user.sessionToken = crypto.randomBytes(32).toString("hex");
    await user.save();

    await FinancialProfile.findOneAndUpdate(
      { userId: user.id },
      { $setOnInsert: { userId: user.id, inputs: DEFAULT_INPUTS, regime: "old" } },
      { upsert: true },
    );

    res.json({
      user: { userId: user.id, name: user.name, email: user.email, role: user.role },
      token: user.sessionToken,
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api", requireAuth);

app.get("/api/user/:userId", async (req, res, next) => {
  try {
    if (!ensureOwnUser(req, res)) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: { userId: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
});

app.put("/api/user/:userId", async (req, res, next) => {
  try {
    if (!ensureOwnUser(req, res)) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(404).json({ error: "Login required before saving user settings" });
    }
    const update = {
      name: String(req.body.name || "").trim(),
      email: String(req.body.email || "").trim().toLowerCase(),
    };

    if (!update.name || !update.email.includes("@")) {
      return res.status(400).json({ error: "Name and valid email are required" });
    }

    const user = await User.findByIdAndUpdate(req.params.userId, update, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: { userId: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
});

app.get("/api/profile/:userId", async (req, res, next) => {
  try {
    if (!ensureOwnUser(req, res)) return;
    const profile = await FinancialProfile.findOneAndUpdate(
      { userId: req.params.userId },
      { $setOnInsert: { userId: req.params.userId, inputs: DEFAULT_INPUTS, regime: "old" } },
      { new: true, upsert: true },
    );
    res.json(payloadFor(profile));
  } catch (error) {
    next(error);
  }
});

app.put("/api/profile/:userId", async (req, res, next) => {
  try {
    if (!ensureOwnUser(req, res)) return;
    const inputs = { ...DEFAULT_INPUTS, ...(req.body.inputs || {}) };
    const regime = req.body.regime === "new" ? "new" : "old";
    const profile = await FinancialProfile.findOneAndUpdate(
      { userId: req.params.userId },
      { userId: req.params.userId, inputs, regime },
      { new: true, upsert: true, runValidators: true },
    );
    const response = payloadFor(profile);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

app.get("/api/portfolio/:userId", async (req, res, next) => {
  try {
    if (!ensureOwnUser(req, res)) return;
    const portfolio = await Portfolio.findOneAndUpdate(
      { userId: req.params.userId },
      {
        $setOnInsert: {
          userId: req.params.userId,
          name: "Tax-aware portfolio",
          assets: [
            {
              name: "ELSS Tax Saver",
              type: "Equity-linked savings",
              amount: 50000,
              taxBucket: "80C",
              expectedReturn: 11,
              risk: "High",
              notes: "Tax-aware growth allocation",
            },
            {
              name: "NPS Tier I",
              type: "Retirement",
              amount: 25000,
              taxBucket: "80CCD(1B)",
              expectedReturn: 9,
              risk: "Medium",
              notes: "Additional retirement deduction bucket",
            },
          ],
          summary: portfolioSummary([
            { amount: 50000, taxBucket: "80C", expectedReturn: 11, risk: "High" },
            { amount: 25000, taxBucket: "80CCD(1B)", expectedReturn: 9, risk: "Medium" },
          ]),
        },
      },
      { new: true, upsert: true },
    );
    res.json(portfolio);
  } catch (error) {
    next(error);
  }
});

app.put("/api/portfolio/:userId", async (req, res, next) => {
  try {
    if (!ensureOwnUser(req, res)) return;
    const assets = Array.isArray(req.body.assets)
      ? req.body.assets.map((asset) => ({
          name: String(asset.name || "Untitled asset"),
          type: String(asset.type || "Investment"),
          amount: Math.max(0, Number(asset.amount) || 0),
          taxBucket: String(asset.taxBucket || "Tax neutral"),
          expectedReturn: Math.max(0, Number(asset.expectedReturn) || 0),
          risk: ["Low", "Medium", "High"].includes(asset.risk) ? asset.risk : "Medium",
          notes: String(asset.notes || ""),
        }))
      : [];

    const portfolio = await Portfolio.findOneAndUpdate(
      { userId: req.params.userId },
      {
        userId: req.params.userId,
        name: String(req.body.name || "Tax-aware portfolio"),
        assets,
        summary: portfolioSummary(assets),
      },
      { new: true, upsert: true, runValidators: true },
    );

    res.json(portfolio);
  } catch (error) {
    next(error);
  }
});

app.post("/api/scenarios", async (req, res, next) => {
  try {
    const userId = req.body.userId || "demo-user";
    if (String(req.authUser.id) !== String(userId)) {
      return res.status(403).json({ error: "You can only access your own data" });
    }
    const inputs = { ...DEFAULT_INPUTS, ...(req.body.inputs || {}) };
    const regime = req.body.regime === "new" ? "new" : "old";
    const deterministicModel = buildModel(inputs, regime);
    const scenario = await Scenario.create({
      userId,
      name: req.body.name || "Saved scenario",
      inputs,
      regime,
      deterministicModel,
    });
    res.status(201).json(scenario);
  } catch (error) {
    next(error);
  }
});

app.get("/api/scenarios/:userId", async (req, res, next) => {
  try {
    if (!ensureOwnUser(req, res)) return;
    const scenarios = await Scenario.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(scenarios);
  } catch (error) {
    next(error);
  }
});

app.post("/api/predict", async (req, res, next) => {
  try {
    const userId = req.body.userId || "demo-user";
    if (String(req.authUser.id) !== String(userId)) {
      return res.status(403).json({ error: "You can only access your own data" });
    }
    const model = buildModel({ ...DEFAULT_INPUTS, ...(req.body.inputs || {}) }, req.body.regime);
    const output = predictFinancialOutcome(model);
    const prediction = await Prediction.create({
      userId,
      scenarioId: req.body.scenarioId,
      modelName: output.modelName || "fallback-finance-heuristic",
      modelVersion: output.modelVersion || "0.1",
      features: req.body.inputs || {},
      output,
      confidence: output.confidence,
    });
    res.status(201).json({ prediction, output });
  } catch (error) {
    next(error);
  }
});

app.post("/api/chat", async (req, res, next) => {
  try {
    const userId = req.body.userId || "demo-user";
    if (String(req.authUser.id) !== String(userId)) {
      return res.status(403).json({ error: "You can only access your own data" });
    }
    const page = req.body.page || "support";
    const profile = await FinancialProfile.findOne({ userId });
    const { model, prediction } = payloadFor(profile || { userId, inputs: DEFAULT_INPUTS, regime: "old" });
    const question = String(req.body.message || "");
    const answer = advisorReply(question, model, prediction);
    await ChatMessage.create({ userId, page, role: "user", message: question, modelSnapshot: model });
    await ChatMessage.create({ userId, page, role: "assistant", message: answer, modelSnapshot: model });
    res.json({ answer });
  } catch (error) {
    next(error);
  }
});

app.get("/api/chat/:userId", async (req, res, next) => {
  try {
    if (!ensureOwnUser(req, res)) return;
    const messages = await ChatMessage.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(40);
    res.json(messages.reverse());
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: error.message || "Server error" });
});

mongoose
  .connect(mongoUri)
  .then(() => {
    app.listen(port, "127.0.0.1", () => {
      console.log(`Fiscal Lens API running at http://127.0.0.1:${port}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed", error);
    process.exitCode = 1;
  });
