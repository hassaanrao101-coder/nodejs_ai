// Configuration
const API_URL = "http://localhost:3000"; // Change this to your backend URL

// State
let state = {
  imageFile: null,
  selectedOptions: {
    arch: "upper",
    teeth_count: "6",
    brighten: null,
    correct_crowding_with_alignment: null,
    widen_upper_teeth: false,
    widen_lower_teeth: false,
    close_spaces_evenly: false,
    replace_missing_teeth: false,
    reduce_gummy_smile: false,
    improve_shape_of_incisal_edges: false,
    improve_gum_recession: false,
    correct_underbite: false,
    correct_overbite: false,
  },
  results: null,
};

// DOM Elements
const elements = {
  uploadArea: document.getElementById("upload-area"),
  imageInput: document.getElementById("image-input"),
  imagePreview: document.getElementById("image-preview"),
  previewImg: document.getElementById("preview-img"),
  removeImage: document.getElementById("remove-image"),
  imageSize: document.getElementById("image-size"),
  generateBtn: document.getElementById("generate-btn"),
  processingIndicator: document.getElementById("processing-indicator"),
  progressBar: document.getElementById("progress-bar"),
  progressText: document.getElementById("progress-text"),
  resultsSection: document.getElementById("results-section"),
  resultImage: document.getElementById("result-image"),
  aiDescription: document.getElementById("ai-description"),
  downloadBtn: document.getElementById("download-btn"),
  errorDisplay: document.getElementById("error-display"),
  errorMessage: document.getElementById("error-message"),
  optionsSummary: document.getElementById("summary-content"),
  promptModal: document.getElementById("prompt-modal"),
  fullPrompt: document.getElementById("full-prompt"),
  apiResponse: document.getElementById("api-response"),
  closeModal: document.getElementById("close-modal"),
  copyPrompt: document.getElementById("copy-prompt"),
  viewPromptBtn: document.getElementById("view-prompt-btn"),
  resetBtn: document.getElementById("reset-btn"),
  healthStatus: document.getElementById("health-status"),
};

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  checkHealthStatus();
  setupEventListeners();
  updateGenerateButton();
});

// Check server health
async function checkHealthStatus() {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();

    if (data.status === "ok") {
      elements.healthStatus.className =
        "mb-8 p-4 bg-green-50 border border-green-200 rounded-lg";
      elements.healthStatus.innerHTML = `
                        <div class="flex items-center">
                            <i class="fas fa-check-circle text-green-500 text-lg mr-3"></i>
                            <div>
                                <h3 class="font-medium text-green-800">System Ready</h3>
                                <p class="text-sm text-green-600">
                                    Connected to server • OpenAI: ${
                                      data.openaiConfigured
                                        ? "Available"
                                        : "Not Configured"
                                    }
                                </p>
                            </div>
                        </div>
                    `;
    }
  } catch (error) {
    elements.healthStatus.className =
      "mb-8 p-4 bg-red-50 border border-red-200 rounded-lg";
    elements.healthStatus.innerHTML = `
                    <div class="flex items-center">
                        <i class="fas fa-exclamation-triangle text-red-500 text-lg mr-3"></i>
                        <div>
                            <h3 class="font-medium text-red-800">Server Connection Failed</h3>
                            <p class="text-sm text-red-600">Please ensure the backend server is running on ${API_URL}</p>
                        </div>
                    </div>
                `;
  } finally {
    elements.healthStatus.classList.remove("hidden");
  }
}

