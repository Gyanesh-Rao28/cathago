import { UserProfile } from "./profile.js";
import { DocumentUpload } from "./documentUpload.js";
import { ScanHistory } from "./scanHistory.js";
import { CreditRequest } from "./creditRequest.js";
import { ScanResults } from "./scanResults.js";
import { DocumentMatches } from "./documentMatches.js";

export class UserDashboard {
    constructor(container) {
        this.container = container;
        this.components = {};
        this.activeTab = "dashboard";
    }

    async initialize(userData) {
        this.userData = userData;
        this.render();
        await this.loadComponents();
        this.attachEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="bg-gray-100 min-h-screen">
                <!-- Navigation -->
                <nav class="bg-white shadow-sm">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex justify-between h-16">
                            <div class="flex">
                                <div class="flex-shrink-0 flex items-center">
                                    <h1 class="text-xl font-bold text-gray-900">Document Scanner</h1>
                                </div>
                                <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                                    <a href="#" data-tab="dashboard" class="nav-link border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                        Dashboard
                                    </a>
                                    <a href="#" data-tab="scan" class="nav-link border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                        Scan Document
                                    </a>
                                    <a href="#" data-tab="history" class="nav-link border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                        Scan History
                                    </a>
                                    <a href="#" data-tab="credits" class="nav-link border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                        Credits
                                    </a>
                                </div>
                            </div>
                            <div class="flex items-center">
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    ${this.userData.credits} Credits
                                </span>
                                <button id="logoutBtn" class="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                <!-- Main Content -->
                <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <!-- Dashboard Tab -->
                    <div id="dashboard-tab" class="tab-content">
                        <div class="px-4 py-6 sm:px-0">
                            <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <div id="profile-container"></div>
                                <div id="credit-summary-container"></div>
                            </div>
                            <div class="mt-6" id="recent-scans-container"></div>
                        </div>
                    </div>

                    <!-- Scan Document Tab -->
                    <div id="scan-tab" class="tab-content hidden">
                        <div class="px-4 py-6 sm:px-0">
                            <div id="document-upload-container"></div>
                            <div id="scan-results-container"></div>
                        </div>
                    </div>

                    <!-- Scan History Tab -->
                    <div id="history-tab" class="tab-content hidden">
                        <div class="px-4 py-6 sm:px-0">
                            <div id="scan-history-container"></div>
                            <div id="document-matches-container"></div>
                        </div>
                    </div>

                    <!-- Credits Tab -->
                    <div id="credits-tab" class="tab-content hidden">
                        <div class="px-4 py-6 sm:px-0">
                            <div id="credit-request-container"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadComponents() {
        // Initialize Profile
        this.components.profile = new UserProfile(
            this.container.querySelector("#profile-container")
        );
        await this.components.profile.render();

        // Initialize Document Upload
        this.components.upload = new DocumentUpload(
            this.container.querySelector("#document-upload-container"),
            this.handleScanComplete.bind(this)
        );
        this.components.upload.render();

        // Initialize Scan History
        this.components.history = new ScanHistory(
            this.container.querySelector("#scan-history-container")
        );
        await this.components.history.render();

        // Initialize Recent Scans (using ScanHistory for the dashboard)
        this.components.recentScans = new ScanHistory(
            this.container.querySelector("#recent-scans-container")
        );
        await this.components.recentScans.render();

        // Initialize Credit Request
        this.components.creditRequest = new CreditRequest(
            this.container.querySelector("#credit-request-container")
        );
        this.components.creditRequest.render();

        // Initialize Credit Summary (using a simplified version of CreditRequest)
        this.components.creditSummary = new CreditRequest(
            this.container.querySelector("#credit-summary-container")
        );
        this.components.creditSummary.render();

        // Initialize Scan Results (but don't render yet)
        this.components.scanResults = new ScanResults(
            this.container.querySelector("#scan-results-container")
        );

        // Initialize Document Matches (but don't render yet)
        this.components.documentMatches = new DocumentMatches(
            this.container.querySelector("#document-matches-container")
        );

        this.components.creditSummary = new CreditRequest(
            this.container.querySelector("#credit-summary-container"),
            true // Pass true for compact mode
        );
        this.components.creditSummary.render();

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

        // Logout
        this.container.querySelector("#logoutBtn").addEventListener("click", () => {
            localStorage.removeItem("token");
            window.location.reload();
        });

        // Listen for view-matches events from scan history
        this.container
            .querySelector("#scan-history-container")
            .addEventListener("view-matches", (e) => {
                const { scanId } = e.detail;
                this.components.documentMatches.showMatches(scanId);
            });

        this.container
          .querySelector("#scan-history-container")
          .addEventListener("view-matches", (e) => {
            const { scanId } = e.detail;
            if (scanId) {
              // Show the document matches for this scan
              this.components.documentMatches.showMatches(scanId);

              // Make sure the matches container is visible
              const matchesContainer = this.container.querySelector(
                "#document-matches-container"
              );
              matchesContainer.scrollIntoView({ behavior: "smooth" });
            }
          });
    }

    setActiveTab(tabName) {
        // Update active tab
        this.activeTab = tabName;

        // Update navigation links
        this.container.querySelectorAll(".nav-link").forEach((link) => {
            if (link.dataset.tab === tabName) {
                link.classList.add("border-indigo-500", "text-gray-900");
                link.classList.remove(
                    "border-transparent",
                    "text-gray-500",
                    "hover:border-gray-300",
                    "hover:text-gray-700"
                );
            } else {
                link.classList.remove("border-indigo-500", "text-gray-900");
                link.classList.add(
                    "border-transparent",
                    "text-gray-500",
                    "hover:border-gray-300",
                    "hover:text-gray-700"
                );
            }
        });

        // Show/hide tab content
        this.container.querySelectorAll(".tab-content").forEach((content) => {
            content.classList.add("hidden");
        });
        this.container.querySelector(`#${tabName}-tab`).classList.remove("hidden");
    }

    handleScanComplete(result) {
        // Show the scan results and switch to that tab
        this.components.scanResults.showResults(result);

        // Switch to the scan tab if not already there
        this.setActiveTab("scan");

        // Update profile to reflect new credit balance
        this.components.profile.render();
    }

    refreshDashboard() {
        // Refresh all components when needed
        this.components.profile.render();
        this.components.history.render();
        this.components.recentScans.render();
        this.components.creditRequest.loadPendingRequests();
    }
}
