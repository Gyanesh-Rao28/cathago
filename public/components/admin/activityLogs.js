import { api } from "../../js/api-service.js";

export class ActivityLogs {
  constructor(container) {
    this.container = container;
    this.isLoading = false;
    this.activities = [];
    this.currentPage = 1;
    this.pageSize = 20;
    this.totalPages = 1;
    this.filters = {
      actionType: "",
      status: "",
      startDate: "",
      endDate: "",
    };
  }

  async render() {
    this.container.innerHTML = `
            <div class="bg-white shadow rounded-lg overflow-hidden">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h2 class="text-xl font-bold">Activity Logs</h2>
                        <div class="flex space-x-2">
                            <button id="refreshLogsBtn" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Filters -->
                <div class="p-4 bg-gray-50 border-b border-gray-200">
                    <div class="flex flex-wrap gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                            <select id="actionTypeFilter" class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm">
                                <option value="">All</option>
                                <option value="login">Login</option>
                                <option value="scan">Scan</option>
                                <option value="upload">Upload</option>
                                <option value="credit_request">Credit Request</option>
                                <option value="admin_action">Admin Action</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select id="statusFilter" class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm">
                                <option value="">All</option>
                                <option value="success">Success</option>
                                <option value="error">Error</option>
                                <option value="warning">Warning</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input type="date" id="startDateFilter" class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input type="date" id="endDateFilter" class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm">
                        </div>
                        <div class="flex items-end">
                            <button id="applyFiltersBtn" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm">
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
                
                <div id="logsLoadingIndicator" class="text-center py-8">
                    <div class="inline-block loading"></div>
                    <p class="mt-2 text-gray-500">Loading activity logs...</p>
                </div>
                
                <div id="logsContent" class="hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                </tr>
                            </thead>
                            <tbody id="logsTableBody" class="bg-white divide-y divide-gray-200">
                                <!-- Logs will be inserted here -->
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Pagination -->
                    <div class="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                        <div class="flex-1 flex justify-between sm:hidden">
                            <button id="prevPageBtnMobile" class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                Previous
                            </button>
                            <button id="nextPageBtnMobile" class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                Next
                            </button>
                        </div>
                        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p class="text-sm text-gray-700">
                                    Showing <span id="paginationStart">1</span> to <span id="paginationEnd">20</span> of 
                                    <span id="paginationTotal">100</span> results
                                </p>
                            </div>
                            <div>
                                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button id="prevPageBtn" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                        <span class="sr-only">Previous</span>
                                        <!-- Heroicon name: solid/chevron-left -->
                                        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                    <div id="paginationNumbers" class="relative inline-flex items-center">
                                        <!-- Page numbers will be inserted here -->
                                    </div>
                                    <button id="nextPageBtn" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                        <span class="sr-only">Next</span>
                                        <!-- Heroicon name: solid/chevron-right -->
                                        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="logsError" class="hidden text-center py-8 text-red-500">
                    <p>Failed to load activity logs. <button id="retryLogsBtn" class="text-indigo-600 hover:underline">Retry</button></p>
                </div>
                
                <div id="noLogsMessage" class="hidden text-center py-8 text-gray-500">
                    <p>No activity logs found matching your filters.</p>
                </div>
            </div>
        `;

    this.attachEventListeners();
    await this.loadActivityLogs();
  }

  attachEventListeners() {
    // Refresh button
    this.container
      .querySelector("#refreshLogsBtn")
      .addEventListener("click", () => this.loadActivityLogs());

    // Retry button
    this.container
      .querySelector("#retryLogsBtn")
      .addEventListener("click", () => this.loadActivityLogs());

    // Filter button
    this.container
      .querySelector("#applyFiltersBtn")
      .addEventListener("click", () => {
        this.currentPage = 1;
        this.loadActivityLogs();
      });

    // Pagination buttons
    this.container
      .querySelector("#prevPageBtn")
      .addEventListener("click", () => this.goToPreviousPage());
    this.container
      .querySelector("#nextPageBtn")
      .addEventListener("click", () => this.goToNextPage());
    this.container
      .querySelector("#prevPageBtnMobile")
      .addEventListener("click", () => this.goToPreviousPage());
    this.container
      .querySelector("#nextPageBtnMobile")
      .addEventListener("click", () => this.goToNextPage());
  }

  getFilters() {
    // Get filters from form inputs
    this.filters.actionType =
      this.container.querySelector("#actionTypeFilter").value;
    this.filters.status = this.container.querySelector("#statusFilter").value;
    this.filters.startDate =
      this.container.querySelector("#startDateFilter").value;
    this.filters.endDate = this.container.querySelector("#endDateFilter").value;

    return this.filters;
  }

  async loadActivityLogs() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.container
      .querySelector("#logsLoadingIndicator")
      .classList.remove("hidden");
    this.container.querySelector("#logsContent").classList.add("hidden");
    this.container.querySelector("#logsError").classList.add("hidden");
    this.container.querySelector("#noLogsMessage").classList.add("hidden");