// Setup event listeners
function setupEventListeners() {
  // File upload
  elements.uploadArea.addEventListener("click", () =>
    elements.imageInput.click()
  );
  elements.imageInput.addEventListener("change", handleImageSelect);
  elements.removeImage.addEventListener("click", removeImage);

  // Drag and drop
  elements.uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    elements.uploadArea.classList.add("drag-over");
  });

  elements.uploadArea.addEventListener("dragleave", () => {
    elements.uploadArea.classList.remove("drag-over");
  });

  elements.uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    elements.uploadArea.classList.remove("drag-over");
    if (e.dataTransfer.files.length) {
      handleImageSelect({ target: { files: e.dataTransfer.files } });
    }
  });

  // Option buttons
  document.querySelectorAll("[data-option]").forEach((button) => {
    button.addEventListener("click", () => {
      const option = button.dataset.option;
      const value = button.dataset.value;

      // Handle boolean-like options (arch, teeth_count, brighten, crowding)
      if (
        [
          "arch",
          "teeth_count",
          "brighten",
          "correct_crowding_with_alignment",
        ].includes(option)
      ) {
        // Deselect all siblings
        button.parentElement
          .querySelectorAll(".option-card")
          .forEach((card) => {
            card.classList.remove("selected");
          });
        // Select clicked button
        button.classList.add("selected");
        state.selectedOptions[option] = value;
      }

      updateOptionsSummary();
      updateGenerateButton();
    });
  });

  // Checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      state.selectedOptions[e.target.id] = e.target.checked;
      updateOptionsSummary();
      updateGenerateButton();
    });
  });

  // Generate button
  elements.generateBtn.addEventListener("click", generateImage);

  // Modal
  elements.viewPromptBtn.addEventListener("click", showPromptModal);
  elements.closeModal.addEventListener("click", () => {
    elements.promptModal.classList.add("hidden");
  });
  elements.copyPrompt.addEventListener("click", copyPromptToClipboard);

  // Reset
  elements.resetBtn.addEventListener("click", resetAll);

  // Close modal on outside click
  elements.promptModal.addEventListener("click", (e) => {
    if (e.target === elements.promptModal) {
      elements.promptModal.classList.add("hidden");
    }
  });

  // Download button
  elements.downloadBtn.addEventListener("click", downloadResult);
}

// Handle image selection
function handleImageSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showError("Please select an image file (JPEG, PNG, WebP)");
    return;
  }

  if (file.size > 30 * 1024 * 1024) {
    showError("File size exceeds 30MB limit");
    return;
  }

  state.imageFile = file;
  const reader = new FileReader();

  reader.onload = function (e) {
    elements.previewImg.src = e.target.result;
    elements.imageSize.textContent = `${(file.size / (1024 * 1024)).toFixed(
      2
    )} MB`;
    elements.imagePreview.classList.remove("hidden");
    updateGenerateButton();
  };

  reader.readAsDataURL(file);
}

// Remove selected image
function removeImage() {
  state.imageFile = null;
  elements.imageInput.value = "";
  elements.imagePreview.classList.add("hidden");
  updateGenerateButton();
}

// Update generate button state
function updateGenerateButton() {
  const hasImage = !!state.imageFile;
  elements.generateBtn.disabled = !hasImage;
}

// Update options summary
function updateOptionsSummary() {
  const summary = [];
  const options = state.selectedOptions;

  if (options.arch) {
    summary.push(`<span class="text-blue-600">Arch:</span> ${options.arch}`);
  }
  if (options.teeth_count) {
    summary.push(
      `<span class="text-blue-600">Teeth:</span> ${options.teeth_count}`
    );
  }
  if (options.brighten) {
    summary.push(
      `<span class="text-blue-600">Brighten:</span> ${options.brighten}`
    );
  }
  if (options.correct_crowding_with_alignment) {
    summary.push(
      `<span class="text-blue-600">Crowding:</span> ${options.correct_crowding_with_alignment}`
    );
  }

  // Boolean options
  const booleanOptions = [
    "widen_upper_teeth",
    "widen_lower_teeth",
    "close_spaces_evenly",
    "replace_missing_teeth",
    "reduce_gummy_smile",
    "improve_shape_of_incisal_edges",
    "improve_gum_recession",
    "correct_underbite",
    "correct_overbite",
  ];

  booleanOptions.forEach((opt) => {
    if (options[opt]) {
      const label = opt.replace(/_/g, " ");
      summary.push(`<span class="text-green-600">✓</span> ${label}`);
    }
  });

  if (summary.length === 0) {
    elements.optionsSummary.innerHTML =
      '<p class="text-sm text-gray-500 italic">No options selected yet</p>';
  } else {
    elements.optionsSummary.innerHTML = summary
      .map((item) => `<p class="text-sm text-gray-700">${item}</p>`)
      .join("");
  }
}

