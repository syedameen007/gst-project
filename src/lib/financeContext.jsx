import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  clearStoredUser,
  fetchProfile,
  getStoredUser,
  getUserId,
  loginUser,
  saveProfile,
  storeUser,
  updateUser,
} from "./api";
import { buildModel, DEFAULT_INPUTS } from "./taxEngine";

const FinanceContext = createContext(null);
const STORAGE_KEY = "fiscal-lens-inputs";

function loadInputs() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { ...DEFAULT_INPUTS, ...saved };
  } catch {
    return DEFAULT_INPUTS;
  }
}

export function FinanceProvider({ children }) {
  const [userId, setUserId] = useState(getUserId);
  const [authUser, setAuthUser] = useState(getStoredUser);
  const [inputs, setInputs] = useState(loadInputs);
  const [regime, setRegime] = useState("old");
  const [prediction, setPrediction] = useState(null);
  const [syncStatus, setSyncStatus] = useState("local");
  const hydrated = useRef(false);
  const model = useMemo(() => buildModel(inputs, regime), [inputs, regime]);

  useEffect(() => {
    let active = true;
    hydrated.current = false;
    fetchProfile(userId)
      .then((profile) => {
        if (!active) return;
        setInputs({ ...DEFAULT_INPUTS, ...profile.inputs });
        setRegime(profile.regime || "old");
        setPrediction(profile.prediction || null);
        setSyncStatus("mongo");
        hydrated.current = true;
      })
      .catch(() => {
        hydrated.current = true;
        setSyncStatus("local");
      });
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    if (!hydrated.current) return;

    const timeout = window.setTimeout(() => {
      setSyncStatus("saving");
      saveProfile(userId, inputs, regime)
        .then((profile) => {
          setPrediction(profile.prediction || null);
          setSyncStatus("mongo");
        })
        .catch(() => setSyncStatus("local"));
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [inputs, regime, userId]);

  function updateInput(name, value) {
    setInputs((current) => ({
      ...current,
      [name]: Number(value),
      ...(name === "simAmount" ? { plannedInvestment: Number(value) } : {}),
      ...(name === "plannedInvestment" ? { simAmount: Number(value) } : {}),
    }));
  }

  async function signIn(credentials) {
    const response = await loginUser(credentials);
    storeUser(response.user, response.token);
    setAuthUser(response.user);
    setUserId(response.user.userId);
    return response.user;
  }

  function signOut() {
    clearStoredUser();
    setAuthUser(null);
  }

  async function saveUserSettings(updates) {
    const response = await updateUser(userId, updates);
    storeUser(response.user);
    setAuthUser(response.user);
    return response.user;
  }

  return (
    <FinanceContext.Provider
      value={{
        userId,
        authUser,
        inputs,
        model,
        prediction,
        syncStatus,
        regime,
        setRegime,
        updateInput,
        signIn,
        signOut,
        saveUserSettings,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error("useFinance must be used inside FinanceProvider");
  return value;
}
