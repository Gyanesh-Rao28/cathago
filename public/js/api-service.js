// API Service - centralized place for API calls and error handling

class ApiService {
  constructor() {
    this.baseUrl = "http://localhost:3000/api";
    this.token = localStorage.getItem("token");
  }

  // Get authentication headers
  getHeaders(includeContentType = true) {
    const headers = {
      Authorization: `Bearer ${this.token}`,
    };

    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  }

  // Update token
  setToken(token) {
    this.token = token;
    localStorage.setItem("token", token);
  }

  // Error handler
  handleError(error, customMessage = null) {
    console.error("API Error:", error);

    // Network errors
    if (
      error.name === "TypeError" &&
      error.message.includes("Failed to fetch")
    ) {
      return {
        error: true,
        message: "Network error. Please check your internet connection.",
      };
    }

    // Custom error messages
    if (customMessage) {
      return {
        error: true,
        message: customMessage,
        originalError: error,
      };
    }

    return {
      error: true,
      message: error.message || "An unexpected error occurred",
      originalError: error,
    };
  }

  // Generic fetch with error handling
  async fetchWithErrorHandling(url, options, customErrorMessage = null) {
    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 401) {
          // Clear token and trigger reload if unauthorized
          localStorage.removeItem("token");
          setTimeout(() => window.location.reload(), 1000);
          throw new Error("Your session has expired. Please log in again.");
        } else if (response.status === 403) {
          throw new Error("You do not have permission to perform this action.");
        } else if (response.status === 429) {
          throw new Error("Too many requests. Please try again later.");
        }

        throw new Error(data.message || `Error: ${response.status}`);
      }

      return { error: false, data };
    } catch (error) {
      return this.handleError(error, customErrorMessage);
    }
  }

  // API Methods

  // Auth API calls
  async login(username, password) {
    return this.fetchWithErrorHandling(
      `${this.baseUrl}/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      },
      "Login failed. Please check your credentials."
    );
  }

  async register(username, password) {
    return this.fetchWithErrorHandling(
      `${this.baseUrl}/auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      },
      "Registration failed. Username may already be taken."
    );
  }

  async getUserProfile() {
    return this.fetchWithErrorHandling(
      `${this.baseUrl}/auth/user/profile`,
      {
        headers: this.getHeaders(),
      },
      "Failed to fetch user profile."
    );
  }

  // Document API calls
  async uploadDocument(formData, useAI = false) {
    const url = useAI
      ? `${this.baseUrl}/scan/upload?useAI=true`
      : `${this.baseUrl}/scan/upload`;

    return this.fetchWithErrorHandling(
      url,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${this.token}` },
        body: formData,
      },
      "Document upload failed. Please try again."
    );
  }

  async getScanHistory() {
    return this.fetchWithErrorHandling(
      `${this.baseUrl}/scan/history`,
      {
        headers: this.getHeaders(),
      },
      "Failed to load scan history."
    );
  }

  async getDocumentMatches(docId) {
    return this.fetchWithErrorHandling(
      `${this.baseUrl}/scan/matches/${docId}`,
      {
        headers: this.getHeaders(),
      },
      "Failed to fetch document matches."
    );
  }

  // Credit API calls
  async requestCredits(amount) {
    return this.fetchWithErrorHandling(
      `${this.baseUrl}/credits/request`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ amount }),
      },
      "Credit request failed. Please try again later."
    );
  }
}

// Create and export a singleton instance
export const api = new ApiService();
