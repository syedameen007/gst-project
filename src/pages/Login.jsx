import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFinance } from "../lib/financeContext";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useFinance();
  const [form, setForm] = useState({
    name: "Demo Customer",
    email: "demo@fiscallens.app",
    password: "demo12345",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="brand login-brand">
          <div className="brand-icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span>Fiscal Lens</span>
            <small>Compliance + savings</small>
          </div>
        </div>
        <h1>Tax-aware finance workspace</h1>
        <p>
          Sign in to access your dashboard, portfolio creator, smart tax planning engine,
          simulator, and AI support chat.
        </p>
        <div className="login-stat-grid">
          <article>
            <strong>MongoDB</strong>
            <span>Profile, portfolio, scenarios, and chat history</span>
          </article>
          <article>
            <strong>ML Model</strong>
            <span>Portfolio return forecast with tax-aware context</span>
          </article>
        </div>
      </section>

      <form className="login-card" onSubmit={submit}>
        <div className="login-lock">
          <LockKeyhole size={22} />
        </div>
        <div>
          <span className="eyebrow">Customer Login</span>
          <h2>Welcome back</h2>
        </div>
        <label>
          Name
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-action login-submit" type="submit" disabled={loading}>
          {loading ? "Signing in" : "Enter dashboard"}
          <ArrowRight size={18} />
        </button>
      </form>
    </main>
  );
}
