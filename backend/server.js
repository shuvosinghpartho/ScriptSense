const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const cors = require('cors');
const path = require('path'); // Not strictly needed for this setup, but good practice

const app = express();
const port = 3000; // You can change this port if needed

// Middleware
app.use(cors()); // Enable CORS for all routes (for development)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads (storing in memory)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB
});

// OCR Endpoint
app.post('/api/recognize-text', upload.single('handwritingImage'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded.' });
    }

    try {
        console.log('Received image for OCR:', req.file.originalname, req.file.mimetype);
        // req.file.buffer contains the image data
        const { data: { text } } = await Tesseract.recognize(
            req.file.buffer,
            'eng', // Language
            {
                // logger: m => console.log(m), // Optional: server-side Tesseract progress
                tessedit_pageseg_mode: 6 // Assume a single uniform block of text
            }
        );
        console.log('OCR Result:', text.substring(0, 100) + '...'); // Log snippet
        res.json({ recognizedText: text });
    } catch (error) {
        console.error('OCR Error on Server:', error);
        res.status(500).json({ error: 'Failed to recognize text from image.', details: error.message });
    }
});

// Basic route to check if server is running
app.get('/', (req, res) => {
    res.send('ScriptSense Backend is running!');
});

app.listen(port, () => {
    console.log(`ScriptSense backend server running at http://localhost:${port}`);
    console.log('Waiting for Tesseract.js worker to initialize (this might take a moment on first run)...');
    // Tesseract.js might download language data on first use if not found.
});