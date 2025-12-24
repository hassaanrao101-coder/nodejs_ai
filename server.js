require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { OpenAI } = require('openai');
const cors= require("cors")
const app = express();


app.use(cors({
  origin:["http://localhost:5173", "http://localhost:3000"]
}))

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

app.post('/create-image', upload.single('image'), async (req, res) => {
  const query= req.query
  console.log("params",query);
  
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const body= req.body
  console.log("body", body)
  // Convert to base64 data URL (required by GPT-4 Vision)
  const base64Image = req.file.buffer.toString('base64');
  const mimeType = req.file.mimetype;
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  // ✅ OpenAI client is ready — but we skip real call for now
  // 🔜 Later, uncomment this to make real API call:
  /*
  const chatCompletion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Describe this image in detail.' },
          { type: 'image_url', image_url: { url: dataUrl } }
        ]
      }
    ]
  });
  const description = chatCompletion.choices[0].message.content;
  */

  // 💡 For now: return DUMMY response (as requested)
  const dummyResponse = {
    success: true,
    // This mimics a DALL·E style image URL (even though Vision returns text)
    generatedImageUrl: "https://via.placeholder.com/512?text=Dummy+AI+Image",
    description: "[DUMMY] A realistic photo of a cat wearing sunglasses, sitting on a beach."
  };

  return res.json(dummyResponse);
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: 'Upload failed', message: error.message });
  }
  console.log(error);
  
  res.status(400).json({ error: error.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔑 OpenAI client initialized (key loaded: ${!!process.env.OPENAI_API_KEY})`);
});