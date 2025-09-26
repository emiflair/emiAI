const { OpenAI } = require('openai');

// Load API key from environment first; fallback to optional local config.js
let config;
try {
    // config.js should export an object like { openaiApiKey: '...' }
    // It's optional when using environment variables.
    // eslint-disable-next-line import/no-unresolved, global-require
    config = require('./config');
} catch (_) {
    config = undefined;
}

const apiKey = process.env.OPENAI_API_KEY || config?.openaiApiKey;
if (!apiKey) {
    // Provide a clear error early; container logs will show this if missing
    throw new Error('Missing OpenAI API key. Set OPENAI_API_KEY env var or provide openaiApiKey in config.js');
}

const openai = new OpenAI({ apiKey });

class OpenAIAPI {
    // Map emy models to actual OpenAI models
    static getActualModel(emyModel) {
        const modelMap = {
            'emy-3.0': 'gpt-3.5-turbo',
            'emy-pro': 'gpt-4',
            'emy-deep-think': 'gpt-4-turbo-preview'
        };
        return modelMap[emyModel] || 'gpt-3.5-turbo';
    }

    static async generateResponse(userMessage, selectedModel = 'emy-pro') {
        try {
            const actualModel = this.getActualModel(selectedModel);
            
            const response = await openai.chat.completions.create({
                model: actualModel,
                messages: [
                    {
                        role: "system",
                        content: "You are EmyChatBot, a helpful and friendly AI assistant. You can help with a wide variety of topics including but not limited to: programming and technology, writing and editing, math and science, creative projects, general knowledge, advice and guidance, problem-solving, learning new skills, entertainment recommendations, and everyday questions. You're knowledgeable, patient, and always aim to provide helpful, accurate, and engaging responses. IMPORTANT: After providing your main response, always end with a relevant follow-up question or offer additional assistance to keep the conversation engaging. Examples: 'Would you like me to explain more about...?', 'Is there anything specific about this topic you'd like to dive deeper into?', 'Do you have any other questions about this?', or 'Would you like me to help you with something related to this?'"
                    },
                    {
                        role: "user",
                        content: userMessage
                    }
                ],
                max_tokens: 800,
                temperature: 0.7,
            });

            return response.choices[0].message.content.trim();
        } catch (error) {
            console.error('Error calling OpenAI API:', error);
            return 'Sorry, I encountered an error. Please check your API key and try again.';
        }
    }

    static async generateResponseWithImage(userMessage, imageData, selectedModel = 'emy-pro') {
        try {
            const actualModel = this.getActualModel(selectedModel);
            
            // First, try with GPT-4 Vision
            const base64Data = imageData.split(',')[1];
            const mimeType = imageData.split(';')[0].split(':')[1];
            
            console.log(`Processing image analysis request. Image type: ${mimeType}, Message: "${userMessage}", Model: ${actualModel}`);
            
            const messages = [
                {
                    role: "system",
                    content: "You are EmyChatBot, a helpful AI assistant with vision capabilities. You can analyze images and answer questions about them. You help with a wide variety of topics including visual content analysis, reading text in images, identifying objects, explaining diagrams, analyzing code screenshots, describing scenes, and much more. Be detailed and helpful in your image analysis while also being conversational and engaging. IMPORTANT: After analyzing the image and providing your main response, always end with a relevant follow-up question to keep the conversation going. Examples: 'Would you like me to explain more about what I see?', 'Do you have any specific questions about this image?', 'Is there a particular aspect you'd like me to focus on?', or 'Would you like me to help you with something related to this?'"
                }
            ];

            // Create user message with image
            const userMessageContent = [
                {
                    type: "text",
                    text: userMessage || "What do you see in this image? Please describe it in detail."
                },
                {
                    type: "image_url",
                    image_url: {
                        url: `data:${mimeType};base64,${base64Data}`,
                        detail: "high"
                    }
                }
            ];

            messages.push({
                role: "user",
                content: userMessageContent
            });

            try {
                // Try GPT-4 Vision first
                const response = await openai.chat.completions.create({
                    model: "gpt-4-vision-preview",
                    messages: messages,
                    max_tokens: 1000,
                    temperature: 0.7,
                });

                return response.choices[0].message.content.trim();
            } catch (visionError) {
                console.log('GPT-4 Vision not available, trying alternative models...');
                
                // Try GPT-4 Turbo with Vision
                try {
                    const response = await openai.chat.completions.create({
                        model: "gpt-4o",
                        messages: messages,
                        max_tokens: 1000,
                        temperature: 0.7,
                    });
                    return response.choices[0].message.content.trim();
                } catch (gpt4oError) {
                    console.log('GPT-4o not available, falling back to text-only response...');
                    
                    // Fallback: Provide helpful response about image upload
                    const fallbackMessage = userMessage || "analyze this image";
                    return `I can see that you've uploaded an image and asked me to "${fallbackMessage}". Unfortunately, my current configuration doesn't have access to GPT-4 Vision for image analysis. 

However, I can still help you in other ways:

🔍 **What I can do:**
- Answer questions about code if you describe it
- Help with programming concepts
- Debug issues if you copy/paste the code
- Provide explanations for technical topics

📝 **To get help with your image:**
- Describe what you see in the image
- Copy and paste any code shown
- Tell me what specific help you need

💡 **Note:** To enable image analysis, you would need:
- GPT-4 Vision access in your OpenAI account
- Or upgrade your OpenAI plan to include vision capabilities

How else can I help you today?`;
                }
            }
        } catch (error) {
            console.error('Error in image processing:', error);
            console.error('Error details:', error.response?.data || error.message);
            
            // Provide specific error messages based on the error type
            if (error.message.includes('insufficient_quota') || error.status === 429) {
                return 'Sorry, the API quota has been exceeded. Please check your OpenAI account and billing.';
            } else if (error.message.includes('invalid_api_key') || error.status === 401) {
                return 'Sorry, there seems to be an issue with the API key. Please check your configuration.';
            } else if (error.status === 400) {
                return 'Sorry, there was an issue with the image format or request. Please try with a different image.';
            } else {
                return `I received your image but encountered an error: ${error.message}. Please describe what you see in the image, and I'll help you that way!`;
            }
        }
    }
}

module.exports = { OpenAIAPI };