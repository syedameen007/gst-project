import {
  Bot,
  BrainCircuit,
  Headphones,
  Home,
  LayoutDashboard,
  MessageCircle,
  PieChart,
  PiggyBank,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  SquarePen,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import SupportChat from "./SupportChat";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/investments", label: "Tax Investments", icon: PiggyBank },
  { to: "/portfolio", label: "Portfolio Impact", icon: PieChart },
  { to: "/portfolio-creator", label: "Portfolio Creator", icon: SquarePen },
  { to: "/planning-engine", label: "Planning Engine", icon: BrainCircuit },
  { to: "/simulator", label: "Simulator", icon: SlidersHorizontal },
  { to: "/advisor", label: "AI Advisor", icon: MessageCircle },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span>Fiscal Lens</span>
            <small>Tax-aware finance</small>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.to === "/"} className="nav-link">
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-assistant">
          <Headphones size={18} />
          <div>
            <strong>AI Support</strong>
            <span>Every page</span>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="mobile-topbar">
          <div className="brand compact">
            <div className="brand-icon">
              <ShieldCheck size={18} />
            </div>
            <span>Fiscal Lens</span>
          </div>
          <Bot size={20} />
        </header>

        <main>{children}</main>
        <SupportChat />
      </div>
    </div>
  );
}
