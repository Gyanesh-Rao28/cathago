import { api } from "../../js/api-service.js";

export class AnalyticsDashboard {
  constructor(container) {
    this.container = container;
    this.isLoading = false;
    this.analyticsData = null;
  }

  async render() {
    this.container.innerHTML = `
            <div class="bg-white shadow rounded-lg overflow-hidden">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h2 class="text-xl font-bold">Analytics Dashboard</h2>
                        <div class="flex space-x-2">
                            <button id="refreshAnalyticsBtn" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                                Refresh
                            </button>
                            <button id="exportAnalyticsBtn" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                Export
                            </button>
                        </div>
                    </div>
                </div>
                
                <div id="analyticsLoadingIndicator" class="text-center py-8">
                    <div class="inline-block loading"></div>
                    <p class="mt-2 text-gray-500">Loading analytics data...</p>
                </div>
                
                <div id="analyticsContent" class="hidden p-6">
                    <!-- Summary Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" id="summaryCards">
                        <!-- Summary cards will be inserted here -->
                    </div>
                    
                    <!-- Charts Section -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
                            <h3 class="text-lg font-medium mb-2">Daily Scan Activity</h3>
                            <div id="scanActivityChart" class="h-64 w-full">
                                <!-- Chart will be rendered here -->
                            </div>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
                            <h3 class="text-lg font-medium mb-2">Credit Usage</h3>
                            <div id="creditUsageChart" class="h-64 w-full">
                                <!-- Chart will be rendered here -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Top Users Section -->
                    <div class="mb-8">
                        <h3 class="text-lg font-medium mb-4">Top Users</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Top Users by Scan Count -->
                            <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
                                <h4 class="font-medium text-gray-700 mb-2">By Scan Count</h4>
                                <div id="topUsersByScan" class="space-y-2">
                                    <!-- Top users by scan count will be inserted here -->
                                </div>
                            </div>
                            
                            <!-- Top Users by Credit Usage -->
                            <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
                                <h4 class="font-medium text-gray-700 mb-2">By Credit Usage</h4>
                                <div id="topUsersByCredit" class="space-y-2">
                                    <!-- Top users by credit usage will be inserted here -->
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Document Topics -->
                    <div>
                        <h3 class="text-lg font-medium mb-4">Common Document Topics</h3>
                        <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
                            <div id="documentTopics" class="flex flex-wrap gap-2">
                                <!-- Document topics will be inserted here -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="analyticsError" class="hidden text-center py-8 text-red-500">
                    <p>Failed to load analytics data. <button id="retryAnalyticsBtn" class="text-indigo-600 hover:underline">Retry</button></p>
                </div>
            </div>
        `;

    this.attachEventListeners();
    await this.loadAnalytics();
  }

  attachEventListeners() {
    // Refresh button
    this.container
      .querySelector("#refreshAnalyticsBtn")
      .addEventListener("click", () => this.loadAnalytics());

    // Retry button
    this.container
      .querySelector("#retryAnalyticsBtn")
      .addEventListener("click", () => this.loadAnalytics());

    // Export button
    this.container
      .querySelector("#exportAnalyticsBtn")
      .addEventListener("click", () => this.exportAnalytics());
  }

  async loadAnalytics() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.container
      .querySelector("#analyticsLoadingIndicator")
      .classList.remove("hidden");
    this.container.querySelector("#analyticsContent").classList.add("hidden");
    this.container.querySelector("#analyticsError").classList.add("hidden");

    try {
      const response = await fetch("/api/admin/analytics", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const data = await response.json();
      this.analyticsData = data.dashboard || {};

      this.container
        .querySelector("#analyticsLoadingIndicator")
        .classList.add("hidden");
      this.renderAnalytics();
      this.container
        .querySelector("#analyticsContent")
        .classList.remove("hidden");
    } catch (error) {
      console.error("Error loading analytics:", error);
      this.container
        .querySelector("#analyticsLoadingIndicator")
        .classList.add("hidden");
      this.container
        .querySelector("#analyticsError")
        .classList.remove("hidden");
    } finally {
      this.isLoading = false;
    }
  }