// Generate image
async function generateImage() {
  if (!state.imageFile) return;

  // Show processing
  elements.processingIndicator.classList.remove("hidden");
  elements.resultsSection.classList.add("hidden");
  elements.errorDisplay.classList.add("hidden");
  elements.generateBtn.disabled = true;

  // Simulate progress
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.random() * 20;
    if (progress > 90) clearInterval(progressInterval);
    elements.progressBar.style.width = `${Math.min(progress, 90)}%`;
    elements.progressText.textContent = getProgressMessage(progress);
  }, 300);

  // Prepare form data
  const formData = new FormData();
  formData.append("image", state.imageFile);

  // Add query parameters
  Object.keys(state.selectedOptions).forEach((key) => {
    if (
      state.selectedOptions[key] !== null &&
      state.selectedOptions[key] !== false
    ) {
      formData.append(key, state.selectedOptions[key]);
    }
  });

  try {
    const response = await fetch(`${API_URL}/create-image`, {
      method: "POST",
      body: formData,
    });

    clearInterval(progressInterval);
    elements.progressBar.style.width = "100%";
    elements.progressText.textContent = "Complete!";

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      // Store results
      state.results = data.data;

      // Update UI with results
      elements.resultImage.src = data.data.generatedImageUrl;
      elements.aiDescription.textContent = data.data.description;

      // Set modal content
      elements.fullPrompt.textContent = data.data.prompt;
      elements.apiResponse.textContent = JSON.stringify(data.data, null, 2);

      // Show results
      setTimeout(() => {
        elements.processingIndicator.classList.add("hidden");
        elements.resultsSection.classList.remove("hidden");
        elements.generateBtn.disabled = false;
      }, 500);
    } else {
      throw new Error(data.error || "Generation failed");
    }
  } catch (error) {
    clearInterval(progressInterval);
    showError(error.message);
    elements.generateBtn.disabled = false;
  }
}

// Get progress message
function getProgressMessage(progress) {
  if (progress < 30) return "Analyzing image...";
  if (progress < 60) return "Processing with AI...";
  if (progress < 90) return "Generating modifications...";
  return "Finalizing results...";
}

// Show error
function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorDisplay.classList.remove("hidden");
  elements.processingIndicator.classList.add("hidden");
}

// Show prompt modal
function showPromptModal() {
  if (state.results) {
    elements.promptModal.classList.remove("hidden");
  }
}

// Copy prompt to clipboard
async function copyPromptToClipboard() {
  try {
    await navigator.clipboard.writeText(state.results.prompt);
    const originalText = elements.copyPrompt.innerHTML;
    elements.copyPrompt.innerHTML = '<i class="fas fa-check mr-2"></i>Copied!';
    setTimeout(() => {
      elements.copyPrompt.innerHTML = originalText;
    }, 2000);
  } catch (error) {
    console.error("Failed to copy:", error);
  }
}

// Download result
function downloadResult() {
  if (!state.results) return;

  const link = document.createElement("a");
  link.href = state.results.generatedImageUrl;
  link.download = "modified-dental-image.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Reset all
function resetAll() {
  // Reset state
  state = {
    imageFile: null,
    selectedOptions: {
      arch: "upper",
      teeth_count: "6",
      brighten: null,
      correct_crowding_with_alignment: null,
      widen_upper_teeth: false,
      widen_lower_teeth: false,
      close_spaces_evenly: false,
      replace_missing_teeth: false,
      reduce_gummy_smile: false,
      improve_shape_of_incisal_edges: false,
      improve_gum_recession: false,
      correct_underbite: false,
      correct_overbite: false,
    },
    results: null,
  };

  // Reset UI
  elements.imageInput.value = "";
  elements.imagePreview.classList.add("hidden");
  elements.resultsSection.classList.add("hidden");
  elements.errorDisplay.classList.add("hidden");
  elements.processingIndicator.classList.add("hidden");

  // Reset checkboxes
  document
    .querySelectorAll('input[type="checkbox"]')
    .forEach((cb) => (cb.checked = false));

  // Reset option buttons
  document.querySelectorAll(".option-card").forEach((card) => {
    card.classList.remove("selected");
  });

  // Set defaults
  document
    .querySelector('[data-option="arch"][data-value="upper"]')
    .classList.add("selected");
  document
    .querySelector('[data-option="teeth_count"][data-value="6"]')
    .classList.add("selected");

  updateOptionsSummary();
  updateGenerateButton();

  // Show success message
  showTemporaryMessage("All settings have been reset");
}

// Show temporary message
function showTemporaryMessage(message) {
  const msg = document.createElement("div");
  msg.className =
    "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50";
  msg.textContent = message;
  document.body.appendChild(msg);

  setTimeout(() => {
    msg.remove();
  }, 3000);
}
