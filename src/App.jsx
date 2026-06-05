import { Navigate, Route, Routes } from "react-router-dom";
import { FinanceProvider } from "./lib/financeContext";
import { useFinance } from "./lib/financeContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
import CommandCenter from "./pages/CommandCenter";
import TaxInvestments from "./pages/TaxInvestments";
import PortfolioImpact from "./pages/PortfolioImpact";
import PortfolioCreator from "./pages/PortfolioCreator";
import PlanningEngine from "./pages/PlanningEngine";
import WhatIfSimulator from "./pages/WhatIfSimulator";
import AIFinancialAdvisor from "./pages/AIFinancialAdvisor";
import UserSettings from "./pages/UserSettings";
import TaxFilingHelper from "./pages/TaxFilingHelper";

function ProtectedLayout() {
  const { authUser } = useFinance();

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<CommandCenter />} />
        <Route path="/investments" element={<TaxInvestments />} />
        <Route path="/portfolio" element={<PortfolioImpact />} />
        <Route path="/portfolio-creator" element={<PortfolioCreator />} />
        <Route path="/tax-filing-helper" element={<TaxFilingHelper />} />
        <Route path="/planning-engine" element={<PlanningEngine />} />
        <Route path="/simulator" element={<WhatIfSimulator />} />
        <Route path="/advisor" element={<AIFinancialAdvisor />} />
        <Route path="/settings" element={<UserSettings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </FinanceProvider>
  );
}
