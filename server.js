require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { OpenAI } = require('openai');
const cors= require("cors")
const app = express();

const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like Postman, mobile apps, curl)
    // OR requests from allowed origins
    if (!origin) {
      // Option A: Block requests without origin (stricter)
      // callback(new Error('Not allowed by CORS'));
      
      // Option B: Allow requests without origin (current behavior)
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      const error = new Error('Not allowed by CORS');
      error.status=403 // forbidden
      callback(error)
    }
  },
  credentials: true // if you need cookies/auth headers
};

app.use(cors(corsOptions));

app.use(cors(corsOptions))

const PORT = process.env.PORT || 3000;

// Initialize OpenAI client (uses OPENAI_API_KEY from env automatically)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // baseURL: process.env.OPENAI_API_URL, // optional, default is fine
});

// Multer: in-memory upload, 10MB max, image only
const upload = multer({
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// 1. Wrap async route handlers to catch errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 2. Apply wrapper to your route
app.post('/create-image', upload.single('image'), asyncHandler(async (req, res) => {
  const query = req.query;
  console.log("params", query);

  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const body = req.body;
  console.log("body", body);

  // Convert to base64 data URL
  const base64Image = req.file.buffer.toString('base64');
  const mimeType = req.file.mimetype;
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  //here ai will be called for image generation

  const dummyResponse = {
    success: true,
    generatedImageUrl: "https://via.placeholder.com/512?text=Dummy+AI+Image",
    description: "[DUMMY] A realistic photo of a cat wearing sunglasses, sitting on a beach."
  };

  return res.json(dummyResponse);
}));

// 3. Fixed error handler
app.use((error, req, res, next) => {
  // Handle Multer-specific errors
  if (error instanceof multer.MulterError) {
    console.error('Multer error:', error);
    return res.status(400).json({ 
      error: 'Upload failed', 
      message: error.message 
    });
  }

  // Handle file filter errors
  if (error.message === 'Only image files are allowed') {
    console.error('File type error:', error);
    return res.status(400).json({ 
      error: 'Invalid file type', 
      message: error.message 
    });
  }

  // Handle all other errors
  console.error('Server error:', error);
  return res.status(500).json({ 
    error: 'Internal server error', 
    message:  error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔑 OpenAI client initialized (key loaded: ${!!process.env.OPENAI_API_KEY})`);
});