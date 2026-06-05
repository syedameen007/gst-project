import { ArrowRight, UserPlus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { googleLoginUrl } from "../lib/api";
import { useFinance } from "../lib/financeContext";

export default function Signup() {
  const navigate = useNavigate();
  const { signUp } = useFinance();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await signUp({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Could not create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-hero signup-hero">
        <div className="brand login-brand">
          <div className="brand-icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span>Fiscal Lens</span>
            <small>Secure tax workspace</small>
          </div>
        </div>
        <h1>Create your GST tax account</h1>
        <p>
          Save documents, expenses, tax answers, portfolio scenarios, and AI advisor
          conversations under one protected customer profile.
        </p>
        <div className="login-stat-grid">
          <article>
            <strong>Document Vault</strong>
            <span>Upload filing proofs and keep metadata in MongoDB</span>
          </article>
          <article>
            <strong>Guided Filing</strong>
            <span>Beginner-friendly questions for tax preparation</span>
          </article>
        </div>
      </section>

      <form className="login-card" onSubmit={submit}>
        <div className="login-lock">
          <UserPlus size={22} />
        </div>
        <div>
          <span className="eyebrow">Create Account</span>
          <h2>Start securely</h2>
        </div>
        <label>
          Full name
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
            minLength={6}
            required
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(event) => updateField("confirmPassword", event.target.value)}
            minLength={6}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-action login-submit" type="submit" disabled={loading}>
          {loading ? "Creating account" : "Create account"}
          <ArrowRight size={18} />
        </button>
        <button
          className="google-button"
          type="button"
          onClick={() => {
            window.location.href = googleLoginUrl();
          }}
        >
          <span>G</span>
          Sign up with Google
        </button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}
