import { LogOut, Save, UserRoundCog } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import DataInputs from "../components/DataInputs";
import PageHeader from "../components/PageHeader";
import { useFinance } from "../lib/financeContext";

export default function UserSettings() {
  const { authUser, userId, syncStatus, signOut, saveUserSettings } = useFinance();
  const [form, setForm] = useState({
    name: authUser?.name || "Demo Customer",
    email: authUser?.email || "demo@fiscallens.app",
  });
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    try {
      await saveUserSettings(form);
      setMessage("User information saved.");
    } catch (error) {
      setMessage(error.message || "Unable to save settings.");
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Account"
        title="User Information & Settings"
        subtitle="Manage customer identity, app sync state, and default financial profile values."
      />

      <section className="settings-layout">
        <form className="panel settings-card" onSubmit={submit}>
          <header className="panel-header">
            <div>
              <span className="eyebrow">Customer profile</span>
              <h2>Account Details</h2>
            </div>
            <UserRoundCog size={18} />
          </header>
          <label>
            Name
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <div className="settings-meta">
            <span>User ID</span>
            <strong>{userId}</strong>
          </div>
          <div className="settings-meta">
            <span>Data sync</span>
            <strong>{syncStatus === "mongo" ? "MongoDB connected" : syncStatus}</strong>
          </div>
          {message && <p className="settings-message">{message}</p>}
          <div className="settings-actions">
            <button className="primary-action" type="submit">
              <Save size={17} />
              Save Settings
            </button>
            <Link className="icon-pill settings-login" to="/login" onClick={signOut}>
              <LogOut size={17} />
            </Link>
          </div>
        </form>

        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Financial defaults</span>
              <h2>Profile Inputs</h2>
            </div>
          </header>
          <DataInputs fields={["annualIncome", "current80c", "currentNps", "outputGst", "eligibleItc", "expenseScore"]} />
        </article>
      </section>
    </div>
  );
}