  renderAnalytics() {
    if (!this.analyticsData) return;

    // Render summary cards
    this.renderSummaryCards();

    // Render top users
    this.renderTopUsers();

    // Render document topics
    this.renderDocumentTopics();

    // Render charts
    this.renderScanActivityChart();
    this.renderCreditUsageChart();
  }

  renderSummaryCards() {
    const container = this.container.querySelector("#summaryCards");
    const stats = this.analyticsData.systemStats || {};

    container.innerHTML = `
            <div class="bg-gray-50 rounded-lg p-4 shadow-sm">
                <p class="text-gray-500 text-sm">Total Users</p>
                <p class="text-2xl font-bold">${stats.totalUsers || 0}</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-4 shadow-sm">
                <p class="text-gray-500 text-sm">Total Documents</p>
                <p class="text-2xl font-bold">${stats.totalDocuments || 0}</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-4 shadow-sm">
                <p class="text-gray-500 text-sm">Total Scans</p>
                <p class="text-2xl font-bold">${stats.totalScans || 0}</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-4 shadow-sm">
                <p class="text-gray-500 text-sm">Avg. Similarity</p>
                <p class="text-2xl font-bold">${Math.round(
                  stats.avgSimilarityScore || 0
                )}%</p>
            </div>
        `;
  }

  renderTopUsers() {
    const scanContainer = this.container.querySelector("#topUsersByScan");
    const creditContainer = this.container.querySelector("#topUsersByCredit");

    const topByScans = this.analyticsData.topUsersByScan || [];
    const topByCredits = this.analyticsData.topUsersByCredit || [];

    // Render top users by scan count
    scanContainer.innerHTML = topByScans.length
      ? topByScans
          .map(
            (user, index) => `
            <div class="flex items-center justify-between p-2 ${
              index % 2 === 0 ? "bg-white" : "bg-gray-100"
            } rounded">
                <div class="flex items-center">
                    <span class="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium mr-2">
                        ${index + 1}
                    </span>
                    <span class="font-medium">${user.username}</span>
                </div>
                <span>${user.scanCount} scans</span>
            </div>
        `
          )
          .join("")
      : '<p class="text-gray-500 text-center p-2">No scan data available</p>';

    // Render top users by credit usage
    creditContainer.innerHTML = topByCredits.length
      ? topByCredits
          .map(
            (user, index) => `
            <div class="flex items-center justify-between p-2 ${
              index % 2 === 0 ? "bg-white" : "bg-gray-100"
            } rounded">
                <div class="flex items-center">
                    <span class="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium mr-2">
                        ${index + 1}
                    </span>
                    <span class="font-medium">${user.username}</span>
                </div>
                <span>${user.creditsUsed} credits</span>
            </div>
        `
          )
          .join("")
      : '<p class="text-gray-500 text-center p-2">No credit usage data available</p>';
  }

