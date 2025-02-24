import { API_URL } from "../../js/utils/api.js";

export class LoginComponent {
  constructor() {
    this.container = document.querySelector("#auth-container");
    this.init();
  }

  async init() {
    // Load template
    const response = await fetch("/templates/auth/login.html");
    const template = await response.text();
    this.container.innerHTML = template;

    // Add event listeners
    this.attachEventListeners();
  }

  attachEventListeners() {
    const loginForm = document.querySelector("#loginForm");
    const showRegisterLink = document.querySelector("#showRegister");

    loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    showRegisterLink.addEventListener("click", (e) => this.showRegister(e));
  }

  async handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      username: formData.get("username"),
      password: formData.get("password"),
    };

    try {
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

      // Store token
      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));

      // Trigger successful login event
      const event = new CustomEvent("login-success", {
        detail: result.user,
      });
      window.dispatchEvent(event);
    } catch (error) {
      this.showError(error.message);
    }
  }

  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;

    const form = document.querySelector("#loginForm");
    form.insertBefore(errorDiv, form.firstChild);

    setTimeout(() => errorDiv.remove(), 3000);
  }

  showRegister(e) {
    e.preventDefault();
    // Trigger event to switch to register component
    const event = new CustomEvent("show-register");
    window.dispatchEvent(event);
  }
}
