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

export function fetchProfile(userId) {
  return request(`/api/profile/${userId}`);
}

export function loginUser(credentials) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
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
