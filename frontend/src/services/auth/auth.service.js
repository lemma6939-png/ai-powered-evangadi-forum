import { apiClient } from "../core/api.client.js";

/**
 * Registers a new user.
 * @param {Object} userData - User details for registration.
 */
async function register(userData) {
  try {
    const response = await apiClient.post("/api/auth/register", userData);
    return { user: response.data.user };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Logs in an existing user and stores their session in sessionStorage.
 * @param {Object} credentials - User login credentials.
 */
async function login(credentials) {
  try {
    const response = await apiClient.post("/api/auth/login", credentials);
    const { user, token } = response.data;

    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(user));

    return { user, token };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Logs out the current user by clearing sessionStorage.
 */
function logout() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
}

/**
 * Retrieves the stored JWT token from sessionStorage.
 */
function getStoredToken() {
  return sessionStorage.getItem("token");
}

/**
 * Retrieves the stored user object from sessionStorage.
 */
function getStoredUser() {
  const userJson = sessionStorage.getItem("user");
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch (error) {
    // If JSON parsing fails, clear invalid data
    sessionStorage.removeItem("user");
    return null;
  }
}

/**
 * Checks if the user is currently authenticated based on session storage.
 */
function isAuthenticated() {
  const token = getStoredToken();
  if (!token || typeof token !== "string") return false;

  const t = token.trim();
  if (!t) return false;

  // If token looks like a JWT, validate expiry (`exp` claim).
  const parts = t.split(".");
  if (parts.length !== 3) {
    // Not a JWT; assume presence of a non-empty token indicates auth.
    return true;
  }

  try {
    // Decode base64 payload (URL-safe base64)
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");

    // Add padding if necessary
    const pad = payload.length % 4;
    const padded =
      pad === 2
        ? payload + "=="
        : pad === 3
          ? payload + "="
          : pad === 0
            ? payload
            : payload;

    const decoded = atob(padded);
    const obj = JSON.parse(decoded);

    if (obj && typeof obj.exp === "number") {
      const now = Math.floor(Date.now() / 1000);
      return obj.exp > now;
    }

    // No exp claim — assume token is valid
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Centralized error handler for auth service requests.
 */
function handleAuthError(error) {
  if (!error.response) {
    if (error.code === "ECONNABORTED") {
      return new Error("Request timed out. Please try again.");
    }
    return new Error(
      "Unable to connect to server. Please check your internet connection.",
    );
  }

  const status = error.response.status;
  const backendMessage =
    error.response.data?.msg || error.response.data?.message;

  switch (status) {
    case 400:
      return new Error(backendMessage || "Invalid input data.");
    case 401:
      return new Error(backendMessage || "Invalid email or password.");
    case 500:
      return new Error(
        "Something went wrong on our end. Please try again later.",
      );
    default:
      return new Error(backendMessage || "An unexpected error occurred.");
  }
}

/**
 * Service for handling auth-related requests.
 */
export const authService = {
  register,
  login,
  logout,
  getStoredToken,
  getStoredUser,
  isAuthenticated,
};
