export class CreditRequest {
  constructor(container, isCompact = false) {
    this.container = container;
    this.isCompact = isCompact; // Compact mode for dashboard summary
    this.uniqueId = `credit-req-${Math.floor(Math.random() * 10000)}`;
  }

  render() {
    if (this.isCompact) {
      this.renderCompactView();
    } else {
      this.renderFullView();
    }

    this.attachEventListeners();
    this.loadUserRequests();
  }

  renderFullView() {
    this.container.innerHTML = `
            <div class="bg-white shadow rounded-lg p-6 mb-6">
                <h2 class="text-xl font-bold mb-4">Request Credits</h2>
                <form id="${this.uniqueId}-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">
                            Amount of Credits
                        </label>
                        <input type="number" 
                               name="amount" 
                               min="1" 
                               max="100" 
                               value="10"
                               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <p class="mt-1 text-sm text-gray-500">
                            You can request between 1 and 100 credits
                        </p>
                    </div>
                    <div class="flex justify-end">
                        <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            Submit Request
                        </button>
                    </div>
                </form>
                <div id="${this.uniqueId}-status" class="mt-4 hidden"></div>
            </div>

            <!-- Pending Requests -->
            <div class="mt-6">
                <h3 class="text-lg font-semibold mb-3">Your Credit Requests</h3>
                <div id="${this.uniqueId}-requests" class="space-y-2">
                    Loading...
                </div>
            </div>
        `;
  }

  renderCompactView() {
    this.container.innerHTML = `
            <div class="bg-white shadow rounded-lg p-6 mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold">Credit Summary</h2>
                    <a href="#" class="request-credits-btn text-blue-500 hover:text-blue-700">Request Credits</a>
                </div>
                <div class="mb-4">
                    <div class="text-2xl font-bold">${
                      this.getCreditCount() || "..."
                    }</div>
                    <div class="text-sm text-gray-500">Available Credits</div>
                </div>
                <div id="${this.uniqueId}-requests" class="space-y-2 text-sm">
                    Loading recent requests...
                </div>
            </div>
        `;
  }

  getCreditCount() {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    return userData.credits || 0;
  }

  attachEventListeners() {
    if (!this.isCompact) {
      const form = this.container.querySelector(`#${this.uniqueId}-form`);
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const amount = parseInt(form.amount.value);

        try {
          const response = await fetch("/api/credits/request", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ amount }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message);
          }

          this.showStatus("Credit request submitted successfully", "success");
          form.reset();
          this.loadUserRequests();
        } catch (error) {
          this.showStatus(error.message, "error");
        }
      });
    } else {
      // For compact view, attach link to credits tab
      const requestBtn = this.container.querySelector(".request-credits-btn");
      if (requestBtn) {
        requestBtn.addEventListener("click", (e) => {
          e.preventDefault();
          document.querySelector('[data-tab="credits"]').click();
        });
      }
    }
  }

  showStatus(message, type) {
    const statusDiv = this.container.querySelector(`#${this.uniqueId}-status`);
    if (!statusDiv) return;

    statusDiv.className = `mt-4 p-3 rounded ${
      type === "error"
        ? "bg-red-100 text-red-700"
        : "bg-green-100 text-green-700"
    }`;
    statusDiv.textContent = message;
    statusDiv.classList.remove("hidden");
  }

  async loadUserRequests() {
    try {
      // Get user profile data which includes credit requests
      const response = await fetch("/api/auth/user/profile", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load user requests");
      }

      const data = await response.json();
      const userData = data.profile;

      // Store for credit count access
      localStorage.setItem("userData", JSON.stringify(userData));

      const requests = userData.creditRequests || [];
      const container = this.container.querySelector(
        `#${this.uniqueId}-requests`
      );

      if (!container) return;

      if (requests.length === 0) {
        container.innerHTML = `
                    <p class="text-gray-500">No pending requests</p>
                `;
        return;
      }

      // Show fewer requests in compact mode
      const displayRequests = this.isCompact ? requests.slice(0, 2) : requests;

      container.innerHTML = displayRequests
        .map(
          (request) => `
                <div class="bg-gray-50 p-3 rounded">
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="font-medium">Amount: ${
                              request.amount
                            } credits</span>
                            <span class="text-sm text-gray-500 ml-2">
                                ${new Date(
                                  request.request_date
                                ).toLocaleDateString()}
                            </span>
                        </div>
                        <span class="px-2 py-1 rounded text-sm ${
                          request.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : request.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }">
                            ${request.status}
                        </span>
                    </div>
                </div>
            `
        )
        .join("");

      // Add "View All" link for compact mode if there are more requests
      if (this.isCompact && requests.length > 2) {
        container.innerHTML += `
                    <div class="text-center mt-2">
                        <a href="#" class="view-all-btn text-blue-500 hover:text-blue-700 text-sm">
                            View all ${requests.length} requests
                        </a>
                    </div>
                `;

        this.container
          .querySelector(".view-all-btn")
          .addEventListener("click", (e) => {
            e.preventDefault();
            document.querySelector('[data-tab="credits"]').click();
          });
      }
    } catch (error) {
      console.error("Error loading user requests:", error);
      const container = this.container.querySelector(
        `#${this.uniqueId}-requests`
      );
      if (container) {
        container.innerHTML = `<p class="text-red-500">Error loading requests</p>`;
      }
    }
  }
}
