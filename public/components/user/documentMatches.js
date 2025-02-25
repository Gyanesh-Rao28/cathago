export class DocumentMatches {
  constructor(container) {
    this.container = container;
  }

  async showMatches(docId) {
    try {
      const response = await fetch(`/api/scan/matches/${docId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch matches");
      }

      const data = await response.json();
      this.render(data);
    } catch (error) {
      console.error("Error loading matches:", error);
      this.showError("Failed to load document matches");
    }
  }

  render(data) {
    this.container.innerHTML = `
            <div class="bg-white shadow rounded-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold">Document Matches</h2>
                    <button class="close-matches text-gray-500 hover:text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <!-- Source Document Info -->
                <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 class="font-semibold mb-2">Source Document</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-gray-600">Filename</p>
                            <p class="font-medium">${data.document.filename}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">Upload Date</p>
                            <p class="font-medium">${new Date(
                              data.document.uploadDate
                            ).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <!-- Matching Documents -->
                <div class="space-y-4">
                    ${this.renderMatches(data.matches)}
                </div>
            </div>
        `;

    this.attachEventListeners();
  }

  renderMatches(matches) {
    if (!matches || matches.length === 0) {
      return `
                <div class="text-center p-4 bg-gray-50 rounded-lg">
                    <p class="text-gray-500">No matching documents found</p>
                </div>
            `;
    }

    return matches
      .map(
        (match) => `
            <div class="border rounded-lg p-4 hover:bg-gray-50">
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="font-medium">${
                          match.matched_document_name
                        }</h4>
                        <div class="flex items-center mt-1">
                            <div class="flex-grow">
                                <div class="relative w-full bg-gray-200 rounded h-2">
                                    <div class="absolute bg-blue-500 rounded h-2" 
                                         style="width: ${
                                           match.similarity_score
                                         }%">
                                    </div>
                                </div>
                            </div>
                            <span class="ml-2 text-sm text-gray-600">
                                ${Math.round(match.similarity_score)}% Match
                            </span>
                        </div>
                    </div>
                    <button 
                        class="compare-docs-btn px-3 py-1 text-blue-500 hover:text-blue-700 border border-blue-500 rounded"
                        data-match-id="${match.id}">
                        Compare
                    </button>
                </div>
            </div>
        `
      )
      .join("");
  }

  attachEventListeners() {
    const closeBtn = this.container.querySelector(".close-matches");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.clear());
    }

    this.container.querySelectorAll(".compare-docs-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const matchId = btn.dataset.matchId;
        this.showComparison(matchId);
      });
    });
  }

  async showComparison(matchId) {
    try {
      const response = await fetch(`/api/scan/matches/compare/${matchId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch comparison");
      }

      const data = await response.json();
      this.showComparisonModal(data);
    } catch (error) {
      console.error("Error loading comparison:", error);
      this.showError("Failed to load document comparison");
    }
  }

  showComparisonModal(data) {
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50";
    modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div class="p-4 border-b flex justify-between items-center">
                    <h3 class="text-lg font-semibold">Document Comparison</h3>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-4 p-4">
                    <div>
                        <h4 class="font-medium mb-2">Source Document</h4>
                        <div class="bg-gray-50 p-4 rounded max-h-[60vh] overflow-y-auto">
                            <pre class="whitespace-pre-wrap font-mono text-sm">${data.sourceContent}</pre>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-medium mb-2">Matching Document</h4>
                        <div class="bg-gray-50 p-4 rounded max-h-[60vh] overflow-y-auto">
                            <pre class="whitespace-pre-wrap font-mono text-sm">${data.matchContent}</pre>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(modal);
    modal.querySelector(".close-modal").addEventListener("click", () => {
      modal.remove();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className =
      "fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg";
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
  }

  clear() {
    this.container.innerHTML = "";
  }
}
