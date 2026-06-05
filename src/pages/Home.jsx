import {
  Bot,
  BrainCircuit,
  Calculator,
  ArrowUpRight,
  LayoutDashboard,
  LogIn,
  PieChart,
  PiggyBank,
  Settings,
  SquarePen,
  UploadCloud,
} from "lucide-react";
import { Link } from "react-router-dom";
import MetricCard from "../components/MetricCard";
import { useFinance } from "../lib/financeContext";
import { money } from "../lib/taxEngine";

const tiles = [
  {
    to: "/dashboard",
    title: "Portfolio Overview",
    body: "Open the command dashboard with tax, GST, and portfolio KPIs.",
    icon: LayoutDashboard,
  },
  {
    to: "/portfolio-creator",
    title: "Portfolio Creator",
    body: "Build tax-aware assets and save allocations to MongoDB.",
    icon: SquarePen,
  },
  {
    to: "/tax-filing-helper",
    title: "Tax Filing Helper",
    body: "Upload documents, write expenses, and answer guided filing questions.",
    icon: UploadCloud,
  },
  {
    to: "/investments",
    title: "Tax Investments",
    body: "See 80C and NPS suggestions that reduce liability.",
    icon: PiggyBank,
  },
  {
    to: "/portfolio",
    title: "Portfolio Tax Impact",
    body: "Compare value, gains, and tax payable before vs after.",
    icon: PieChart,
  },
  {
    to: "/planning-engine",
    title: "Planning Engine",
    body: "Combine GST, expenses, investments, and risk checks.",
    icon: BrainCircuit,
  },
  {
    to: "/simulator",
    title: "What-If Simulator",
    body: "Try investment scenarios and ML-assisted growth estimates.",
    icon: Calculator,
  },
  {
    to: "/advisor",
    title: "AI Advisor",
    body: "Ask customer-support and planning questions.",
    icon: Bot,
  },
  {
    to: "/settings",
    title: "User Settings",
    body: "Manage customer information and app preferences.",
    icon: Settings,
  },
];

export default function Home() {
  const { authUser, model, prediction } = useFinance();

  return (
    <div className="page">
      <section className="modern-home">
        <div className="home-topnav">
          <strong>Fiscalora.</strong>
          <nav aria-label="Home navigation">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/portfolio-creator">Portfolio</Link>
            <Link to="/planning-engine">Engine</Link>
            <Link to="/simulator">Simulator</Link>
            <Link to="/advisor">Advisor</Link>
          </nav>
          <div className="home-auth-actions">
            <Link to="/settings">Settings</Link>
            <Link className="home-signup" to="/login">
              <LogIn size={14} />
              Switch
            </Link>
          </div>
        </div>

        <div className="modern-hero-grid">
          <div className="modern-hero-copy">
            <span className="eyebrow">Welcome{authUser?.name ? `, ${authUser.name}` : ""}</span>
            <h1>Empower Your Finance with Tax-Aware Intelligence</h1>
            <p>
              Drive tax savings, GST compliance, portfolio planning, and ML-assisted
              forecasts from one connected workspace.
            </p>
            <div className="modern-hero-actions">
              <Link className="orange-action" to="/dashboard">
                Get Started
                <ArrowUpRight size={16} />
              </Link>
              <Link className="text-action" to="/portfolio-creator">Create Portfolio</Link>
            </div>
            <div className="partner-row" aria-label="Core modules">
              <span>Tax AI</span>
              <span>GST Engine</span>
              <span>Portfolio ML</span>
              <span>Advisor Chat</span>
            </div>
          </div>

          <div className="modern-hero-art">
            <div className="member-badge">Active {Math.max(2, Math.round(model.totalSaved / 100000))}x Savings</div>
            <img
              src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80"
              alt="Customer reviewing financial dashboard on laptop"
            />
          </div>
        </div>
      </section>

      <section className="metric-grid">
        <MetricCard label="Tax Reduced" value={money(model.totalSaved)} meta="deductions + ITC" tone="green" />
        <MetricCard label="Portfolio Value" value={money(model.currentPortfolio)} meta="live profile data" tone="blue" />
        <MetricCard label="ITC Gap" value={money(model.itcGap)} meta="GST opportunity" tone="amber" />
        <MetricCard
          label="ML Forecast"
          value={prediction ? `${Math.round(prediction.monthlyReturn * 10000) / 100}%` : model.bestRegime}
          meta={prediction?.modelName || "model pending"}
          tone="rose"
        />
      </section>

      <section className="home-grid">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link className="home-tile" to={tile.to} key={tile.to}>
              <Icon size={22} />
              <strong>{tile.title}</strong>
              <span>{tile.body}</span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
