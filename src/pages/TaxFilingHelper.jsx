import {
  CircleHelp,
  FileText,
  ReceiptText,
  RefreshCcw,
  Send,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import {
  addExpense,
  answerTaxGuide,
  deleteDocument,
  deleteExpense,
  fetchDocuments,
  fetchExpenses,
  fetchTaxGuide,
  resetTaxGuide,
  uploadDocument,
} from "../lib/api";
import { useFinance } from "../lib/financeContext";
import { money } from "../lib/taxEngine";

const documentCategories = [
  "Form 16",
  "GST invoice",
  "Investment proof",
  "Rent / home loan",
  "Bank statement",
  "Expense bill",
  "Other",
];

const expenseCategories = [
  "Software",
  "Travel",
  "Internet",
  "Rent",
  "Professional fees",
  "Purchase",
  "Marketing",
  "Other",
];

const initialExpense = {
  date: new Date().toISOString().slice(0, 10),
  vendor: "",
  category: "Software",
  amount: 0,
  gstAmount: 0,
  paymentMode: "Bank",
  hasInvoice: true,
  taxTreatment: "Business expense",
  notes: "",
};

export default function TaxFilingHelper() {
  const { userId } = useFinance();
  const [documents, setDocuments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [guide, setGuide] = useState(null);
  const [uploadState, setUploadState] = useState({
    file: null,
    category: "Form 16",
    documentDate: new Date().toISOString().slice(0, 10),
    amount: 0,
    notes: "",
  });
  const [expense, setExpense] = useState(initialExpense);
  const [customAnswer, setCustomAnswer] = useState("");
  const [status, setStatus] = useState("Ready");

  const totals = useMemo(() => {
    const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const gstExpense = expenses.reduce((sum, item) => sum + Number(item.gstAmount || 0), 0);
    return { totalExpense, gstExpense };
  }, [expenses]);

  async function loadAll() {
    const [documentList, expenseList, guideState] = await Promise.all([
      fetchDocuments(userId),
      fetchExpenses(userId),
      fetchTaxGuide(userId),
    ]);
    setDocuments(documentList);
    setExpenses(expenseList);
    setGuide(guideState);
  }

  useEffect(() => {
    loadAll().catch(() => setStatus("Could not load filing helper data"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function submitDocument(event) {
    event.preventDefault();
    if (!uploadState.file) {
      setStatus("Choose a document first");
      return;
    }

    const formData = new FormData();
    formData.append("document", uploadState.file);
    formData.append("category", uploadState.category);
    formData.append("documentDate", uploadState.documentDate);
    formData.append("amount", uploadState.amount);
    formData.append("notes", uploadState.notes);

    setStatus("Uploading document");
    await uploadDocument(userId, formData);
    setUploadState((current) => ({ ...current, file: null, amount: 0, notes: "" }));
    setStatus("Document uploaded");
    await loadAll();
  }

  async function submitExpense(event) {
    event.preventDefault();
    if (!expense.vendor || Number(expense.amount) <= 0) {
      setStatus("Add vendor and amount for the expense");
      return;
    }

    setStatus("Saving expense");
    await addExpense(userId, expense);
    setExpense(initialExpense);
    setStatus("Expense saved");
    await loadAll();
  }

  async function answerQuestion(answer) {
    if (!guide?.nextQuestion) return;
    setStatus("Saving answer");
    const nextGuide = await answerTaxGuide(userId, guide.nextQuestion.id, answer);
    setGuide(nextGuide);
    setCustomAnswer("");
    setStatus("Answer saved");
  }

  async function removeDocument(documentId) {
    await deleteDocument(userId, documentId);
    await loadAll();
  }

  async function removeExpense(expenseId) {
    await deleteExpense(userId, expenseId);
    await loadAll();
  }

  async function restartGuide() {
    await resetTaxGuide(userId);
    await loadAll();
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Beginner filing support"
        title="Tax Filing Helper"
        subtitle="Upload documents, write expenses, and let the assistant ask the right tax questions step by step."
      />

      <section className="metric-grid">
        <MetricCard label="Documents" value={documents.length} meta="uploaded proofs" tone="blue" />
        <MetricCard label="Expenses" value={money(totals.totalExpense)} meta={`${expenses.length} entries`} tone="green" />
        <MetricCard label="GST in Expenses" value={money(totals.gstExpense)} meta="possible ITC review" tone="amber" />
        <MetricCard label="Guide Progress" value={`${guide?.progress || 0}%`} meta={status} tone="rose" />
      </section>

      <section className="filing-layout">
        <article className="panel dark-panel guide-panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">AI tax mentor</span>
              <h2>Guided Questions</h2>
            </div>
            <CircleHelp size={18} />
          </header>

          {guide?.nextQuestion ? (
            <div className="question-card">
              <h3>{guide.nextQuestion.question}</h3>
              <p>{guide.nextQuestion.helper}</p>
              <div className="answer-grid">
                {guide.nextQuestion.options.map((option) => (
                  <button type="button" key={option} onClick={() => answerQuestion(option)}>
                    {option}
                  </button>
                ))}
              </div>
              <form
                className="custom-answer"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (customAnswer.trim()) answerQuestion(customAnswer.trim());
                }}
              >
                <input
                  value={customAnswer}
                  onChange={(event) => setCustomAnswer(event.target.value)}
                  placeholder="Write your own answer"
                />
                <button type="submit">
                  <Send size={16} />
                </button>
              </form>
            </div>
          ) : (
            <div className="question-card">
              <h3>Question flow complete</h3>
              <p>Review your uploaded documents and expenses before filing.</p>
            </div>
          )}

          <div className="guide-summary">
            <strong>Next checklist</strong>
            <p>{guide?.guidance}</p>
            <div>
              {(guide?.summary?.missingDocuments || []).map((item) => (
                <span key={item}>{item}</span>
              ))}
              {!guide?.summary?.missingDocuments?.length && <span>No missing document flagged yet</span>}
            </div>
          </div>
          <button className="primary-action secondary-action" type="button" onClick={restartGuide}>
            <RefreshCcw size={17} />
            Restart Questions
          </button>
        </article>

        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Document vault</span>
              <h2>Upload Tax Documents</h2>
            </div>
            <UploadCloud size={18} />
          </header>
          <form className="upload-form" onSubmit={submitDocument}>
            <label className="file-drop">
              <FileText size={22} />
              <span>{uploadState.file ? uploadState.file.name : "Choose PDF, image, or statement"}</span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.xlsx"
                onChange={(event) =>
                  setUploadState((current) => ({ ...current, file: event.target.files?.[0] || null }))
                }
              />
            </label>
            <div className="helper-form-grid">
              <label>
                Category
                <select
                  value={uploadState.category}
                  onChange={(event) => setUploadState((current) => ({ ...current, category: event.target.value }))}
                >
                  {documentCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label>
                Date
                <input
                  type="date"
                  value={uploadState.documentDate}
                  onChange={(event) =>
                    setUploadState((current) => ({ ...current, documentDate: event.target.value }))
                  }
                />
              </label>
              <label>
                Amount
                <input
                  type="number"
                  value={uploadState.amount}
                  onChange={(event) => setUploadState((current) => ({ ...current, amount: event.target.value }))}
                />
              </label>
              <label>
                Notes
                <input
                  value={uploadState.notes}
                  onChange={(event) => setUploadState((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Example: Form 16 from employer"
                />
              </label>
            </div>
            <button className="primary-action" type="submit">
              <UploadCloud size={17} />
              Upload Document
            </button>
          </form>

          <div className="document-list">
            {documents.map((document) => (
              <article key={document._id}>
                <div>
                  <strong>{document.originalName}</strong>
                  <span>
                    {document.category} · {money(document.amount || 0)}
                  </span>
                </div>
                <button className="icon-pill danger" type="button" onClick={() => removeDocument(document._id)}>
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="expense-layout">
        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Expense writer</span>
              <h2>Add Expenses</h2>
            </div>
            <ReceiptText size={18} />
          </header>
          <form className="helper-form-grid expense-form" onSubmit={submitExpense}>
            <label>
              Date
              <input
                type="date"
                value={expense.date}
                onChange={(event) => setExpense((current) => ({ ...current, date: event.target.value }))}
              />
            </label>
            <label>
              Vendor
              <input
                value={expense.vendor}
                onChange={(event) => setExpense((current) => ({ ...current, vendor: event.target.value }))}
                placeholder="Vendor or merchant"
              />
            </label>
            <label>
              Category
              <select
                value={expense.category}
                onChange={(event) => setExpense((current) => ({ ...current, category: event.target.value }))}
              >
                {expenseCategories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label>
              Amount
              <input
                type="number"
                value={expense.amount}
                onChange={(event) => setExpense((current) => ({ ...current, amount: event.target.value }))}
              />
            </label>
            <label>
              GST amount
              <input
                type="number"
                value={expense.gstAmount}
                onChange={(event) => setExpense((current) => ({ ...current, gstAmount: event.target.value }))}
              />
            </label>
            <label>
              Tax treatment
              <select
                value={expense.taxTreatment}
                onChange={(event) => setExpense((current) => ({ ...current, taxTreatment: event.target.value }))}
              >
                <option>Business expense</option>
                <option>Input tax credit</option>
                <option>Personal</option>
                <option>Review needed</option>
              </select>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={expense.hasInvoice}
                onChange={(event) => setExpense((current) => ({ ...current, hasInvoice: event.target.checked }))}
              />
              Invoice available
            </label>
            <button className="primary-action" type="submit">
              <ReceiptText size={17} />
              Save Expense
            </button>
          </form>
        </article>

        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Expense ledger</span>
              <h2>Saved Expenses</h2>
            </div>
          </header>
          <div className="expense-list">
            {expenses.map((item) => (
              <article key={item._id}>
                <div>
                  <strong>{item.vendor}</strong>
                  <span>
                    {item.category} · {item.taxTreatment} · GST {money(item.gstAmount || 0)}
                  </span>
                </div>
                <strong>{money(item.amount)}</strong>
                <button className="icon-pill danger" type="button" onClick={() => removeExpense(item._id)}>
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
