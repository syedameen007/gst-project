import cors from "cors";
import crypto from "node:crypto";
import dotenv from "dotenv";
import express from "express";
import fs from "node:fs";
import mongoose from "mongoose";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ChatMessage from "./models/ChatMessage.js";
import Expense from "./models/Expense.js";
import FinancialProfile from "./models/FinancialProfile.js";
import Portfolio from "./models/Portfolio.js";
import Prediction from "./models/Prediction.js";
import Scenario from "./models/Scenario.js";
import TaxDocument from "./models/TaxDocument.js";
import TaxGuideSession from "./models/TaxGuideSession.js";
import User from "./models/User.js";
import { advisorReply } from "./lib/advisor.js";
import { buildModel, DEFAULT_INPUTS } from "./lib/taxEngine.js";
import { predictFinancialOutcome } from "./ml/predictor.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadRoot, { recursive: true });

const app = express();
const port = Number(process.env.PORT || 4000);
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/fiscal_lens";
const upload = multer({
  storage: multer.diskStorage({
    destination(req, _file, cb) {
      const userFolder = path.join(uploadRoot, String(req.params.userId || "unknown"));
      fs.mkdirSync(userFolder, { recursive: true });
      cb(null, userFolder);
    },
    filename(_req, file, cb) {
      const safeName = file.originalname.replace(/[^\w.\-]+/g, "_");
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${safeName}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

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

function publicUser(user) {
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    authProvider: user.authProvider,
  };
}

async function issueSession(user) {
  user.sessionToken = crypto.randomBytes(32).toString("hex");
  await user.save();
  await FinancialProfile.findOneAndUpdate(
    { userId: user.id },
    { $setOnInsert: { userId: user.id, inputs: DEFAULT_INPUTS, regime: "old" } },
    { upsert: true },
  );
  return { user: publicUser(user), token: user.sessionToken };
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

const taxQuestions = [
  {
    id: "incomeSources",
    question: "What income did you earn this year?",
    helper: "Examples: salary, freelancing, business sales, rent, interest, capital gains.",
    options: ["Salary only", "Business/Freelance", "Salary + business", "Not sure"],
  },
  {
    id: "gstRegistered",
    question: "Are you registered under GST?",
    helper: "This decides whether we should ask for sales invoices, purchase invoices, and input tax credit.",
    options: ["Yes", "No", "Not sure"],
  },
  {
    id: "businessExpenses",
    question: "Do you have business or work-related expenses?",
    helper: "Add expenses like software, travel, internet, rent, phone, professional fees, and purchases.",
    options: ["Yes", "No", "Some, but not organized"],
  },
  {
    id: "investmentProofs",
    question: "Did you invest in tax-saving instruments?",
    helper: "Examples: ELSS, PPF, EPF, life insurance, NPS, tax-saving FD.",
    options: ["Yes", "No", "Need suggestions"],
  },
  {
    id: "housing",
    question: "Do you pay rent or have a home loan?",
    helper: "This helps decide if rent receipts, HRA, interest certificate, or principal repayment proof is needed.",
    options: ["Rent", "Home loan", "Both", "Neither"],
  },
  {
    id: "capitalGains",
    question: "Did you sell shares, mutual funds, property, or crypto?",
    helper: "Capital gains need transaction statements and purchase/sale details.",
    options: ["Yes", "No", "Not sure"],
  },
  {
    id: "bankInterest",
    question: "Do you have bank interest, FD interest, or other income?",
    helper: "Interest and other income usually need bank statements or Form 26AS/AIS review.",
    options: ["Yes", "No", "Not sure"],
  },
  {
    id: "documentsReady",
    question: "Which documents do you already have ready?",
    helper: "Upload Form 16, bank statement, GST invoices, investment proofs, rent receipts, loan certificates, and expense bills.",
    options: ["Most documents", "Some documents", "Almost none"],
  },
];

function taxGuidePayload(session, documents = [], expenses = []) {
  const answeredIds = new Set(session.answers.map((answer) => answer.questionId));
  const nextQuestion = taxQuestions.find((question) => !answeredIds.has(question.id)) || null;
  const totalExpense = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const gstExpense = expenses.reduce((sum, expense) => sum + Number(expense.gstAmount || 0), 0);
  const uploadedCategories = new Set(documents.map((document) => document.category));
  const missingDocuments = [];

  if (answeredIds.has("incomeSources") && !uploadedCategories.has("Form 16")) {
    missingDocuments.push("Form 16 or income statement");
  }
  if (answeredIds.has("gstRegistered") && !uploadedCategories.has("GST invoice")) {
    missingDocuments.push("GST sales/purchase invoices");
  }
  if (answeredIds.has("investmentProofs") && !uploadedCategories.has("Investment proof")) {
    missingDocuments.push("Investment proof");
  }
  if (answeredIds.has("housing") && !uploadedCategories.has("Rent / home loan")) {
    missingDocuments.push("Rent receipts or home loan certificate");
  }

  const guidance = nextQuestion
    ? "Answer the next question and upload any matching document. I will keep narrowing the filing checklist."
    : "Question flow complete. Review the missing documents and expenses before filing.";

  return {
    answers: session.answers,
    nextQuestion,
    progress: Math.round((session.answers.length / taxQuestions.length) * 100),
    summary: {
      documentsUploaded: documents.length,
      expensesTracked: expenses.length,
      totalExpense,
      gstExpense,
      missingDocuments: [...new Set(missingDocuments)].slice(0, 5),
    },
    guidance,
  };
}

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const passwordHash = hashPassword(password);
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Account not found. Please create an account first." });
    }
    if (!user.passwordHash || user.passwordHash !== passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json(await issueSession(user));
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/signup", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email.includes("@") || password.length < 6) {
      return res.status(400).json({ error: "Name, valid email, and 6+ character password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Account already exists. Please login instead." });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: hashPassword(password),
      authProvider: "password",
    });

    res.status(201).json(await issueSession(user));
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/google/start", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const callbackUrl =
    process.env.GOOGLE_CALLBACK_URL || `http://127.0.0.1:${port}/api/auth/google/callback`;

  if (!clientId) {
    return res.status(500).send("GOOGLE_CLIENT_ID is missing in .env");
  }

  const state = crypto.randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

app.get("/api/auth/google/callback", async (req, res, next) => {
  try {
    const code = String(req.query.code || "");
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl =
      process.env.GOOGLE_CALLBACK_URL || `http://127.0.0.1:${port}/api/auth/google/callback`;
    const clientOrigin = process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173";

    if (!code || !clientId || !clientSecret) {
      return res.redirect(`${clientOrigin}/login?error=google_config`);
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      return res.redirect(`${clientOrigin}/login?error=google_token`);
    }

    const tokenData = await tokenResponse.json();
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileResponse.ok) {
      return res.redirect(`${clientOrigin}/login?error=google_profile`);
    }

    const profile = await profileResponse.json();
    const email = String(profile.email || "").toLowerCase();
    if (!email) return res.redirect(`${clientOrigin}/login?error=google_email`);

    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name: profile.name || email.split("@")[0],
          email,
          googleId: profile.sub,
          authProvider: "google",
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    const session = await issueSession(user);
    const params = new URLSearchParams({
      token: session.token,
      userId: session.user.userId,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      authProvider: session.user.authProvider,
    });

    res.redirect(`${clientOrigin}/auth/callback?${params.toString()}`);
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

app.get("/api/documents/:userId", async (req, res, next) => {
  try {
    if (!ensureOwnUser(req, res)) return;
    const documents = await TaxDocument.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    next(error);
  }
});

app.post("/api/documents/:userId", upload.single("document"), async (req, res, next) => {
  try {
    if (!ensureOwnUser(req, res)) return;
    if (!req.file) return res.status(400).json({ error: "Document file is required" });

    const document = await TaxDocument.create({
      userId: req.params.userId,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      category: req.body.category || "Other",
      documentDate: req.body.documentDate || "",
      amount: Math.max(0, Number(req.body.amount) || 0),
      notes: req.body.notes || "",
    });

    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
});

app.get("/api/documents/:userId/:documentId/download", async (req, res, next) => {
  try {
    if (!ensureOwnUser(req, res)) return;
    const document = await TaxDocument.findOne({
      _id: req.params.documentId,
      userId: req.params.userId,
    });
    if (!document) return res.status(404).json({ error: "Document not found" });
    res.download(document.filePath, document.originalName);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/documents/:userId/:documentId", async (req, res, next) => {
  try {
    if (!ensureOwnUser(req, res)) return;
    const document = await TaxDocument.findOneAndDelete({
      _id: req.params.documentId,
      userId: req.params.userId,
    });
    if (document?.filePath && fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/expenses/:userId", async (req, res, next) => {
  try {
    if (!ensureOwnUser(req, res)) return;
    const expenses = await Expense.find({ userId: req.params.userId }).sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    next(error);
  }
});

app.post("/api/expenses/:userId", async (req, res, next) => {
  try {
    if (!ensureOwnUser(req, res)) return;
    const expense = await Expense.create({
      userId: req.params.userId,
      date: req.body.date || "",
      vendor: String(req.body.vendor || "Unknown vendor"),
      category: String(req.body.category || "General"),
      amount: Math.max(0, Number(req.body.amount) || 0),
      gstAmount: Math.max(0, Number(req.body.gstAmount) || 0),
      paymentMode: String(req.body.paymentMode || "Bank"),
      hasInvoice: Boolean(req.body.hasInvoice),
      taxTreatment: req.body.taxTreatment || "Business expense",
      notes: String(req.body.notes || ""),
    });
    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/expenses/:userId/:expenseId", async (req, res, next) => {
  try {
    if (!ensureOwnUser(req, res)) return;
    await Expense.deleteOne({ _id: req.params.expenseId, userId: req.params.userId });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/tax-guide/:userId", async (req, res, next) => {
  try {
    if (!ensureOwnUser(req, res)) return;
    const [session, documents, expenses] = await Promise.all([
      TaxGuideSession.findOneAndUpdate(
        { userId: req.params.userId },
        { $setOnInsert: { userId: req.params.userId, answers: [] } },
        { new: true, upsert: true },
      ),
      TaxDocument.find({ userId: req.params.userId }),
      Expense.find({ userId: req.params.userId }),
    ]);
    res.json(taxGuidePayload(session, documents, expenses));
  } catch (error) {
    next(error);
  }
});

app.post("/api/tax-guide/:userId/answer", async (req, res, next) => {
  try {
    if (!ensureOwnUser(req, res)) return;
    const question = taxQuestions.find((item) => item.id === req.body.questionId);
    if (!question) return res.status(400).json({ error: "Unknown question" });

    const session = await TaxGuideSession.findOneAndUpdate(
      { userId: req.params.userId },
      { $setOnInsert: { userId: req.params.userId, answers: [] } },
      { new: true, upsert: true },
    );
    session.answers = session.answers.filter((answer) => answer.questionId !== question.id);
    session.answers.push({
      questionId: question.id,
      question: question.question,
      answer: String(req.body.answer || ""),
    });
    await session.save();

    const [documents, expenses] = await Promise.all([
      TaxDocument.find({ userId: req.params.userId }),
      Expense.find({ userId: req.params.userId }),
    ]);
    res.json(taxGuidePayload(session, documents, expenses));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/tax-guide/:userId", async (req, res, next) => {
  try {
    if (!ensureOwnUser(req, res)) return;
    await TaxGuideSession.deleteOne({ userId: req.params.userId });
    res.json({ ok: true });
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
