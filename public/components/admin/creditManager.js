import { api } from "../../js/api-service.js";

export class CreditManager {
  constructor(container) {
    this.container = container;
    this.isLoading = false;
    this.requests = [];
    this.requestHistory = [];
  }

  async render() {
    this.container.innerHTML = `
            <div class="bg-white shadow rounded-lg overflow-hidden">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h2 class="text-xl font-bold">Credit Requests</h2>
                        <div class="flex space-x-2">
                            <button id="refreshRequestsBtn" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                                Refresh
                            </button>
                            <button id="resetAllCreditsBtn" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                Reset All Credits
                            </button>
                        </div>
                    </div>
                </div>
                
                <div id="requestsLoadingIndicator" class="text-center py-8">
                    <div class="inline-block loading"></div>
                    <p class="mt-2 text-gray-500">Loading credit requests...</p>
                </div>
                
                <div id="requestsContent" class="hidden p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="pendingRequestsContainer">
                        <!-- Pending requests will be inserted here -->
                    </div>
                </div>
                
                <div id="requestsError" class="hidden text-center py-8 text-red-500">
                    <p>Failed to load credit requests. <button id="retryRequestsBtn" class="text-indigo-600 hover:underline">Retry</button></p>
                </div>
                
                <div id="noRequestsMessage" class="hidden text-center py-8 text-gray-500">
                    <p>No pending credit requests.</p>
                </div>

                <!-- History Section -->
                <div class="mt-8 px-6 pb-6">
                    <h3 class="text-lg font-medium mb-4">Request History</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody id="requestHistoryBody" class="bg-white divide-y divide-gray-200">
                              
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Confirmation Modal -->
            <div id="confirmModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <div class="bg-white rounded-lg max-w-md w-full p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-medium" id="confirmModalTitle">Confirm Action</h3>
                        <button class="close-modal text-gray-400 hover:text-gray-500">
                            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div id="confirmModalContent" class="mb-4">
                        <!-- Content will be dynamically added -->
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button class="close-modal px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            Cancel
                        </button>
                        <button id="confirmActionButton" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        `;

    this.attachEventListeners();
    await this.loadCreditRequests();
  }

  attachEventListeners() {
    // Refresh button
    this.container
      .querySelector("#refreshRequestsBtn")
      .addEventListener("click", () => this.loadCreditRequests());

    // Retry button
    this.container
      .querySelector("#retryRequestsBtn")
      .addEventListener("click", () => this.loadCreditRequests());

    // Reset all credits button
    this.container
      .querySelector("#resetAllCreditsBtn")
      .addEventListener("click", () => this.showResetAllModal());

    // Modal close buttons
    this.container.querySelectorAll(".close-modal").forEach((btn) => {
      btn.addEventListener("click", () => this.closeModal());
    });

    // Confirm action button
    this.container
      .querySelector("#confirmActionButton")
      .addEventListener("click", () => {
        const action = this.container.querySelector("#confirmActionButton")
          .dataset.action;
        const requestId = this.container.querySelector("#confirmActionButton")
          .dataset.requestId;

        if (action === "approve") {
          this.approveRequest(requestId);
        } else if (action === "deny") {
          this.denyRequest(requestId);
        } else if (action === "reset-all") {
          this.resetAllCredits();
        }
      });

    // Pending requests container - delegate click events
    this.container
      .querySelector("#pendingRequestsContainer")
      .addEventListener("click", (e) => {
        const target = e.target.closest("button");
        if (!target) return;

        const requestId = target.dataset.requestId;
        if (!requestId) return;

        if (target.classList.contains("approve-btn")) {
          this.showApproveModal(requestId);
        } else if (target.classList.contains("deny-btn")) {
          this.showDenyModal(requestId);
        }
      });
  }

  async loadCreditRequests() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.container
      .querySelector("#requestsLoadingIndicator")
      .classList.remove("hidden");
    this.container.querySelector("#requestsContent").classList.add("hidden");
    this.container.querySelector("#requestsError").classList.add("hidden");
    this.container.querySelector("#noRequestsMessage").classList.add("hidden");

