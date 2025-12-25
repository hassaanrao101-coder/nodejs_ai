// controllers/imageController.js
const { OpenAI } = require('openai');
const PromptBuilder = require('../services/promptBuilder');
class ImageController {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Main handler for dental image creation
   */
  
  async createImage(req, res, next) {
    try {
      // 1. Validate file exists
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          error: 'No image provided' 
        });
      }

      // 2. Validate query parameters
      // console.log("file got", req.file);
      
      const validation = PromptBuilder.validate(req.query);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          details: validation.errors
        });
      }

      // 3. Build prompt from query parameters
      // console.log(req.body);
      // console.log(req.query);
      let params;
      if(Object.keys(req.body).length !== 0 ) params= req.body;
      if(Object.keys(req.query).length !== 0 ) params= req.query;

      const promptBuilder = new PromptBuilder(params);
      const prompt = promptBuilder.build();

      console.log('Generated Prompt:', prompt);

      // 4. Convert image to base64
      const base64Image = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      // 5. Call OpenAI API
      const response = await this.callOpenAI(prompt, dataUrl);

      // 6. Return success response
      return res.json({
        success: true,
        data: {
          generatedImageUrl: response.imageUrl,
          description: response.description,
          prompt: prompt,
          modifications: promptBuilder.modifications
        }
      });

    } catch (error) {
      // Pass to error handler middleware
      next(error);
    }
  }

  /**
   * Call OpenAI API for image generation/modification
   */
  async callOpenAI(prompt, imageDataUrl) {
    try {
      // Option 1: Use GPT-4 Vision to analyze and describe modifications
      // const visionResponse = await this.openai.chat.completions.create({
      //   model: 'gpt-4o',
      //   messages: [
      //     {
      //       role: 'user',
      //       content: [
      //         { type: 'text', text: prompt },
      //         { type: 'image_url', image_url: { url: imageDataUrl } }
      //       ]
      //     }
      //   ],
      //   max_tokens: 500
      // });

      // const description = visionResponse.choices[0].message.content;
      const description = "testing local"


      // Option 2: Use DALL-E for actual image generation
      // Note: DALL-E 3 doesn't support image-to-image editing directly
      // You would need to use DALL-E 2's edit endpoint or generate from scratch
      
      // For now, we'll use the vision model's description
      // In production, you might integrate with other image processing APIs
https://images.pexels.com/photos/20620210/pexels-photo-20620210.jpeg
      return {
        description: description,
        imageUrl: "https://images.pexels.com/photos/20620210/pexels-photo-20620210.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        // In real implementation, this would be the actual generated image URL
      };

    } catch (error) {
      // Handle OpenAI-specific errors
      this.handleOpenAIError(error);
    }
  }

  /**
   * Handle OpenAI API errors with detailed messages
   */
  handleOpenAIError(error) {
    console.error('OpenAI API Error:', error);

    // API Key errors
    if (error.status === 401) {
      const err = new Error('Invalid or missing OpenAI API key');
      err.status = 500;
      err.code = 'INVALID_API_KEY';
      throw err;
    }

    // Rate limit errors
    if (error.status === 429) {
      const err = new Error('OpenAI API rate limit exceeded. Please try again later.');
      err.status = 429;
      err.code = 'RATE_LIMIT_EXCEEDED';
      throw err;
    }

    // Insufficient quota
    if (error.code === 'insufficient_quota') {
      const err = new Error('OpenAI API quota exceeded. Please check your billing.');
      err.status = 402;
      err.code = 'INSUFFICIENT_QUOTA';
      throw err;
    }

    // Content policy violations
    if (error.code === 'content_policy_violation') {
      const err = new Error('Image violates OpenAI content policy');
      err.status = 400;
      err.code = 'CONTENT_POLICY_VIOLATION';
      throw err;
    }

    // Server errors
    if (error.status >= 500) {
      const err = new Error('OpenAI service temporarily unavailable');
      err.status = 503;
      err.code = 'SERVICE_UNAVAILABLE';
      throw err;
    }

    // Generic OpenAI error
    const err = new Error(error.message || 'Failed to process image with AI');
    err.status = 500;
    err.code = 'AI_PROCESSING_ERROR';
    err.originalError = error;
    throw err;
  }
}

module.exports = new ImageController();