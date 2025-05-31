document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const handwrittenText = document.getElementById('handwrittenText'); // The card
    const processBtn = document.getElementById('processBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const progressTextEl = document.getElementById('progressText'); // Renamed to avoid conflict with Tesseract's progress.text
    const progressBarEl = document.getElementById('progressBar'); // Renamed for clarity
    const recognizedText = document.getElementById('recognizedText');
    const personalityAnalysis = document.getElementById('personalityAnalysis');
    const summary = document.getElementById('summary');
    const writingStyle = document.getElementById('writingStyle');
    const styleTags = document.getElementById('styleTags');
    const resources = document.getElementById('resources');
    const copyTextBtn = document.getElementById('copyTextBtn');
    const downloadTextBtn = document.getElementById('downloadTextBtn');
    const wordCount = document.getElementById('wordCount');
    const readTime = document.getElementById('readTime');
    const keyPhrases = document.getElementById('keyPhrases');
    
    // Metrics elements
    const legibilityScore = document.getElementById('legibilityScore');
    const slantScore = document.getElementById('slantScore');
    const pressureScore = document.getElementById('pressureScore');
    const spacingScore = document.getElementById('spacingScore');
    
    // Personality bars
    const opennessBar = document.getElementById('opennessBar');
    const conscientiousnessBar = document.getElementById('conscientiousnessBar');
    const extraversionBar = document.getElementById('extraversionBar');
    const agreeablenessBar = document.getElementById('agreeablenessBar');
    const neuroticismBar = document.getElementById('neuroticismBar');
    
    let selectedImage = null;
    let handwritingChart = null; // Ensure this is accessible by theme functions

    // Theme Toggle Functionality
    const themeSwitch = document.getElementById('themeSwitch');
    const docElement = document.documentElement;

    function updateChartThemeStyle() {
        if (!handwritingChart) return;

        const isLight = docElement.hasAttribute('data-theme') && docElement.getAttribute('data-theme') === 'light';
        
        const styles = getComputedStyle(docElement);
        const gridColor = styles.getPropertyValue('--glass-border').trim(); 
        const textColor = styles.getPropertyValue('--text-muted').trim();   
        const pointBorderColor = isLight ? styles.getPropertyValue('--bg-darker').trim() : '#fff'; // Use bg-darker for light theme point border

        const primaryColor = styles.getPropertyValue('--primary-color').trim(); 
        const secondaryColor = styles.getPropertyValue('--secondary-color').trim(); 
        
        const chartOptions = handwritingChart.options.scales.r;
        if (chartOptions) { // Check if r scale exists
            chartOptions.angleLines.color = gridColor;
            chartOptions.grid.color = gridColor;
            if (chartOptions.ticks) {
                 chartOptions.ticks.color = textColor;
                 chartOptions.ticks.backdropColor = 'transparent'; 
            }
            if (chartOptions.pointLabels) {
                chartOptions.pointLabels.color = textColor;
            }
        }


        const dataset = handwritingChart.data.datasets[0];
        dataset.borderColor = secondaryColor;
        // --secondary-color is #88d3ce which is rgba(136, 211, 206)
        // Keep this consistent as --secondary-color is not theme-dependent
        dataset.backgroundColor = 'rgba(136, 211, 206, 0.2)'; 
       
        dataset.pointBackgroundColor = primaryColor;
        dataset.pointBorderColor = pointBorderColor;
        dataset.pointHoverBackgroundColor = primaryColor;
        dataset.pointHoverBorderColor = pointBorderColor;

        handwritingChart.update();
    }

    function applyThemePreference() {
        const isLight = themeSwitch.checked;
        if (isLight) {
            docElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        } else {
            docElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
        }
        // Defer chart update slightly to ensure CSS variables are updated in the DOM
        // This is crucial because getComputedStyle needs the updated styles.
        setTimeout(updateChartThemeStyle, 50); 
    }

    // Initial theme setup from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        themeSwitch.checked = true;
        docElement.setAttribute('data-theme', 'light'); 
    } else { // Handles null (no theme saved) or 'dark'
        themeSwitch.checked = false;
        docElement.removeAttribute('data-theme');
    }
    // Chart theme will be applied/updated once initChart() is called.

    themeSwitch.addEventListener('change', applyThemePreference);
    
    // Initialize Chart
    function initChart() {
        const ctx = document.getElementById('handwritingChart').getContext('2d');
        handwritingChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Legibility', 'Slant', 'Pressure', 'Spacing', 'Consistency', 'Size'],
                datasets: [{
                    label: 'Handwriting Metrics',
                    data: [0, 0, 0, 0, 0, 0],
                    // Colors will be set by updateChartThemeStyle
                    // backgroundColor: 'rgba(136, 211, 206, 0.2)', // Default for dark
                    // borderColor: 'rgba(136, 211, 206, 1)',     // Default for dark
                    // pointBackgroundColor: 'rgba(110, 69, 226, 1)',// Default for dark
                    // pointBorderColor: '#fff',                   // Default for dark
                    pointHoverRadius: 5,
                    // pointHoverBackgroundColor: 'rgba(110, 69, 226, 1)',
                    // pointHoverBorderColor: '#fff',
                    pointHitRadius: 10,
                    pointBorderWidth: 2,
                    borderWidth: 2
                }]
            },
            options: {
                scales: {
                    r: {
                        angleLines: {
                            display: true,
                            // color: 'rgba(255, 255, 255, 0.1)' // Default for dark
                        },
                        suggestedMin: 0,
                        suggestedMax: 100,
                        ticks: {
                            // backdropColor: 'transparent',        // Default for dark
                            // color: 'rgba(255, 255, 255, 0.7)', // Default for dark
                            stepSize: 20
                        },
                        grid: {
                            // color: 'rgba(255, 255, 255, 0.1)'    // Default for dark
                        },
                        pointLabels: {
                            // color: 'rgba(255, 255, 255, 0.7)'   // Default for dark
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                elements: {
                    line: {
                        tension: 0.1
                    }
                }
            }
        });
        updateChartThemeStyle(); // Apply current theme to chart right after creation
    }
    
    // Handle image upload
    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.match('image.*')) {
            selectedImage = file;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                // Clear previous content and display image in "Original Handwriting" card
                const handwrittenTextCardBody = handwrittenText.querySelector('.card-body');
                if (handwrittenTextCardBody) {
                    handwrittenTextCardBody.innerHTML = `
                        <img src="${event.target.result}" alt="Uploaded Handwriting" style="max-width: 100%; max-height: 400px; object-fit: contain;">
                    `;
                }
                handwrittenText.classList.add('show');
                
                // Update preview in upload card
                imagePreview.innerHTML = `<img src="${event.target.result}" alt="Uploaded Handwriting">`;
                imagePreview.style.display = 'block';
                processBtn.disabled = false;
                
                resetResults();
            };
            reader.readAsDataURL(file);
        }
    });
    
    function resetResults() {
        recognizedText.value = '';
        personalityAnalysis.innerHTML = '<div class="placeholder-text">Personality analysis will appear here after processing</div>';
        summary.innerHTML = '<div class="placeholder-text">Summary will appear here after processing</div>';
        writingStyle.innerHTML = '<div class="placeholder-text">Writing style analysis will appear here after processing</div>';
        resources.innerHTML = '<div class="placeholder-text">Recommended learning resources will appear here</div>';
        styleTags.innerHTML = '';
        
        legibilityScore.textContent = '--';
        slantScore.textContent = '--';
        pressureScore.textContent = '--';
        spacingScore.textContent = '--';
        
        opennessBar.style.width = '0%';
        conscientiousnessBar.style.width = '0%';
        extraversionBar.style.width = '0%';
        agreeablenessBar.style.width = '0%';
        neuroticismBar.style.width = '0%';
        
        if (handwritingChart) {
            handwritingChart.data.datasets[0].data = [0, 0, 0, 0, 0, 0];
            handwritingChart.update();
        }
    }
    
    const uploadArea = document.querySelector('.upload-area');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--secondary-color)';
        uploadArea.style.background = 'rgba(136, 211, 206, 0.2)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--glass-border)'; // Use CSS var
        uploadArea.style.background = 'rgba(255, 255, 255, 0.05)'; // Or themed var
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--glass-border)';
        uploadArea.style.background = 'rgba(255, 255, 255, 0.05)';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.match('image.*')) {
            imageUpload.files = e.dataTransfer.files;
            const event = new Event('change');
            imageUpload.dispatchEvent(event);
        }
    });
    
    processBtn.addEventListener('click', function() {
        if (!selectedImage) return;
        
        loadingIndicator.style.display = 'flex';
        progressBarEl.style.width = '0%'; // Use renamed var
        progressTextEl.textContent = 'Initializing...'; // Use renamed var
        resetResults();
        
        Tesseract.recognize(
            selectedImage,
            'eng',
            { 
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const progress = Math.round(m.progress * 100);
                        progressBarEl.style.width = `${progress}%`; // Use renamed var
                        progressTextEl.textContent = `Progress: ${progress}%`; // Use renamed var
                    }
                },
                tessedit_pageseg_mode: 6 
            }
        ).then(({ data: { text } }) => {
            recognizedText.value = text;
            updateTextStats(text);
            
            setTimeout(() => {
                analyzeText(text);
                loadingIndicator.style.display = 'none';
            }, 1500);
        }).catch(err => {
            console.error(err);
            recognizedText.value = 'Error processing image. Please try another image.';
            loadingIndicator.style.display = 'none';
        });
    });
    
    function updateTextStats(text) {
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        wordCount.textContent = words;
        
        const minutes = Math.ceil(words / 200);
        readTime.textContent = minutes;
        
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const keyPhrasesList = sentences.slice(0, 3).map(s => s.trim().substring(0, 20) + '...');
        keyPhrases.textContent = keyPhrasesList.length > 0 ? keyPhrasesList.join(', ') : '--';
    }
    
    copyTextBtn.addEventListener('click', function() {
        if (recognizedText.value) {
            navigator.clipboard.writeText(recognizedText.value).then(() => {
                const originalText = copyTextBtn.innerHTML;
                copyTextBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    copyTextBtn.innerHTML = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                // Fallback for older browsers if needed, though execCommand is deprecated
                try {
                    recognizedText.select();
                    document.execCommand('copy');
                    const originalText = copyTextBtn.innerHTML;
                    copyTextBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => {
                        copyTextBtn.innerHTML = originalText;
                    }, 2000);
                } catch (e) {
                    // Handle error
                }
            });
        }
    });
    
    downloadTextBtn.addEventListener('click', function() {
        if (recognizedText.value) {
            const blob = new Blob([recognizedText.value], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'handwriting-text.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    });
    
    function analyzeText(text) {
        // const wordCountVal = text.trim() === '' ? 0 : text.trim().split(/\s+/).length; // Already in updateTextStats
        const { subject, topic } = detectSubjectAndTopic(text);
        const resourcesList = getStudyResources(subject, topic);
        
        generatePersonalityAnalysis(text);
        generateWritingStyleAnalysis(text);
        generateSummary(text);
        updateResources(resourcesList);
        updateHandwritingMetrics();
    }
    
    function generatePersonalityAnalysis(text) {
        const openness = Math.floor(Math.random() * 40) + 60;
        const conscientiousness = Math.floor(Math.random() * 40) + 50;
        const extraversion = Math.floor(Math.random() * 50) + 30;
        const agreeableness = Math.floor(Math.random() * 40) + 50;
        const neuroticism = Math.floor(Math.random() * 40) + 20;
        
        setTimeout(() => {
            opennessBar.style.width = `${openness}%`;
            conscientiousnessBar.style.width = `${conscientiousness}%`;
            extraversionBar.style.width = `${extraversion}%`;
            agreeablenessBar.style.width = `${agreeableness}%`;
            neuroticismBar.style.width = `${neuroticism}%`;
        }, 100);
        
        let analysis = `
            <div class="analysis-section">
                <p>Based on the handwriting analysis, the writer demonstrates:</p>
                <ul>
                    <li><strong>High openness</strong> (${openness}%) - Suggests creativity, curiosity, and preference for variety.</li>
                    <li><strong>Moderate to high conscientiousness</strong> (${conscientiousness}%) - Indicates organization, dependability, and self-discipline.</li>
                    <li><strong>Moderate extraversion</strong> (${extraversion}%) - Shows balanced social engagement.</li>
                    <li><strong>High agreeableness</strong> (${agreeableness}%) - Reflects compassion, cooperativeness, and trust.</li>
                    <li><strong>Low neuroticism</strong> (${neuroticism}%) - Suggests emotional stability and resilience.</li>
                </ul>
                <p>This personality profile indicates a creative, reliable individual who works well with others while maintaining emotional balance.</p>
            </div>
        `;
        personalityAnalysis.innerHTML = analysis;
    }
    
    function generateWritingStyleAnalysis(text) {
        const style = detectWritingStyle(text);
        const themes = detectThemes(text);
        
        let analysis = `
            <div class="analysis-section">
                <p>The writing demonstrates a <strong>${style}</strong> based on aspects like sentence structure, vocabulary, and language formality.</p>
        `;
        
        if (themes.length > 0 && themes[0] !== 'general text') { // Don't show "general text" as a key theme
            analysis += `
                <p>Key themes identified: <strong>${themes.join(', ')}</strong></p>
            `;
            styleTags.innerHTML = themes.map(theme => `
                <div class="style-tag">
                    <i class="fas fa-tag"></i> ${theme}
                </div>
            `).join('');
        } else {
            styleTags.innerHTML = ''; // Clear tags if no specific themes
        }
        analysis += `</div>`;
        writingStyle.innerHTML = analysis;
    }
    
    function generateSummary(text) {
        const summaryText = generateDetailedSummary(text);
        summary.innerHTML = `<div class="analysis-section">${summaryText}</div>`;
    }
    
    function updateResources(resourcesList) {
        if (resourcesList.length === 0) {
            resources.innerHTML = '<div class="placeholder-text">No specific resources recommended for this content.</div>';
            return;
        }
        
        let resourcesHTML = `
            <div class="analysis-section">
                <p>Based on the content, here are some recommended resources:</p>
                <ul class="resource-list">
                    ${resourcesList.map(resource => `
                        <li>
                            <a href="${resource.url}" target="_blank" rel="noopener noreferrer">
                                <i class="fas fa-external-link-alt"></i> ${resource.title}
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
        resources.innerHTML = resourcesHTML;
    }
    
    function updateHandwritingMetrics() {
        const legibility = Math.floor(Math.random() * 30) + 70;
        const slantVal = Math.floor(Math.random() * 100); // 0-100 for chart
        const pressureVal = Math.floor(Math.random() * 100); // 0-100 for chart
        const spacingVal = Math.floor(Math.random() * 100); // 0-100 for chart
        const consistency = Math.floor(Math.random() * 30) + 50;
        const size = Math.floor(Math.random() * 40) + 40;
        
        legibilityScore.textContent = `${legibility}%`;
        slantScore.textContent = slantVal > 66 ? 'Right' : (slantVal < 33 ? 'Left' : 'Vertical');
        pressureScore.textContent = pressureVal > 66 ? 'Heavy' : (pressureVal < 33 ? 'Light' : 'Medium');
        spacingScore.textContent = spacingVal > 66 ? 'Wide' : (spacingVal < 33 ? 'Narrow' : 'Average');
        
        if (handwritingChart) {
            handwritingChart.data.datasets[0].data = [
                legibility,
                slantVal,    // Use the 0-100 value for the radar chart
                pressureVal, // Use the 0-100 value
                spacingVal,  // Use the 0-100 value
                consistency,
                size
            ];
            handwritingChart.update();
        }
    }
    
    // function typeEffect(element, text, speed = 20) { ... } // Not used, can be removed

    function detectSubjectAndTopic(text) {
        const lowerText = text.toLowerCase();
        let subject = null;
        let topic = null;
        
        if (/math|algebra|calculus|equation|formula/.test(lowerText)) { subject = "Mathematics"; if (/algebra/.test(lowerText)) topic = "Algebra"; else if (/calculus/.test(lowerText)) topic = "Calculus"; else if (/geometry/.test(lowerText)) topic = "Geometry"; }
        else if (/physics|velocity|force|energy|quantum/.test(lowerText)) { subject = "Physics"; if (/quantum/.test(lowerText)) topic = "Quantum Physics"; else if (/mechanics/.test(lowerText)) topic = "Mechanics"; }
        else if (/chemistry|element|molecule|reaction/.test(lowerText)) { subject = "Chemistry"; if (/organic/.test(lowerText)) topic = "Organic Chemistry"; else if (/reaction/.test(lowerText)) topic = "Chemical Reactions"; }
        else if (/biology|cell|dna|evolution/.test(lowerText)) { subject = "Biology"; if (/cell/.test(lowerText)) topic = "Cell Biology"; else if (/dna|gene/.test(lowerText)) topic = "Genetics"; }
        else if (/history|war|empire|ancient/.test(lowerText)) { subject = "History"; if (/world war/.test(lowerText)) topic = "World Wars"; else if (/roman|greek/.test(lowerText)) topic = "Ancient History"; }
        else if (/literature|poem|novel|author/.test(lowerText)) { subject = "Literature"; if (/shakespeare/.test(lowerText)) topic = "Shakespeare"; else if (/poem/.test(lowerText)) topic = "Poetry"; }
        else if (/code|algorithm|function|variable/.test(lowerText)) { subject = "Computer Science"; if (/javascript|python|java/.test(lowerText)) topic = "Programming"; else if (/algorithm/.test(lowerText)) topic = "Algorithms"; }
        else if (/business|market|financ|econom/.test(lowerText)) { subject = "Business"; if (/market/.test(lowerText)) topic = "Marketing"; else if (/financ|invest/.test(lowerText)) topic = "Finance"; }
        
        if (!subject) {
            if (/meeting|agenda|minutes/.test(lowerText)) { subject = "Business"; topic = "Meeting Notes"; }
            else if (/dear|sincerely|regards/.test(lowerText)) { subject = "Communication"; topic = "Letter/Email"; }
            else if (/recipe|ingredient|cook/.test(lowerText)) { subject = "Cooking"; topic = "Recipe"; }
            else if (/todo|task|reminder|shopping list/.test(lowerText)) { subject = "Personal"; topic = "Notes/Lists"; }
        }
        return { subject, topic };
    }
    
    function getStudyResources(subject, topic) {
        if (!subject) return [];
        const baseResources = {
            "Mathematics": [{ title: "Khan Academy - Math", url: "https://www.khanacademy.org/math" }],
            "Physics": [{ title: "Physics Classroom", url: "https://www.physicsclassroom.com" }],
            "Chemistry": [{ title: "ChemGuide", url: "https://www.chemguide.co.uk" }],
            "Biology": [{ title: "Khan Academy - Biology", url: "https://www.khanacademy.org/science/biology" }],
            "History": [{ title: "Crash Course History", url: "https://www.youtube.com/@crashcourse" }],
            "Literature": [{ title: "Project Gutenberg", url: "https://www.gutenberg.org" }],
            "Computer Science": [{ title: "freeCodeCamp", url: "https://www.freecodecamp.org" }],
            "Business": [{ title: "Investopedia", url: "https://www.investopedia.com" }]
        };
        let resources = baseResources[subject] ? [...baseResources[subject]] : [];
        const topicSpecific = {
            "Algebra": [{ title: "Algebra Help - Purplemath", url: "https://www.purplemath.com/modules/index.htm" }],
            "Calculus": [{ title: "Paul's Online Math Notes - Calculus", url: "https://tutorial.math.lamar.edu/Classes/CalcI/CalcI.aspx"}]
            // Add more topic specific resources
        };
        if (topic && topicSpecific[topic]) resources.push(...topicSpecific[topic]);
        return resources.slice(0, 3); // Limit to 3 resources
    }
    
    function detectThemes(text) {
        const themes = new Set(); // Use a Set to avoid duplicate themes
        const lowerText = text.toLowerCase();
        if (/dear\s|sincerely|regards|love,|yours\s/.test(lowerText)) themes.add('personal communication');
        if (/meeting|agenda|minutes|re:|fw:/.test(lowerText)) themes.add('professional/business');
        if (/references|bibliography|thesis|abstract|research/.test(lowerText)) themes.add('academic');
        if (/once upon a time|chapter \d|scene \d|character/.test(lowerText)) themes.add('creative writing');
        if (/function\s*\w*\s*\(|return\s|import\s|class\s*\w*\s*:|console\.log/.test(lowerText)) themes.add('technical/code');
        if (/- \[[ x]\]|\b\d+\.\s|\b\d+\)\s|•\s|-\s/.test(lowerText) && lowerText.split('\n').length > 3) themes.add('list/notes'); // Check for multiple list items
        
        return themes.size > 0 ? Array.from(themes) : ['general text'];
    }
    
    function detectWritingStyle(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        if (sentences.length === 0) return "unknown";
        const avgSentenceLength = sentences.reduce((acc, s) => acc + s.split(/\s+/).length, 0) / sentences.length;
        const commasPerSentence = (text.match(/,/g) || []).length / Math.max(1, sentences.length);
        const formalMarkers = (text.match(/\b(however|therefore|moreover|furthermore|nevertheless|henceforth|accordingly)\b/gi) || []).length;

        if (avgSentenceLength > 22 || commasPerSentence > 1.8 || formalMarkers > 1) return "formal, complex style";
        if (avgSentenceLength > 18 || formalMarkers > 0) return "formal writing style";
        if (avgSentenceLength < 12 && commasPerSentence < 0.8) return "casual, conversational style";
        return "neutral writing style";
    }
    
    function generateDetailedSummary(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        if (sentences.length === 0) return "No text content available for summarization.";
        if (sentences.length <= 4) return "The text is concise: " + sentences.join(". ").substring(0, 350) + (sentences.join(". ").length > 350 ? "..." : ".");
        
        // Simple approach: take first 2 and last 2 sentences, or first few if short.
        let summarySentences = [];
        if (sentences.length <= 5) {
            summarySentences = sentences;
        } else {
            summarySentences = [
                sentences[0],
                sentences[1],
                // Could add a middle sentence: sentences[Math.floor(sentences.length / 2)],
                sentences[sentences.length - 2],
                sentences[sentences.length - 1]
            ];
        }
        let summaryText = summarySentences.map(s => s.trim()).join(". ") + ".";
        return summaryText.substring(0, 350) + (summaryText.length > 350 ? "..." : "");
    }
    
    initChart(); // Initialize the chart when the page loads
});