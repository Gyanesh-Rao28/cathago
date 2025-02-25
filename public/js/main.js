// Imports
import { UserDashboard } from "../components/user/dashboard.js";
import { checkAdminAndLoadDashboard } from "./admin-loader.js";

// Constants
const API_URL = "http://localhost:3000/api";
let authToken = localStorage.getItem("token");
let userDashboard = null;

// DOM Elements
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginContainer = document.getElementById("login-form");
const registerContainer = document.getElementById("register-form");
const mainApp = document.getElementById("main-app");
const showRegisterLink = document.getElementById("showRegister");
const showLoginLink = document.getElementById("showLogin");

// Event Listeners
showRegisterLink.addEventListener("click", (e) => {
  e.preventDefault();
  loginContainer.classList.add("hidden");
  registerContainer.classList.remove("hidden");
});

showLoginLink.addEventListener("click", (e) => {
  e.preventDefault();
  registerContainer.classList.add("hidden");
  loginContainer.classList.remove("hidden");
});

// Login Form Handler
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(loginForm);
  const data = {
    username: formData.get("username"),
    password: formData.get("password"),
  };

  try {
    showLoadingState(loginForm, true);

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Login failed");
    }

    // Store token and redirect
    localStorage.setItem("token", result.token);
    authToken = result.token;
    await checkAuthAndRedirect();
  } catch (error) {
    showAlert(error.message, "error");
  } finally {
    showLoadingState(loginForm, false);
  }
});

// Register Form Handler
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(registerForm);
  const data = {
    username: formData.get("username"),
    password: formData.get("password"),
  };

  try {
    showLoadingState(registerForm, true);

    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Registration failed");
    }

    showAlert("Registration successful! Please login.", "success");
    registerContainer.classList.add("hidden");
    loginContainer.classList.remove("hidden");
    registerForm.reset();
  } catch (error) {
    showAlert(error.message, "error");
  } finally {
    showLoadingState(registerForm, false);
  }
});

// Utility Functions
function showAlert(message, type = "info") {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;

  const container = document.querySelector(".container");
  if (container) {
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => {
      alertDiv.remove();
    }, 5000);
  }
}

function showLoadingState(form, isLoading) {
  const submitBtn = form.querySelector('button[type="submit"]');
  if (isLoading) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span> Processing...';
  } else {
    submitBtn.disabled = false;
    submitBtn.innerHTML = form.id === "loginForm" ? "Login" : "Register";
  }
}

async function checkAuthAndRedirect() {
  if (!authToken) {
    loginContainer.classList.remove("hidden");
    mainApp.classList.add("hidden");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/user/profile`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Authentication failed");
    }

    const userData = await response.json();
    loadMainApp(userData.profile);
  } catch (error) {
    console.error("Auth error:", error);
    localStorage.removeItem("token");
    authToken = null;
    loginContainer.classList.remove("hidden");
    mainApp.classList.add("hidden");
    showAlert("Session expired. Please login again.", "error");
  }
}

async function loadMainApp(userData) {
  loginContainer.classList.add("hidden");
  registerContainer.classList.add("hidden");
  mainApp.classList.remove("hidden");

  // Check if user is admin and load admin dashboard if they are
  const isAdmin = userData.role === "admin";

  if (isAdmin) {
    try {
      // Try to load admin dashboard
      const adminLoaded = await checkAdminAndLoadDashboard(mainApp);
      if (adminLoaded) {
        console.log("Admin dashboard loaded");
        return;
      }
    } catch (error) {
      console.error("Failed to load admin dashboard:", error);
      // Fall back to user dashboard if admin dashboard fails to load
    }
  }

  // If we get here, either user is not admin or admin dashboard failed to load
  // So we load the user dashboard
  userDashboard = new UserDashboard(mainApp);
  await userDashboard.initialize(userData);
}

// Check authentication on page load
checkAuthAndRedirect();

// Add global error handler
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  showAlert("An error occurred. Please try again.", "error");
});

// Add network error handler
window.addEventListener("offline", () => {
  showAlert("You are offline. Please check your internet connection.", "error");
});
