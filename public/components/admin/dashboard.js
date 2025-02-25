import { UserManagement } from "./userManagement.js";
import { CreditManager } from "./creditManager.js";
import { AnalyticsDashboard } from "./analyticsDashboard.js";
import { ActivityLogs } from "./activityLogs.js";
import { api } from "../../js/api-service.js";

export class AdminDashboard {
  constructor(container) {
    this.container = container;
    this.components = {};
    this.activeTab = "users";
  }

  async initialize() {
    this.render();
    await this.loadComponents();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
            <div class="bg-gray-100 min-h-screen">
                <!-- Navigation -->
                <nav class="bg-indigo-600 shadow-sm">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex justify-between h-16">
                            <div class="flex">
                                <div class="flex-shrink-0 flex items-center">
                                    <h1 class="text-xl font-bold text-white">Admin Dashboard</h1>
                                </div>
                                <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                                    <a href="#" data-tab="users" class="nav-link border-white text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                        Users
                                    </a>
                                    <a href="#" data-tab="credits" class="nav-link border-transparent text-gray-300 hover:border-gray-300 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                        Credit Requests
                                    </a>
                                    <a href="#" data-tab="analytics" class="nav-link border-transparent text-gray-300 hover:border-gray-300 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                        Analytics
                                    </a>
                                    <a href="#" data-tab="logs" class="nav-link border-transparent text-gray-300 hover:border-gray-300 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                        Activity Logs
                                    </a>
                                </div>
                            </div>
                            <div class="flex items-center">
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-800 text-white">
                                    Admin Mode
                                </span>
                                <button id="logoutBtn" class="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                <!-- Main Content -->
                <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <!-- User Management Tab -->
                    <div id="users-tab" class="tab-content">
                        <div class="px-4 py-6 sm:px-0">
                            <div id="user-management-container"></div>
                        </div>
                    </div>

                    <!-- Credit Requests Tab -->
                    <div id="credits-tab" class="tab-content hidden">
                        <div class="px-4 py-6 sm:px-0">
                            <div id="credit-manager-container"></div>
                        </div>
                    </div>

                    <!-- Analytics Tab -->
                    <div id="analytics-tab" class="tab-content hidden">
                        <div class="px-4 py-6 sm:px-0">
                            <div id="analytics-container"></div>
                        </div>
                    </div>

                    <!-- Activity Logs Tab -->
                    <div id="logs-tab" class="tab-content hidden">
                        <div class="px-4 py-6 sm:px-0">
                            <div id="activity-logs-container"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  async loadComponents() {
    // Initialize User Management
    this.components.userManagement = new UserManagement(
      this.container.querySelector("#user-management-container")
    );
    await this.components.userManagement.render();

    // Initialize Credit Manager
    this.components.creditManager = new CreditManager(
      this.container.querySelector("#credit-manager-container")
    );
    await this.components.creditManager.render();

    // Initialize Analytics Dashboard
    this.components.analytics = new AnalyticsDashboard(
      this.container.querySelector("#analytics-container")
    );
    await this.components.analytics.render();

    // Initialize Activity Logs
    this.components.activityLogs = new ActivityLogs(
      this.container.querySelector("#activity-logs-container")
    );
    await this.components.activityLogs.render();
  }

  attachEventListeners() {
    // Tab Navigation
    this.container.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const tab = e.target.dataset.tab;
        this.setActiveTab(tab);
      });
    });

    // Logout Button
    this.container.querySelector("#logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.reload();
    });
  }

  setActiveTab(tabName) {
    // Update active tab
    this.activeTab = tabName;

    // Update navigation links
    this.container.querySelectorAll(".nav-link").forEach((link) => {
      if (link.dataset.tab === tabName) {
        link.classList.add("border-white", "text-white");
        link.classList.remove(
          "border-transparent",
          "text-gray-300",
          "hover:border-gray-300",
          "hover:text-white"
        );
      } else {
        link.classList.remove("border-white", "text-white");
        link.classList.add(
          "border-transparent",
          "text-gray-300",
          "hover:border-gray-300",
          "hover:text-white"
        );
      }
    });

    // Show/hide tab content
    this.container.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.add("hidden");
    });
    this.container.querySelector(`#${tabName}-tab`).classList.remove("hidden");

    // Refresh the active component if it has a refresh method
    if (
      this.components[tabName] &&
      typeof this.components[tabName].refresh === "function"
    ) {
      this.components[tabName].refresh();
    }
  }

  refreshDashboard() {
    // Refresh all components
    Object.values(this.components).forEach((component) => {
      if (typeof component.refresh === "function") {
        component.refresh();
      }
    });
  }
}
