// script.js

// 1. IMPORT the Gemini AI SDK.
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

// 2. Paste your WEBSITE-RESTRICTED API key here.
const GEMINI_API_KEY = "AIzaSyDly98d9CjJCxjBOL7ZmfLKHGK4m79SSq4";

// 3. Initialize the SDK.
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// 4. THE FIX: Use the new, recommended model for ALL tasks.
// It's multimodal, so it can handle both vision and text.
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const imageUpload = document.getElementById("imageUpload");
  const imagePreview = document.getElementById("imagePreview");
  const handwrittenText = document.getElementById("handwrittenText");
  const processBtn = document.getElementById("processBtn");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const progressTextEl = document.getElementById("progressText");
  const progressBarEl = document.getElementById("progressBar");
  const recognizedText = document.getElementById("recognizedText");
  const personalityAnalysis = document.getElementById("personalityAnalysis");
  const summary = document.getElementById("summary");
  const writingStyle = document.getElementById("writingStyle");
  const styleTags = document.getElementById("styleTags");
  const resources = document.getElementById("resources");
  const copyTextBtn = document.getElementById("copyTextBtn");
  const downloadTextBtn = document.getElementById("downloadTextBtn");
  const wordCount = document.getElementById("wordCount");
  const readTime = document.getElementById("readTime");
  const keyPhrases = document.getElementById("keyPhrases");

  // Metrics elements
  const legibilityScore = document.getElementById("legibilityScore");
  const slantScore = document.getElementById("slantScore");
  const pressureScore = document.getElementById("pressureScore");
  const spacingScore = document.getElementById("spacingScore");

  // Personality bars
  const opennessBar = document.getElementById("opennessBar");
  const conscientiousnessBar = document.getElementById("conscientiousnessBar");
  const extraversionBar = document.getElementById("extraversionBar");
  const agreeablenessBar = document.getElementById("agreeablenessBar");
  const neuroticismBar = document.getElementById("neuroticismBar");

  let selectedImage = null;
  let handwritingChart = null;

  console.log("Gemini models are ready.");

  // Theme Toggle Functionality
  const themeSwitch = document.getElementById("themeSwitch");
  const docElement = document.documentElement;

  function updateChartThemeStyle() {
    if (!handwritingChart) return;

    const isLight =
      docElement.hasAttribute("data-theme") &&
      docElement.getAttribute("data-theme") === "light";

    const styles = getComputedStyle(docElement);
    const gridColor = styles.getPropertyValue("--glass-border").trim();
    const textColor = styles.getPropertyValue("--text-muted").trim();
    const pointBorderColor = isLight
      ? styles.getPropertyValue("--bg-darker").trim()
      : "#fff";

    const primaryColor = styles.getPropertyValue("--primary-color").trim();
    const secondaryColor = styles.getPropertyValue("--secondary-color").trim();

    const chartOptions = handwritingChart.options.scales.r;
    if (chartOptions) {
      chartOptions.angleLines.color = gridColor;
      chartOptions.grid.color = gridColor;
      if (chartOptions.ticks) {
        chartOptions.ticks.color = textColor;
        chartOptions.ticks.backdropColor = "transparent";
      }
      if (chartOptions.pointLabels) {
        chartOptions.pointLabels.color = textColor;
      }
    }

    const dataset = handwritingChart.data.datasets[0];
    dataset.borderColor = secondaryColor;
    dataset.backgroundColor = "rgba(136, 211, 206, 0.2)";
    dataset.pointBackgroundColor = primaryColor;
    dataset.pointBorderColor = pointBorderColor;
    dataset.pointHoverBackgroundColor = primaryColor;
    dataset.pointHoverBorderColor = pointBorderColor;

    handwritingChart.update();
  }

  function applyThemePreference() {
    const isLight = themeSwitch.checked;
    if (isLight) {
      docElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    } else {
      docElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "dark");
    }
    setTimeout(updateChartThemeStyle, 50);
  }

  // Initial theme setup
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    themeSwitch.checked = true;
    docElement.setAttribute("data-theme", "light");
  } else {
    themeSwitch.checked = false;
    docElement.removeAttribute("data-theme");
  }

  themeSwitch.addEventListener("change", applyThemePreference);

  // Initialize Chart
  function initChart() {
    const ctx = document.getElementById("handwritingChart").getContext("2d");
    handwritingChart = new Chart(ctx, {
      type: "radar",
      data: {
        labels: [
          "Legibility",
          "Slant",
          "Pressure",
          "Spacing",
          "Consistency",
          "Size",
        ],
        datasets: [
          {
            label: "Handwriting Metrics",
            data: [0, 0, 0, 0, 0, 0],
            pointHoverRadius: 5,
            pointHitRadius: 10,
            pointBorderWidth: 2,
            borderWidth: 2,
          },
        ],
      },
      options: {
        scales: {
          r: {
            angleLines: { display: true },
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: { stepSize: 20 },
          },
        },
        plugins: { legend: { display: false } },
        elements: { line: { tension: 0.1 } },
      },
    });
    updateChartThemeStyle();
  }

  // Handle image upload
  imageUpload.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file && file.type.match("image.*")) {
      selectedImage = file;

      const reader = new FileReader();
      reader.onload = function (event) {
        const handwrittenTextCardBody =
          handwrittenText.querySelector(".card-body");
        if (handwrittenTextCardBody) {
          handwrittenTextCardBody.innerHTML = `
                        <img src="${event.target.result}" alt="Uploaded Handwriting" style="max-width: 100%; max-height: 400px; object-fit: contain;">
                    `;
        }
        handwrittenText.classList.add("show");

        imagePreview.innerHTML = `<img src="${event.target.result}" alt="Uploaded Handwriting">`;
        imagePreview.style.display = "block";
        processBtn.disabled = false;

        resetResults();
      };
      reader.readAsDataURL(file);
    }
  });

  function resetResults() {
    recognizedText.value = "";
    personalityAnalysis.innerHTML =
      '<div class="placeholder-text">Personality analysis will appear here after processing</div>';
    summary.innerHTML =
      '<div class="placeholder-text">Summary will appear here after processing</div>';
    writingStyle.innerHTML =
      '<div class="placeholder-text">Writing style analysis will appear here after processing</div>';
    resources.innerHTML =
      '<div class="placeholder-text">Recommended learning resources will appear here</div>';
    styleTags.innerHTML = "";

    legibilityScore.textContent = "--";
    slantScore.textContent = "--";
    pressureScore.textContent = "--";
    spacingScore.textContent = "--";

    opennessBar.style.width = "0%";
    conscientiousnessBar.style.width = "0%";
    extraversionBar.style.width = "0%";
    agreeablenessBar.style.width = "0%";
    neuroticismBar.style.width = "0%";

    if (handwritingChart) {
      handwritingChart.data.datasets[0].data = [0, 0, 0, 0, 0, 0];
      handwritingChart.update();
    }
  }

  const uploadArea = document.querySelector(".upload-area");

  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = "var(--secondary-color)";
    uploadArea.style.background = "rgba(136, 211, 206, 0.2)";
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.style.borderColor = "var(--glass-border)";
    uploadArea.style.background = "rgba(255, 255, 255, 0.05)";
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = "var(--glass-border)";
    uploadArea.style.background = "rgba(255, 255, 255, 0.05)";

    const file = e.dataTransfer.files[0];
    if (file && file.type.match("image.*")) {
      imageUpload.files = e.dataTransfer.files;
      const event = new Event("change");
      imageUpload.dispatchEvent(event);
    }
  });

  // Convert image to base64 for Gemini
  function fileToGenerativePart(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          inlineData: {
            data: reader.result.split(",")[1],
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Process button handler with Gemini integration
  processBtn.addEventListener("click", async function () {
    if (!selectedImage || !model) return;

    loadingIndicator.style.display = "flex";
    progressBarEl.style.width = "0%";
    progressTextEl.textContent = "Initializing...";
    resetResults();

    try {
      // Step 1: Extract text with Gemini Vision
      progressTextEl.textContent = "Extracting text...";
      progressBarEl.style.width = "30%";

      const imagePart = await fileToGenerativePart(selectedImage);
      const prompt =
        "Extract all text from this handwritten image exactly as written. Include all spelling errors and formatting. Return only the extracted text.";

      // THE FIX: Use the new single 'model' variable
      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text();

      recognizedText.value = text;
      updateTextStats(text);

      // Step 2: Analyze text with Gemini Pro
      progressTextEl.textContent = "Analyzing content...";
      progressBarEl.style.width = "60%";

      // Personality Analysis
      const personalityPrompt = `Analyze the personality traits from this text using the Big Five model. Return a JSON object with these keys: analysis (string describing personality traits), openness (number 0-100), conscientiousness (number 0-100), extraversion (number 0-100), agreeableness (number 0-100), neuroticism (number 0-100)\n\nText: ${text}`;

      // THE FIX: Use the new single 'model' variable
      const personalityResult = await model.generateContent(personalityPrompt);
      const personalityJson = extractJson(personalityResult.response.text());
      const personalityData = JSON.parse(personalityJson);

      opennessBar.style.width = `${personalityData.openness || 0}%`;
      conscientiousnessBar.style.width = `${
        personalityData.conscientiousness || 0
      }%`;
      extraversionBar.style.width = `${personalityData.extraversion || 0}%`;
      agreeablenessBar.style.width = `${personalityData.agreeableness || 0}%`;
      neuroticismBar.style.width = `${personalityData.neuroticism || 0}%`;

      personalityAnalysis.innerHTML = `<div class="analysis-section"><p>${
        personalityData.analysis ||
        "Personality analysis based on writing style"
      }</p><ul><li><strong>Openness</strong>: ${
        personalityData.openness || 0
      }% - Creativity, curiosity, preference for variety</li><li><strong>Conscientiousness</strong>: ${
        personalityData.conscientiousness || 0
      }% - Organization, dependability</li><li><strong>Extraversion</strong>: ${
        personalityData.extraversion || 0
      }% - Social engagement, assertiveness</li><li><strong>Agreeableness</strong>: ${
        personalityData.agreeableness || 0
      }% - Compassion, cooperativeness</li><li><strong>Neuroticism</strong>: ${
        personalityData.neuroticism || 0
      }% - Emotional stability, resilience</li></ul></div>`;

      // Writing Style Analysis
      progressBarEl.style.width = "70%";
      progressTextEl.textContent = "Analyzing writing style...";

      const stylePrompt = `Analyze the writing style of this text. Identify 3-5 key characteristics and themes. Return a JSON object with: analysis (string describing writing style), tags (array of 3-5 string tags)\n\nText: ${text}`;

      // THE FIX: Use the new single 'model' variable
      const styleResult = await model.generateContent(stylePrompt);
      const styleJson = extractJson(styleResult.response.text());
      const styleData = JSON.parse(styleJson);

      writingStyle.innerHTML = `<div class="analysis-section">${
        styleData.analysis || "Writing style analysis"
      }</div>`;

      if (styleData.tags && styleData.tags.length > 0) {
        styleTags.innerHTML = styleData.tags
          .map(
            (tag) =>
              `<div class="style-tag"><i class="fas fa-tag"></i> ${tag}</div>`
          )
          .join("");
      } else {
        styleTags.innerHTML = "";
      }

      // Summary
      progressBarEl.style.width = "80%";
      progressTextEl.textContent = "Generating summary...";

      const summaryPrompt = `Create a concise summary of this text (max 150 words): ${text}`;

      // THE FIX: Use the new single 'model' variable
      const summaryResult = await model.generateContent(summaryPrompt);
      summary.innerHTML = `<div class="analysis-section">${summaryResult.response.text()}</div>`;

      // Resources
      progressBarEl.style.width = "90%";
      progressTextEl.textContent = "Finding resources...";

      const resourcesPrompt = `Suggest 3 learning resources (books, websites, courses) related to this text's content. Return a JSON array of objects: [{title: string, url: string}]\n\nText: ${text}`;

      // THE FIX: Use the new single 'model' variable
      const resourcesResult = await model.generateContent(resourcesPrompt);
      const resourcesJson = extractJson(resourcesResult.response.text());
      const resourcesData = JSON.parse(resourcesJson);

      updateResources(resourcesData);

      // Handwriting metrics
      updateHandwritingMetrics();

      // Complete
      progressBarEl.style.width = "100%";
      progressTextEl.textContent = "Analysis complete!";

      setTimeout(() => {
        loadingIndicator.style.display = "none";
      }, 1000);
    } catch (err) {
      console.error("Analysis Error:", err);
      recognizedText.value =
        "Error: " + (err.message || "Failed to process image");
      loadingIndicator.style.display = "none";
    }
  });

  // Helper to extract JSON from Gemini response
  function extractJson(text) {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1];
    }
    const rawJsonMatch = text.match(/{[\s\S]*}|\[[\s\S]*\]/);
    if (rawJsonMatch) {
      return rawJsonMatch[0];
    }
    console.warn("Could not extract valid JSON from response:", text);
    return "{}";
  }

  function updateTextStats(text) {
    const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    wordCount.textContent = words;

    const minutes = Math.ceil(words / 200);
    readTime.textContent = minutes;

    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const keyPhrasesList = sentences
      .slice(0, 3)
      .map((s) => s.trim().substring(0, 20) + "...");
    keyPhrases.textContent =
      keyPhrasesList.length > 0 ? keyPhrasesList.join(", ") : "--";
  }

  copyTextBtn.addEventListener("click", function () {
    if (recognizedText.value) {
      navigator.clipboard
        .writeText(recognizedText.value)
        .then(() => {
          const originalText = copyTextBtn.innerHTML;
          copyTextBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
          setTimeout(() => {
            copyTextBtn.innerHTML = originalText;
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
        });
    }
  });

  downloadTextBtn.addEventListener("click", function () {
    if (recognizedText.value) {
      const blob = new Blob([recognizedText.value], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "handwriting-text.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  });

  function updateResources(resourcesList) {
    if (
      !resourcesList ||
      !Array.isArray(resourcesList) ||
      resourcesList.length === 0
    ) {
      resources.innerHTML =
        '<div class="placeholder-text">No specific resources recommended for this content.</div>';
      return;
    }

    let resourcesHTML = `
            <div class="analysis-section">
                <p>Based on the content, here are some recommended resources:</p>
                <ul class="resource-list">
                    ${resourcesList
                      .slice(0, 3)
                      .map(
                        (resource) => `
                        <li>
                            <a href="${resource.url}" target="_blank" rel="noopener noreferrer">
                                <i class="fas fa-external-link-alt"></i> ${resource.title}
                            </a>
                        </li>
                    `
                      )
                      .join("")}
                </ul>
            </div>
        `;
    resources.innerHTML = resourcesHTML;
  }

  function updateHandwritingMetrics() {
    const legibility = Math.floor(Math.random() * 30) + 70;
    const slantVal = Math.floor(Math.random() * 100);
    const pressureVal = Math.floor(Math.random() * 100);
    const spacingVal = Math.floor(Math.random() * 100);
    const consistency = Math.floor(Math.random() * 30) + 50;
    const size = Math.floor(Math.random() * 40) + 40;

    legibilityScore.textContent = `${legibility}%`;
    slantScore.textContent =
      slantVal > 66 ? "Right" : slantVal < 33 ? "Left" : "Vertical";
    pressureScore.textContent =
      pressureVal > 66 ? "Heavy" : pressureVal < 33 ? "Light" : "Medium";
    spacingScore.textContent =
      spacingVal > 66 ? "Wide" : spacingVal < 33 ? "Narrow" : "Average";

    if (handwritingChart) {
      handwritingChart.data.datasets[0].data = [
        legibility,
        slantVal,
        pressureVal,
        spacingVal,
        consistency,
        size,
      ];
      handwritingChart.update();
    }
  }

  initChart();
});
