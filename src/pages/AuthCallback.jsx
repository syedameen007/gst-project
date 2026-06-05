import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFinance } from "../lib/financeContext";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { completeAuth } = useFinance();

  useEffect(() => {
    const token = params.get("token");
    const userId = params.get("userId");
    const email = params.get("email");

    if (!token || !userId || !email) {
      navigate("/login?error=google_callback", { replace: true });
      return;
    }

    completeAuth(
      {
        userId,
        email,
        name: params.get("name") || email.split("@")[0],
        role: params.get("role") || "customer",
        authProvider: params.get("authProvider") || "google",
      },
      token,
    );
    navigate("/", { replace: true });
  }, [completeAuth, navigate, params]);

  return (
    <main className="auth-callback">
      <LoaderCircle size={28} />
      <strong>Finishing Google login</strong>
    </main>
  );
}
