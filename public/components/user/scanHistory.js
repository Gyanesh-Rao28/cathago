import { api } from "../../js/api-service.js";

export class ScanHistory {
  constructor(container) {
    this.container = container;
    this.isLoading = false;
  }

  async render() {
    this.container.innerHTML = `
            <div class="bg-white shadow rounded-lg p-6 mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold">Scan History</h2>
                    <button id="exportHistory" class="text-blue-500 hover:text-blue-700">
                        Export History
                    </button>
                </div>
                <div id="loadingIndicator" class="text-center py-4">
                    <div class="inline-block loading"></div>
                    <p class="mt-2 text-gray-500">Loading scan history...</p>
                </div>
                <div id="scanHistoryContent" class="hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matches</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="scanHistoryBody" class="bg-white divide-y divide-gray-200">
                            </tbody>
                        </table>
                    </div>
                </div>
                <div id="emptyState" class="hidden text-center py-8">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">No scan history</h3>
                    <p class="mt-1 text-sm text-gray-500">You haven't scanned any documents yet.</p>
                    <div class="mt-6">
                        <button id="goToScanBtn" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                            </svg>
                            Scan New Document
                        </button>
                    </div>
                </div>
                <div id="errorState" class="hidden text-center py-4 text-red-500">
                    <p>Failed to load scan history. <button id="retryBtn" class="text-blue-500 hover:underline">Retry</button></p>
                </div>
            </div>
        `;

    this.attachEventListeners();
    await this.loadScanHistory();
  }

  async loadScanHistory() {
    if (this.isLoading) return;

    this.isLoading = true;

    // Show loading, hide other states
    this.container
      .querySelector("#loadingIndicator")
      .classList.remove("hidden");
    this.container.querySelector("#scanHistoryContent").classList.add("hidden");
    this.container.querySelector("#emptyState").classList.add("hidden");
    this.container.querySelector("#errorState").classList.add("hidden");

    try {
      const result = await api.getScanHistory();

      if (result.error) {
        throw new Error(result.message);
      }

      const data = result.data;

      // Hide loading
      this.container.querySelector("#loadingIndicator").classList.add("hidden");

      if (!data.scans || data.scans.length === 0) {
        // Show empty state
        this.container.querySelector("#emptyState").classList.remove("hidden");
        return;
      }

      // Show content
      this.container
        .querySelector("#scanHistoryContent")
        .classList.remove("hidden");

      const tbody = this.container.querySelector("#scanHistoryBody");

      // Group scans by scan_id
      const scanGroups = data.scans.reduce((acc, scan) => {
        if (!acc[scan.scan_id]) {
          acc[scan.scan_id] = {
            scan_date: scan.scan_date.replace(" ", "T"),
            filename: scan.filename || "Unnamed document",
            matches: [],
          };
        }
        // If there's a match, add it
        if (scan.matched_doc_id) {
          acc[scan.scan_id].matches.push({
            matched_filename: scan.matched_filename,
            similarity_score: scan.similarity_score,
          });
        }
        return acc;
      }, {});

      // Render the table
      tbody.innerHTML = Object.entries(scanGroups)
        .map(([scanId, scan]) => {
          const scanDate = new Date(scan.scan_date).toLocaleDateString();

          // Sort matches by similarity_score in descending order and take top 3
          const topMatches = scan.matches
            .sort((a, b) => b.similarity_score - a.similarity_score)
            .slice(0, 1)
            .map(
              (match) =>
                `<div>${
                  match.matched_filename
                } - <span class="text-green-600">${match.similarity_score.toFixed(
                  2
                )}%</span></div>`
            )
            .join("");

          const matchDisplay =
            topMatches || '<span class="text-gray-500">No Matches</span>';

          return `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap">${scanDate}</td>
        <td class="px-6 py-4">${scan.filename}</td>
        <td class="px-6 py-4">${matchDisplay}</td>
        <td class="px-6 py-4">
          <button data-scan-id="${scanId}" class="text-blue-500 hover:text-blue-700 view-matches">
            View Matches
          </button>
        </td>
      </tr>
    `;
        })
        .join("");
    } catch (error) {
      console.error("Error loading scan history:", error);
      // Show error state
      this.container.querySelector("#loadingIndicator").classList.add("hidden");
      this.container.querySelector("#errorState").classList.remove("hidden");
    } finally {
      this.isLoading = false;
    }
  }

  attachEventListeners() {
    const exportBtn = this.container.querySelector("#exportHistory");
    exportBtn.addEventListener("click", () => this.exportScanHistory());

    // Improved View Matches buttons handling
    this.container.addEventListener("click", (e) => {
      if (e.target.classList.contains("view-matches")) {
        const scanId = e.target.dataset.scanId;
        if (scanId) {
          this.viewMatches(scanId);
        } else {
          console.error("No scan ID found for this match button");
          alert("Could not view matches: Missing scan ID");
        }
      }
    });
  }

  async viewMatches(scanId) {
    try {
      // Show loading state
      const button = this.container.querySelector(
        `button[data-scan-id="${scanId}"]`
      );

      // Store the original text outside the if block so it's available in the setTimeout
      let originalText = "View Matches"; // Default text

      if (button) {
        originalText = button.textContent.trim(); // Save original text
        button.innerHTML = '<span class="loading mr-1"></span> Loading...';
        button.disabled = true;
      }

      // Emit the event for document matches component to handle
      const event = new CustomEvent("view-matches", { detail: { scanId } });
      this.container.dispatchEvent(event);

      // Reset button after a short delay
      setTimeout(() => {
        if (button) {
          button.textContent = originalText; // Now originalText is in scope
          button.disabled = false;
        }
      }, 1000);
    } catch (error) {
      console.error("Error viewing matches:", error);
      alert("Failed to load matches. Please try again.");
    }
  }
  async exportScanHistory() {
    try {
      // Show loading state on export button
      const exportBtn = this.container.querySelector("#exportHistory");
      const originalText = exportBtn.textContent;
      exportBtn.innerHTML = '<span class="loading mr-2"></span> Exporting...';
      exportBtn.disabled = true;

      // Fetch the export with Authorization header
      const response = await fetch(
        `/api/auth/export/scan-history?format=csv&t=${Date.now()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get the blob from the response
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Create download link and trigger it
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = "scan_history.csv";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Revoke the URL to free memory
      URL.revokeObjectURL(downloadUrl);

      // Reset button after a delay
      setTimeout(() => {
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;
      }, 2000);
    } catch (error) {
      console.error("Error exporting scan history:", error);
      alert("Failed to export scan history: " + error.message);

      // Reset button if there's an error
      const exportBtn = this.container.querySelector("#exportHistory");
      if (exportBtn) {
        exportBtn.textContent = originalText || "Export History";
        exportBtn.disabled = false;
      }
    }
  }
}