    try {
      // Load pending requests
      const pendingResponse = await fetch("/api/credits/pending", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!pendingResponse.ok) {
        throw new Error("Failed to fetch credit requests");
      }

      const pendingData = await pendingResponse.json();
      this.requests = pendingData.requests || [];

      const historyResponse = await fetch("/api/admin/credit-history", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        console.log("History Data Response:", historyData);

        if (historyData.history) {
          this.requestHistory = historyData.history;
        } else {
          console.warn("No history data found, check API response structure.");
        }
      }

      this.container
        .querySelector("#requestsLoadingIndicator")
        .classList.add("hidden");

      if (this.requests.length === 0) {
        this.container
          .querySelector("#noRequestsMessage")
          .classList.remove("hidden");
      } else {
        this.renderPendingRequests();
        this.container
          .querySelector("#requestsContent")
          .classList.remove("hidden");
      }

      // Always render history, even if there are no pending requests
      this.renderRequestHistory();
    } catch (error) {
      console.error("Error loading credit requests:", error);
      this.container
        .querySelector("#requestsLoadingIndicator")
        .classList.add("hidden");
      this.container.querySelector("#requestsError").classList.remove("hidden");
    } finally {
      this.isLoading = false;
    }
  }

  renderRequestHistory() {
    const historyBody = document.getElementById("requestHistoryBody");

    if (!this.requestHistory.length) {
      historyBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">No past credit requests found.</td></tr>`;
      return;
    }

    historyBody.innerHTML = this.requestHistory
      .map(
        (request) => `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${request.user}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(request.date).toLocaleDateString()}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${request.amount} credits</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold ${request.status === "Approved" ? "text-green-600" : request.status === "Denied" ? "text-red-600" : "text-yellow-600"}">
          ${request.status}
        </td>
      </tr>`
      )
      .join("");
  }


  renderPendingRequests() {
    const container = this.container.querySelector("#pendingRequestsContainer");

    if (!this.requests || this.requests.length === 0) {
      container.innerHTML = `<p class="text-center text-gray-500 py-4">No pending credit requests</p>`;
      return;
    }

    container.innerHTML = this.requests
      .map((request) => {
        // Format date string properly
        const requestDate = request.request_date
          ? new Date(request.request_date.replace(" ", "T"))
          : new Date();
        const formattedDate = requestDate.toLocaleDateString();

        return `
                <div class="bg-gray-50 rounded-lg shadow p-4">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-medium">${request.username}</h3>
                            <p class="text-sm text-gray-500">${formattedDate}</p>
                        </div>
                        <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                            Pending
                        </span>
                    </div>
                    <div class="mt-4">
                        <p class="text-lg font-bold">${request.amount} Credits</p>
                    </div>
                    <div class="mt-4 flex justify-end space-x-2">
                        <button data-request-id="${request.id}" class="deny-btn px-3 py-1 border border-red-500 text-red-500 rounded hover:bg-red-50">
                            Deny
                        </button>
                        <button data-request-id="${request.id}" class="approve-btn px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                            Approve
                        </button>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  renderRequestHistory() {
    const tbody = this.container.querySelector("#requestHistoryBody");

    // Sort history by date (newest first)
    const sortedHistory = [...this.requestHistory].sort((a, b) => {
      return new Date(b.request_date || 0) - new Date(a.request_date || 0);
    });

    tbody.innerHTML = sortedHistory
      .map((request) => {
        // Format date string properly
        const requestDate = request.request_date
          ? new Date(request.request_date.replace(" ", "T"))
          : new Date();
        const formattedDate = requestDate.toLocaleDateString();

        let statusClass = "";
        switch (request.status.toLowerCase()) {
          case "approved":
            statusClass = "bg-green-100 text-green-800";
            break;
          case "denied":
            statusClass = "bg-red-100 text-red-800";
            break;
          default:
            statusClass = "bg-yellow-100 text-yellow-800";
        }

        return `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${request.username}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${formattedDate}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${request.amount}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                            ${request.status}
                        </span>
                    </td>
                </tr>
            `;
      })
      .join("");
  }

  showApproveModal(requestId) {
    const request = this.requests.find((r) => r.id.toString() === requestId);
    if (!request) return;

    const modal = this.container.querySelector("#confirmModal");
    const modalTitle = this.container.querySelector("#confirmModalTitle");
    const modalContent = this.container.querySelector("#confirmModalContent");
    const confirmBtn = this.container.querySelector("#confirmActionButton");

    modalTitle.textContent = "Approve Credit Request";
    modalContent.innerHTML = `
            <p>Are you sure you want to approve <strong>${request.username}</strong>'s request for <strong>${request.amount} credits</strong>?</p>
        `;

    confirmBtn.textContent = "Approve";
    confirmBtn.classList.remove("bg-red-600", "hover:bg-red-700");
    confirmBtn.classList.add("bg-green-600", "hover:bg-green-700");
    confirmBtn.dataset.action = "approve";
    confirmBtn.dataset.requestId = requestId;

    modal.classList.remove("hidden");
  }

  showDenyModal(requestId) {
    const request = this.requests.find((r) => r.id.toString() === requestId);
    if (!request) return;

    const modal = this.container.querySelector("#confirmModal");
    const modalTitle = this.container.querySelector("#confirmModalTitle");
    const modalContent = this.container.querySelector("#confirmModalContent");
    const confirmBtn = this.container.querySelector("#confirmActionButton");

    modalTitle.textContent = "Deny Credit Request";
    modalContent.innerHTML = `
            <p>Are you sure you want to deny <strong>${request.username}</strong>'s request for <strong>${request.amount} credits</strong>?</p>
        `;

    confirmBtn.textContent = "Deny";
    confirmBtn.classList.remove("bg-green-600", "hover:bg-green-700");
    confirmBtn.classList.add("bg-red-600", "hover:bg-red-700");
    confirmBtn.dataset.action = "deny";
    confirmBtn.dataset.requestId = requestId;

    modal.classList.remove("hidden");
  }

  showResetAllModal() {
    const modal = this.container.querySelector("#confirmModal");
    const modalTitle = this.container.querySelector("#confirmModalTitle");
    const modalContent = this.container.querySelector("#confirmModalContent");
    const confirmBtn = this.container.querySelector("#confirmActionButton");

    modalTitle.textContent = "Reset All Credits";
    modalContent.innerHTML = `
            <p>Are you sure you want to reset all users' credits to 20?</p>
            <p class="text-sm text-gray-500 mt-2">This will affect all non-admin users.</p>
        `;

    confirmBtn.textContent = "Reset All Credits";
    confirmBtn.classList.remove("bg-red-600", "hover:bg-red-700");
    confirmBtn.classList.add("bg-green-600", "hover:bg-green-700");
    confirmBtn.dataset.action = "reset-all";
    confirmBtn.dataset.requestId = "";

    modal.classList.remove("hidden");
  }

  closeModal() {
    const modal = this.container.querySelector("#confirmModal");
    modal.classList.add("hidden");
  }

  async approveRequest(requestId) {
    try {
      const response = await fetch(`/api/credits/approve/${requestId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to approve request");
      }

      // Update data and UI
      await this.loadCreditRequests();
      this.closeModal();
      this.showToast("Credit request approved successfully");
    } catch (error) {
      console.error("Error approving credit request:", error);
      this.showToast("Failed to approve request: " + error.message, "error");
    }
  }

  async denyRequest(requestId) {
    try {
      const response = await fetch(`/api/credits/deny/${requestId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to deny request");
      }

      // Update data and UI
      await this.loadCreditRequests();
      this.closeModal();
      this.showToast("Credit request denied");
    } catch (error) {
      console.error("Error denying credit request:", error);
      this.showToast("Failed to deny request: " + error.message, "error");
    }
  }

  async resetAllCredits() {
    try {
      const response = await fetch("/api/credits/reset-daily", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to reset credits");
      }

      // Update data and UI
      await this.loadCreditRequests();
      this.closeModal();
      this.showToast("All users' credits reset successfully");
    } catch (error) {
      console.error("Error resetting credits:", error);
      this.showToast("Failed to reset credits: " + error.message, "error");
    }
  }

  showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg ${type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"
      }`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  refresh() {
    this.loadCreditRequests();
  }
}
