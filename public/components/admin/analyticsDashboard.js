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
                    <div class="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
                        <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
                            <h3 class="text-lg font-medium mb-2">Daily Scan Activity</h3>
                            <div id="scanActivityChart" class="h-64 w-full">
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
    // this.renderCreditUsageChart();
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

    // Filter out users with zero scans for better display
    const usersWithScans = topByScans.filter((user) => user.scanCount > 0);

    // Render top users by scan count
    scanContainer.innerHTML = usersWithScans.length
      ? usersWithScans
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
      : '<p class="text-gray-500 text-center p-2">No users have performed scans yet</p>';

    // Filter out users with zero credit usage for better display
    const usersWithCreditUsage = topByCredits.filter(
      (user) => user.creditsUsed > 0
    );

    // Render top users by credit usage
    creditContainer.innerHTML = usersWithCreditUsage.length
      ? usersWithCreditUsage
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
      : '<p class="text-gray-500 text-center p-2">No users have used credits yet</p>';
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

    // If no data, show sample data with a notice
    if (!data.length) {
      // Generate sample data for demonstration
      const today = new Date();
      const sampleData = [
        {
          date: new Date(today.setDate(today.getDate() - 2))
            .toISOString()
            .split("T")[0],
          scanCount: 5,
        },
        {
          date: new Date(today.setDate(today.getDate() + 1))
            .toISOString()
            .split("T")[0],
          scanCount: 8,
        },
        {
          date: new Date(today.setDate(today.getDate() + 1))
            .toISOString()
            .split("T")[0],
          scanCount: 3,
        },
      ];

      data = sampleData;

      // Add a notice about sample data
      const notice = document.createElement("div");
      notice.className = "text-amber-600 text-xs mb-2 text-center";
      notice.textContent = "Showing sample data for demonstration";
      container.parentNode.insertBefore(notice, container);
    }

    // Set a fixed height for the chart
    const FIXED_CHART_HEIGHT = 200;
    const minBarHeight = 20;

    // Determine the property to use for the count
    const countProperty = data[0].hasOwnProperty("scan_count")
      ? "scan_count"
      : "scanCount";

    // Get max value, or use 1 if all values are 0 to avoid division by zero
    const values = data.map((d) => parseInt(d[countProperty] || 0));
    const maxValue = Math.max(...values) || 1;

    const bars = data
      .map((day) => {
        const count = parseInt(day[countProperty] || 0);
        const height =
          count > 0
            ? Math.max(minBarHeight, (count / maxValue) * FIXED_CHART_HEIGHT)
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
          <div class="w-16 bg-indigo-500 rounded-t" style="height: ${height}px;"></div>
          <div class="text-xs text-gray-500 mt-1">${dateStr}</div>
          <div class="text-xs font-semibold">${count}</div>
        </div>
      `;
      })
      .join("");

    container.innerHTML = `
    <div class="flex items-end justify-around pt-4" style="min-height: ${
      FIXED_CHART_HEIGHT + 50
    }px">
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

      // Fetch the analytics data with proper authorization header
      fetch(`/api/admin/export/analytics?format=json&t=${Date.now()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
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