  renderDocumentTopics() {
    const container = this.container.querySelector("#documentTopics");

    // Fallback topics in case data is missing or invalid
    const fallbackTopics = [
      { topic: "Document", confidence: 90 },
      { topic: "Scanning", confidence: 85 },
      { topic: "Analysis", confidence: 80 },
      { topic: "Security", confidence: 75 },
      { topic: "Text", confidence: 70 },
    ];

    // Get topics from analytics data with validation
    let topics = [];

    if (
      this.analyticsData &&
      Array.isArray(this.analyticsData.documentTopics)
    ) {
      topics = this.analyticsData.documentTopics.filter(
        (topic) =>
          topic && typeof topic.topic === "string" && topic.topic.trim() !== ""
      );
    }

    // Use fallback if no valid topics
    if (topics.length === 0) {
      topics = fallbackTopics;
    }

    // Generate color based on confidence (higher confidence = more intense color)
    const getTopicColor = (confidence) => {
      const minConfidence = 0;
      const maxConfidence = 100;
      const normalizedConfidence =
        Math.min(Math.max(confidence || 50, minConfidence), maxConfidence) /
        maxConfidence;
      const hue = 210; // Blue hue
      const saturation = Math.round(40 + normalizedConfidence * 60); // 40% to 100%
      const lightness = Math.round(80 - normalizedConfidence * 30); // 80% to 50%

      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    // Create tags for each topic with size and color based on confidence
    container.innerHTML = topics
      .map((topic) => {
        const topicText = topic.topic || "Unknown";
        const confidence = Number(topic.confidence) || 50;
        const fontSize = 0.8 + (confidence / 100) * 0.7; // 0.8rem to 1.5rem
        const backgroundColor = getTopicColor(confidence);

        return `
        <div class="rounded-full px-3 py-1 text-amber-800" 
             style="background-color: ${backgroundColor}; font-size: ${fontSize}rem;">
          ${topicText}
        </div>
      `;
      })
      .join("");
  }

  renderScanActivityChart() {
    const container = this.container.querySelector("#scanActivityChart");

    // Try to find the data in different possible locations
    let data = [];
    if (
      this.analyticsData.dailyScanActivity &&
      this.analyticsData.dailyScanActivity.length > 0
    ) {
      data = this.analyticsData.dailyScanActivity;
    } else if (
      this.analyticsData.usageTrends &&
      this.analyticsData.usageTrends.length > 0
    ) {
      data = this.analyticsData.usageTrends;
    }

    console.log("Chart data:", data);

    if (!data.length) {
      container.innerHTML =
        '<p class="text-gray-500 text-center h-full flex items-center justify-center">No scan activity data available</p>';
      return;
    }

    // Determine the property to use for the count
    let countProperty = "scanCount";
    if (data[0].hasOwnProperty("scan_count")) {
      countProperty = "scan_count";
    } else if (data[0].hasOwnProperty("scanCount")) {
      countProperty = "scanCount";
    } else if (data[0].hasOwnProperty("scan_count")) {
      countProperty = "scan_count";
    }

    // Set a minimum height for bars to be visible
    const minBarHeight = 5;
    const chartHeight = Math.max(100, container.offsetHeight - 30); // Ensure at least 100px height

    // Get max value, or use 1 if all values are 0 to avoid division by zero
    const values = data.map((d) => parseInt(d[countProperty] || 0));
    const maxValue = Math.max(...values) || 1;

    const bars = data
      .map((day) => {
        // Make sure we have a valid count
        const count = parseInt(day[countProperty] || 0);

        // Calculate bar height, ensuring at least minBarHeight
        const height =
          count > 0
            ? Math.max(minBarHeight, (count / maxValue) * chartHeight)
            : 0;

        // Format date
        let dateStr = "Unknown";
        try {
          const dateObj = new Date(day.date);
          if (!isNaN(dateObj.getTime())) {
            dateStr = dateObj.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
          }
        } catch (e) {
          console.error("Date parsing error:", e);
        }

        return `
      <div class="flex flex-col items-center">
        <div class="w-10 bg-indigo-500 rounded-t" style="height: ${height}px;"></div>
        <div class="text-xs text-gray-500 mt-1">${dateStr}</div>
        <div class="text-xs font-semibold">${count}</div>
      </div>
    `;
      })
      .join("");

    container.innerHTML = `
    <div class="h-full flex items-end justify-around pt-4">
      ${bars}
    </div>
  `;
  }

  renderCreditUsageChart() {
    const container = this.container.querySelector("#creditUsageChart");

    // Try to find credit data in different possible locations
    let data = [];
    if (
      this.analyticsData.creditStats &&
      this.analyticsData.creditStats.length > 0
    ) {
      data = this.analyticsData.creditStats;
    } else if (
      this.analyticsData.creditAnalytics &&
      this.analyticsData.creditAnalytics.length > 0
    ) {
      data = this.analyticsData.creditAnalytics;
    }

    console.log("Credit data:", data);

    if (!data.length) {
      container.innerHTML =
        '<p class="text-gray-500 text-center h-full flex items-center justify-center">No credit usage data available</p>';
      return;
    }

    // Set a minimum height for bars to be visible
    const minBarHeight = 5;
    const chartHeight = Math.max(100, container.offsetHeight - 30); // Ensure at least 100px height

    // Get max value combining approved + denied credits
    const maxValue =
      Math.max(
        ...data.map((d) => {
          const approved = parseInt(d.credits_approved || 0);
          const denied = parseInt(d.credits_denied || 0);
          return approved + denied;
        })
      ) || 1; // Use 1 if all are 0 to avoid division by zero

    const bars = data
      .map((day) => {
        const approved = parseInt(day.credits_approved || 0);
        const denied = parseInt(day.credits_denied || 0);

        const approvedHeight =
          approved > 0
            ? Math.max(minBarHeight, (approved / maxValue) * chartHeight)
            : 0;

        const deniedHeight =
          denied > 0
            ? Math.max(minBarHeight, (denied / maxValue) * chartHeight)
            : 0;

        // Format date
        let dateStr = "Unknown";
        try {
          const dateObj = new Date(day.date);
          if (!isNaN(dateObj.getTime())) {
            dateStr = dateObj.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
          }
        } catch (e) {
          console.error("Date parsing error:", e);
        }

        return `
      <div class="flex flex-col items-center">
        <div class="w-10 flex flex-col-reverse">
          ${
            approvedHeight > 0
              ? `<div class="bg-green-500 rounded-t" style="height: ${approvedHeight}px;" title="${approved} approved"></div>`
              : ""
          }
          ${
            deniedHeight > 0
              ? `<div class="bg-red-500" style="height: ${deniedHeight}px;" title="${denied} denied"></div>`
              : ""
          }
        </div>
        <div class="text-xs text-gray-500 mt-1">${dateStr}</div>
        <div class="text-xs font-semibold">${approved + denied}</div>
      </div>
    `;
      })
      .join("");

    // Add legend
    const legend = `
    <div class="flex items-center justify-center space-x-4 mb-2">
      <div class="flex items-center">
        <div class="w-3 h-3 bg-green-500 mr-1"></div>
        <span class="text-xs text-gray-500">Approved</span>
      </div>
      <div class="flex items-center">
        <div class="w-3 h-3 bg-red-500 mr-1"></div>
        <span class="text-xs text-gray-500">Denied</span>
      </div>
    </div>
  `;

    container.innerHTML = `
    ${legend}
    <div class="h-[calc(100%-20px)] flex items-end justify-around pt-4">
      ${bars}
    </div>
  `;
  }

  exportAnalytics() {
    try {
      // Show loading state on export button
      const exportBtn = this.container.querySelector("#exportAnalyticsBtn");
      const originalText = exportBtn.textContent;
      exportBtn.innerHTML = '<span class="loading mr-2"></span> Exporting...';
      exportBtn.disabled = true;

      console.log("token",localStorage.getItem("token"));

      // Fetch the analytics data with credentials
      fetch(`/api/admin/export/analytics?format=json&t=${Date.now()}`, {
        method: "GET",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        credentials: "include", // Ensures cookies are sent with the request
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          // Convert JSON data to a Blob and create a download link
          const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
          });
          const downloadUrl = URL.createObjectURL(blob);

          const downloadLink = document.createElement("a");
          downloadLink.href = downloadUrl;
          downloadLink.download = "analytics_report.json";
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          // Revoke the object URL to free memory
          URL.revokeObjectURL(downloadUrl);
        })
        .catch((error) => {
          console.error("Error exporting analytics:", error);
          this.showToast(
            "Failed to export analytics: " + error.message,
            "error"
          );
        })
        .finally(() => {
          // Reset button after a delay
          setTimeout(() => {
            exportBtn.textContent = originalText;
            exportBtn.disabled = false;
          }, 2000);
        });
    } catch (error) {
      console.error("Unexpected error exporting analytics:", error);
      this.showToast("Failed to export analytics: " + error.message, "error");
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
    this.loadAnalytics();
  }   
}
