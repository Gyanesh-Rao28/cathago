export class ScanResults {
  constructor(container) {
    this.container = container;
    this.currentScanId = null;
  }

  showResults(scanData) {
    this.currentScanId = scanData.scan.id;

    this.container.innerHTML = `
            <div class="bg-white shadow rounded-lg p-6 mb-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold">Scan Results</h2>
                    <div class="text-sm text-gray-500">
                        Scan ID: ${scanData.scan.id}
                    </div>
                </div>

                <!-- Document Info -->
                <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 class="font-semibold mb-2">Scanned Document</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-gray-600">Filename</p>
                            <p class="font-medium">${scanData.scan.filename}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">Scan Date</p>
                            <p class="font-medium">${new Date(
                              scanData.scan.scanDate
                            ).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <!-- Match Results -->
                <div>
                    <h3 class="font-semibold mb-3">Matching Documents</h3>
                    <div class="space-y-4" id="matchResults">
                        ${this.renderMatchResults(scanData.matchResults)}
                    </div>
                </div>
            </div>
        `;

    this.attachEventListeners();
  }

  renderMatchResults(matches) {
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
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-medium">${match.filename}</h4>
                        <p class="text-sm text-gray-500">
                            Similarity: ${Math.round(match.similarity_score)}%
                        </p>
                    </div>
                    <button 
                        class="view-document-btn text-blue-500 hover:text-blue-700"
                        data-doc-id="${match.document_id}">
                        View Document
                    </button>
                </div>
                <div class="mt-2 text-sm">
                    <div class="relative w-full bg-gray-200 rounded h-2">
                        <div class="absolute bg-blue-500 rounded h-2" 
                             style="width: ${match.similarity_score}%">
                        </div>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  attachEventListeners() {
    this.container.querySelectorAll(".view-document-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const docId = btn.dataset.docId;
        this.viewDocument(docId);
      });
    });
  }

  async viewDocument(docId) {
    try {
      const response = await fetch(`/api/scan/matches/${docId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch document details");
      }

      const data = await response.json();
      this.showDocumentModal(data);
    } catch (error) {
      console.error("Error viewing document:", error);
      this.showError("Failed to load document details");
    }
  }

  showDocumentModal(documentData) {
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50";
    modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
                <div class="p-4 border-b flex justify-between items-center">
                    <h3 class="text-lg font-semibold">${documentData.document.filename}</h3>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="p-4 overflow-y-auto">
                    <pre class="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded">
                        ${documentData.content}
                    </pre>
                </div>
            </div>
        `;

    document.body.appendChild(modal);
    modal.querySelector(".close-modal").addEventListener("click", () => {
      modal.remove();
    });

    // Close on outside click
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
    this.currentScanId = null;
  }
}
