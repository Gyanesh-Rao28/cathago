import { api } from "../../js/api-service.js";

export class DocumentUpload {
  constructor(container, onScanComplete) {
    this.container = container;
    this.onScanComplete = onScanComplete;
    this.isUploading = false;
  }

  render() {
    this.container.innerHTML = `
            <div class="bg-white shadow rounded-lg p-6 mb-6">
                <h2 class="text-xl font-bold mb-4">Upload Document</h2>
                <form id="uploadForm" class="space-y-4">
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center upload-area">
                        <input type="file" id="documentFile" class="hidden" accept=".txt">
                        <label for="documentFile" class="cursor-pointer">
                            <div class="text-gray-600">
                                <svg class="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                                </svg>
                                <p class="text-sm">Drag and drop or click to select file</p>
                                <p class="text-xs text-gray-500 mt-1">Only .txt files are supported</p>
                            </div>
                        </label>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <input type="checkbox" id="useAI" class="mr-2">
                            <label for="useAI" class="text-sm text-gray-600">Use AI for better matching</label>
                        </div>
                        <button type="submit" id="uploadBtn" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            Upload and Scan
                        </button>
                    </div>
                </form>
                <div id="uploadStatus" class="mt-4 hidden"></div>
            </div>
        `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const form = this.container.querySelector("#uploadForm");
    const fileInput = this.container.querySelector("#documentFile");
    const uploadArea = this.container.querySelector(".upload-area");
    const statusDiv = this.container.querySelector("#uploadStatus");
    const submitBtn = this.container.querySelector("#uploadBtn");

    // Drag and drop handling
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.classList.add("dragover");
    });

    uploadArea.addEventListener("dragleave", () => {
      uploadArea.classList.remove("dragover");
    });

    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.classList.remove("dragover");

      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        // Show file name
        const fileName = e.dataTransfer.files[0].name;
        this.updateDropzoneWithFileName(fileName);
      }
    });

    // File selection handling
    fileInput.addEventListener("change", () => {
      if (fileInput.files.length) {
        const fileName = fileInput.files[0].name;
        this.updateDropzoneWithFileName(fileName);
      }
    });

    // Form submission
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const file = fileInput.files[0];
      if (!file) {
        this.showStatus("Please select a file", "error");
        return;
      }

      // Check file type
      if (!file.name.endsWith(".txt")) {
        this.showStatus("Only .txt files are supported", "error");
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showStatus("File size exceeds 5MB limit", "error");
        return;
      }

      // Prevent double submission
      if (this.isUploading) return;

      this.isUploading = true;
      this.showUploadingState(true);

      try {
        const formData = new FormData();
        formData.append("document", file);

        // Check if AI matching is selected
        const useAI = document.getElementById("useAI").checked;

        const result = await api.uploadDocument(formData, useAI);

        if (result.error) {
          throw new Error(result.message);
        }

        this.showStatus(
          "Document uploaded and scanned successfully",
          "success"
        );

        if (this.onScanComplete) {
          this.onScanComplete(result.data);
        }

        form.reset();
        this.resetDropzone();
      } catch (error) {
        this.showStatus(error.message, "error");
      } finally {
        this.isUploading = false;
        this.showUploadingState(false);
      }
    });
  }

  updateDropzoneWithFileName(fileName) {
    const dropzone = this.container.querySelector(".upload-area div");
    dropzone.innerHTML = `
            <svg class="mx-auto h-8 w-8 mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <p class="text-sm font-medium">${fileName}</p>
            <p class="text-xs text-gray-500 mt-1">Click to change file</p>
        `;
  }

  resetDropzone() {
    const dropzone = this.container.querySelector(".upload-area div");
    dropzone.innerHTML = `
            <svg class="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            <p class="text-sm">Drag and drop or click to select file</p>
            <p class="text-xs text-gray-500 mt-1">Only .txt files are supported</p>
        `;
  }

  showStatus(message, type) {
    const statusDiv = this.container.querySelector("#uploadStatus");
    statusDiv.className = `mt-4 p-3 rounded ${
      type === "error"
        ? "bg-red-100 text-red-700"
        : "bg-green-100 text-green-700"
    }`;
    statusDiv.textContent = message;
    statusDiv.classList.remove("hidden");

    // Auto-hide success messages after 5 seconds
    if (type === "success") {
      setTimeout(() => {
        statusDiv.classList.add("hidden");
      }, 5000);
    }
  }

  showUploadingState(isUploading) {
    const submitBtn = this.container.querySelector("#uploadBtn");
    if (isUploading) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
            `;
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Upload and Scan";
    }
  }
}
