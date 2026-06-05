const API_URL = import.meta.env.VITE_API_URL || "";
const USER_KEY = "fiscal-lens-user-id";
const USER_PROFILE_KEY = "fiscal-lens-user-profile";
const USER_TOKEN_KEY = "fiscal-lens-session-token";

export function getUserId() {
  let userId = localStorage.getItem(USER_KEY);
  if (!userId) {
    userId = `user-${crypto.randomUUID()}`;
    localStorage.setItem(USER_KEY, userId);
  }
  return userId;
}

export function getStoredUser() {
  try {
    if (!localStorage.getItem(USER_TOKEN_KEY)) return null;
    return JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || "null");
  } catch {
    return null;
  }
}

export function storeUser(user, token) {
  localStorage.setItem(USER_KEY, user.userId);
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
  if (token) localStorage.setItem(USER_TOKEN_KEY, token);
}

export function clearStoredUser() {
  localStorage.removeItem(USER_PROFILE_KEY);
  localStorage.removeItem(USER_TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = localStorage.getItem(USER_TOKEN_KEY);
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function uploadRequest(path, formData) {
  const token = localStorage.getItem(USER_TOKEN_KEY);
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

export function fetchProfile(userId) {
  return request(`/api/profile/${userId}`);
}

export function loginUser(credentials) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function signupUser(credentials) {
  return request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function googleLoginUrl() {
  return `${API_URL}/api/auth/google/start`;
}

export function updateUser(userId, updates) {
  return request(`/api/user/${userId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export function saveProfile(userId, inputs, regime) {
  return request(`/api/profile/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ inputs, regime }),
  });
}

export function createPrediction(userId, inputs, regime) {
  return request("/api/predict", {
    method: "POST",
    body: JSON.stringify({ userId, inputs, regime }),
  });
}

export function askSupport(userId, page, message) {
  return request("/api/chat", {
    method: "POST",
    body: JSON.stringify({ userId, page, message }),
  });
}

export function saveScenario(userId, name, inputs, regime) {
  return request("/api/scenarios", {
    method: "POST",
    body: JSON.stringify({ userId, name, inputs, regime }),
  });
}

export function fetchPortfolio(userId) {
  return request(`/api/portfolio/${userId}`);
}

export function savePortfolio(userId, portfolio) {
  return request(`/api/portfolio/${userId}`, {
    method: "PUT",
    body: JSON.stringify(portfolio),
  });
}

export function fetchDocuments(userId) {
  return request(`/api/documents/${userId}`);
}

export function uploadDocument(userId, formData) {
  return uploadRequest(`/api/documents/${userId}`, formData);
}

export function deleteDocument(userId, documentId) {
  return request(`/api/documents/${userId}/${documentId}`, { method: "DELETE" });
}

export function fetchExpenses(userId) {
  return request(`/api/expenses/${userId}`);
}

export function addExpense(userId, expense) {
  return request(`/api/expenses/${userId}`, {
    method: "POST",
    body: JSON.stringify(expense),
  });
}

export function deleteExpense(userId, expenseId) {
  return request(`/api/expenses/${userId}/${expenseId}`, { method: "DELETE" });
}

export function fetchTaxGuide(userId) {
  return request(`/api/tax-guide/${userId}`);
}

export function answerTaxGuide(userId, questionId, answer) {
  return request(`/api/tax-guide/${userId}/answer`, {
    method: "POST",
    body: JSON.stringify({ questionId, answer }),
  });
}

export function resetTaxGuide(userId) {
  return request(`/api/tax-guide/${userId}`, { method: "DELETE" });
}