    try {
      const filters = this.getFilters();
      const queryParams = new URLSearchParams({
        page: this.currentPage,
        limit: this.pageSize,
        ...filters,
      });

      const response = await fetch(
        `/api/activities/system/activities?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch activity logs");
      }

      const data = await response.json();
      this.activities = data.activities || [];
      this.totalPages = data.pagination?.totalPages || 1;
      const totalItems = data.pagination?.totalItems || 0;

      this.container
        .querySelector("#logsLoadingIndicator")
        .classList.add("hidden");

      if (this.activities.length === 0) {
        this.container
          .querySelector("#noLogsMessage")
          .classList.remove("hidden");
        return;
      }

      this.renderLogs();
      this.updatePagination(totalItems);
      this.container.querySelector("#logsContent").classList.remove("hidden");
    } catch (error) {
      console.error("Error loading activity logs:", error);
      this.container
        .querySelector("#logsLoadingIndicator")
        .classList.add("hidden");
      this.container.querySelector("#logsError").classList.remove("hidden");
    } finally {
      this.isLoading = false;
    }
  }

  renderLogs() {
    const tbody = this.container.querySelector("#logsTableBody");

    tbody.innerHTML = this.activities
      .map((activity) => {
        // Format date string properly
        const timestamp = activity.timestamp
          ? new Date(activity.timestamp.replace(" ", "T"))
          : new Date();
        const formattedTimestamp = timestamp.toLocaleString();

        // Determine status color
        let statusClass = "";
        switch (activity.status && activity.status.toLowerCase()) {
          case "error":
            statusClass = "bg-red-100 text-red-800";
            break;
          case "warning":
            statusClass = "bg-yellow-100 text-yellow-800";
            break;
          case "success":
          default:
            statusClass = "bg-green-100 text-green-800";
        }

        // Format action type for display
        const actionDisplay = (activity.action_type || "")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());

        return `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${formattedTimestamp}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${activity.username || "Unknown"}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${actionDisplay}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                            ${activity.status || "Success"}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500">
                        <div class="truncate max-w-xs" title="${
                          activity.details || ""
                        }">
                            ${activity.details || "No details available"}
                        </div>
                    </td>
                </tr>
            `;
      })
      .join("");
  }

  updatePagination(totalItems) {
    // Update pagination information
    this.container.querySelector("#paginationStart").textContent =
      (this.currentPage - 1) * this.pageSize + 1;
    this.container.querySelector("#paginationEnd").textContent = Math.min(
      this.currentPage * this.pageSize,
      totalItems
    );
    this.container.querySelector("#paginationTotal").textContent = totalItems;

    // Generate page numbers
    const paginationNumbers =
      this.container.querySelector("#paginationNumbers");
    paginationNumbers.innerHTML = "";

    // Only show a limited number of page links (e.g., current +/- 2 pages)
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(this.totalPages, this.currentPage + 2);

    // Always show first page
    if (startPage > 1) {
      const pageLink = document.createElement("button");
      pageLink.className =
        "relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50";
      pageLink.dataset.page = 1;
      pageLink.textContent = "1";
      pageLink.addEventListener("click", () => this.goToPage(1));
      paginationNumbers.appendChild(pageLink);

      // Add ellipsis if there's a gap
      if (startPage > 2) {
        const ellipsis = document.createElement("span");
        ellipsis.className =
          "relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700";
        ellipsis.textContent = "...";
        paginationNumbers.appendChild(ellipsis);
      }
    }

    // Current range of pages
    for (let i = startPage; i <= endPage; i++) {
      const pageLink = document.createElement("button");
      pageLink.className = `relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
        i === this.currentPage
          ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
      }`;
      pageLink.dataset.page = i;
      pageLink.textContent = i;
      pageLink.addEventListener("click", () => this.goToPage(i));
      paginationNumbers.appendChild(pageLink);
    }

    // Always show last page
    if (endPage < this.totalPages) {
      // Add ellipsis if there's a gap
      if (endPage < this.totalPages - 1) {
        const ellipsis = document.createElement("span");
        ellipsis.className =
          "relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700";
        ellipsis.textContent = "...";
        paginationNumbers.appendChild(ellipsis);
      }

      const pageLink = document.createElement("button");
      pageLink.className =
        "relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50";
      pageLink.dataset.page = this.totalPages;
      pageLink.textContent = this.totalPages;
      pageLink.addEventListener("click", () => this.goToPage(this.totalPages));
      paginationNumbers.appendChild(pageLink);
    }

    // Update button states
    this.container.querySelector("#prevPageBtn").disabled =
      this.currentPage === 1;
    this.container.querySelector("#nextPageBtn").disabled =
      this.currentPage === this.totalPages;
    this.container.querySelector("#prevPageBtnMobile").disabled =
      this.currentPage === 1;
    this.container.querySelector("#nextPageBtnMobile").disabled =
      this.currentPage === this.totalPages;
  }

  goToPage(page) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.loadActivityLogs();
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg ${
      type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"
    }`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  refresh() {
    this.loadActivityLogs();
  }
}
