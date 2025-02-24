// public/js/main.js
import { AuthManager } from "./utils/auth.js";
import { apiRequest } from "./utils/api.js";

class App {
  constructor() {
    this.init();
  }

  async init() {
    if (AuthManager.isAuthenticated()) {
      this.showDashboard();
    } else {
      this.showLoginForm();
    }
  }

  showLoginForm() {
    const authContainer = document.getElementById("auth-container");
    const mainContainer = document.getElementById("main-container");

    // Show auth container, hide main container
    authContainer.classList.remove("hidden");
    mainContainer.classList.add("hidden");

    // Add login form HTML
    authContainer.innerHTML = `
            <div class="auth-form">
                <h2>Login</h2>
                <form id="loginForm">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Login</button>
                    </div>
                </form>
                <p class="auth-switch">
                    Don't have an account? <a href="#" id="showRegister">Register</a>
                </p>
            </div>
        `;

    // Add event listener for login form
    document
      .getElementById("loginForm")
      .addEventListener("submit", this.handleLogin.bind(this));

    document.getElementById("showRegister").addEventListener("click", (e) => {
      e.preventDefault();
      this.showRegisterForm();
    });
  }

  async handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Show dashboard
      this.showDashboard();
    } catch (error) {
      this.showError(error.message);
    }
  }

  showRegisterForm() {
    const authContainer = document.getElementById("auth-container");
    authContainer.innerHTML = `
        <div class="auth-form">
        <h2>Register</h2>
        <form id="registerForm">
        <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" required>
        </div>
        <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required>
        </div>
        <div class="form-actions">
        <button type="submit" class="btn btn-primary">Register</button>
        </div>
        </form>
        <p class="auth-switch">
        Already have an account? <a href="#" id="showLogin">Login</a>
        </p>
        </div>
        `;

    document
      .getElementById("registerForm")
      .addEventListener("submit", this.handleRegister.bind(this));
    document.getElementById("showLogin").addEventListener("click", (e) => {
      e.preventDefault();
      this.showLoginForm();
    });
  }

  async handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      this.showSuccess("Registration successful! Please login.");
      setTimeout(() => this.showLoginForm(), 1500);
    } catch (error) {
      this.showError(error.message);
    }
  }

  showDashboard() {
    const mainContainer = document.getElementById("main-container");
    const user = JSON.parse(localStorage.getItem("user"));

    mainContainer.innerHTML = `
        <div class="dashboard">
            <nav class="dashboard-nav">
                <ul>
                    <li><a href="#" data-section="profile" class="active">Profile</a></li>
                    <li><a href="#" data-section="documents">Documents</a></li>
                    <li><a href="#" data-section="credits">Credits</a></li>
                </ul>
                <button id="logoutBtn" class="btn btn-logout">Logout</button>
            </nav>
            
            <div class="dashboard-content">
                <!-- Profile Section -->
                <section id="profile-section" class="dashboard-section active">
                    <h2>Profile</h2>
                    <div class="profile-info">
                        <div class="info-group">
                            <label>Username</label>
                            <p>${user.username}</p>
                        </div>
                        <div class="info-group">
                            <label>Credits Available</label>
                            <p>${user.credits}</p>
                        </div>
                        <div class="info-group">
                            <label>Account Type</label>
                            <p>${user.role}</p>
                        </div>
                    </div>
                </section>

                <!-- Documents Section -->
                <section id="documents-section" class="dashboard-section">
                    <h2>Document Management</h2>
                    <div class="upload-section">
                        <form id="uploadForm" class="upload-form">
                            <input type="file" name="document" accept=".txt" required>
                            <button type="submit" class="btn btn-primary">Upload & Scan</button>
                        </form>
                    </div>
                    <div class="documents-list">
                        <h3>Scan History</h3>
                        <div id="scanHistory"></div>
                    </div>
                </section>

                <!-- Credits Section -->
                <section id="credits-section" class="dashboard-section">
                    <h2>Credits Management</h2>
                    <div class="credits-info">
                        <p>Available Credits: <span>${user.credits}</span></p>
                        <button id="requestCreditsBtn" class="btn btn-secondary">Request More Credits</button>
                    </div>
                    <div class="credit-history">
                        <h3>Credit History</h3>
                        <div id="creditHistory"></div>
                    </div>
                </section>
            </div>
        </div>
    `;

    this.attachDashboardHandlers();
    this.loadScanHistory();
    this.loadCreditHistory();
  }

  attachDashboardHandlers() {
    // Navigation
    document.querySelectorAll(".dashboard-nav a").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.switchDashboardSection(e.target.dataset.section);
      });
    });

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload();
    });

    // Document Upload
    document
      .getElementById("uploadForm")
      .addEventListener("submit", this.handleDocumentUpload.bind(this));

    // Credit Request
    document
      .getElementById("requestCreditsBtn")
      .addEventListener("click", this.handleCreditRequest.bind(this));
  }

  switchDashboardSection(sectionId) {
    // Hide all sections and deactivate all nav links
    document.querySelectorAll(".dashboard-section").forEach((section) => {
      section.classList.remove("active");
    });
    document.querySelectorAll(".dashboard-nav a").forEach((link) => {
      link.classList.remove("active");
    });

    // Show selected section and activate nav link
    document.getElementById(`${sectionId}-section`).classList.add("active");
    document
      .querySelector(`[data-section="${sectionId}"]`)
      .classList.add("active");
  }

  async handleDocumentUpload(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const response = await fetch("http://localhost:3000/api/scan/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      this.showSuccess("Document uploaded and scanned successfully");
      this.loadScanHistory(); // Refresh scan history

      // Update credits display
      const user = JSON.parse(localStorage.getItem("user"));
      user.credits = data.userCredits;
      localStorage.setItem("user", JSON.stringify(user));
      this.updateCreditsDisplay(data.userCredits);
    } catch (error) {
      this.showError(error.message);
    }
  }

  async loadScanHistory() {
    try {
      const response = await fetch("http://localhost:3000/api/scan/history", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load scan history");
      }

      const historyDiv = document.getElementById("scanHistory");
      if (data.scans.length === 0) {
        historyDiv.innerHTML =
          '<p class="no-data">No scan history available</p>';
        return;
      }

      historyDiv.innerHTML = `
            <table class="history-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Document</th>
                        <th>Matches</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.scans
                      .map(
                        (scan) => `
                        <tr>
                            <td>${new Date(
                              scan.scanDate
                            ).toLocaleDateString()}</td>
                            <td>${scan.filename}</td>
                            <td>${scan.matchCount || 0} matches</td>
                            <td>
                                <button class="btn btn-small" onclick="viewMatches(${
                                  scan.id
                                })">
                                    View Matches
                                </button>
                            </td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        `;
    } catch (error) {
      this.showError("Failed to load scan history");
    }
  }

  async handleCreditRequest() {
    try {
      const response = await fetch(
        "http://localhost:3000/api/credits/request",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Credit request failed");
      }

      this.showSuccess("Credit request submitted successfully");
      this.loadCreditHistory();
    } catch (error) {
      this.showError(error.message);
    }
  }

  async loadCreditHistory() {
    // Implementation for loading credit history
    // Similar to loadScanHistory but for credits
  }

  updateCreditsDisplay(credits) {
    document.querySelectorAll(".credits-info span").forEach((span) => {
      span.textContent = credits;
    });
  }

  showSuccess(message) {
    const successDiv = document.createElement("div");
    successDiv.className = "success-message";
    successDiv.textContent = message;

    const form = document.getElementById("registerForm");
    form.insertBefore(successDiv, form.firstChild);

    setTimeout(() => successDiv.remove(), 3000);
  }

  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;

    const form = document.getElementById("loginForm");
    form.insertBefore(errorDiv, form.firstChild);

    setTimeout(() => errorDiv.remove(), 3000);
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    new App();
});
