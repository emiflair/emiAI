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

    static async generateResponse(userMessage, selectedModel = 'emy-pro', conversationHistory = []) {
        try {
            const actualModel = this.getActualModel(selectedModel);
            
            // Build messages array with conversation history
            const messages = [
                {
                    role: "system",
                    content: "You are emyAI, an advanced AI assistant designed to provide comprehensive, detailed, and thorough responses. Your communication style should be:\n\n📝 **DETAILED & COMPREHENSIVE**: Always provide complete, in-depth explanations rather than brief answers. Break down complex topics into understandable sections with clear headings, bullet points, and examples.\n\n🎯 **STRUCTURED RESPONSES**: Organize your answers with:\n- Clear introductions that acknowledge the user's question\n- Well-structured main content with headings and subpoints\n- Practical examples and step-by-step explanations when relevant\n- Comprehensive conclusions that tie everything together\n\n💡 **EDUCATIONAL APPROACH**: \n- Explain not just 'what' but also 'why' and 'how'\n- Provide context and background information\n- Include multiple perspectives when applicable\n- Offer practical applications and real-world examples\n- Share tips, best practices, and potential pitfalls\n\n🚀 **ENGAGEMENT**: \n- Use emojis and formatting to make responses visually appealing\n- Include relevant analogies and comparisons\n- Provide actionable next steps\n- Always end with engaging follow-up questions or offers for additional help\n\n🔧 **EXPERTISE AREAS**: Programming, technology, business, science, creative writing, problem-solving, learning, productivity, and general knowledge. Always aim to give university-level depth while maintaining accessibility.\n\n🧠 **MEMORY & CONTEXT**: You maintain context from previous messages in the conversation. Reference earlier parts of our discussion when relevant, and build upon previous topics naturally. Show that you remember what we've discussed before.\n\nRemember: Users want detailed, ChatGPT-style responses that give them comprehensive understanding and valuable insights. Never give short or superficial answers."
                }
            ];

            // Add conversation history (limit to last 10 exchanges to manage token count)
            const recentHistory = conversationHistory.slice(-20); // Last 20 messages (10 exchanges)
            messages.push(...recentHistory);

            // Add current user message
            messages.push({
                role: "user",
                content: userMessage
            });

            const response = await openai.chat.completions.create({
                model: actualModel,
                messages: messages,
                max_tokens: 2500,
                temperature: 0.8,
            });

            return response.choices[0].message.content.trim();
        } catch (error) {
            console.error('Error calling OpenAI API:', error);
            return 'Sorry, I encountered an error. Please check your API key and try again.';
        }
    }

    static async generateResponseWithImage(userMessage, imageData, selectedModel = 'emy-pro', conversationHistory = []) {
        try {
            const actualModel = this.getActualModel(selectedModel);
            
            // First, try with GPT-4 Vision
            const base64Data = imageData.split(',')[1];
            const mimeType = imageData.split(';')[0].split(':')[1];
            
            console.log(`Processing image analysis request. Image type: ${mimeType}, Message: "${userMessage}", Model: ${actualModel}`);
            
            const messages = [
                {
                    role: "system",
                    content: "You are emyAI, an advanced AI assistant with comprehensive vision capabilities. When analyzing images, provide extremely detailed, thorough responses that include:\n\n🔍 **COMPREHENSIVE ANALYSIS**:\n- Detailed descriptions of all visual elements, objects, people, text, and scenes\n- Analysis of composition, colors, lighting, and visual style\n- Context and background information about what you observe\n- Technical analysis when relevant (code, diagrams, charts, etc.)\n\n📊 **STRUCTURED BREAKDOWN**:\n- Main subject/focus of the image\n- Supporting elements and details\n- Text content (if any) with full transcription\n- Visual relationships and layout analysis\n- Quality, resolution, and technical aspects\n\n💡 **EDUCATIONAL VALUE**:\n- Explain the significance of what you see\n- Provide context and background knowledge\n- Offer insights about techniques, methods, or concepts shown\n- Share related information that might be helpful\n- Include practical applications or implications\n\n🎯 **ACTIONABLE INSIGHTS**:\n- Suggest improvements or next steps when appropriate\n- Provide troubleshooting advice for technical images\n- Offer optimization suggestions\n- Share best practices related to the content\n\n🧠 **MEMORY & CONTEXT**: You maintain context from previous messages in the conversation. Reference earlier parts of our discussion when relevant, and build upon previous topics naturally.\n\n✨ **ENGAGEMENT**: Use clear formatting, emojis, and structure to make your analysis comprehensive yet readable. Always end with thoughtful follow-up questions that encourage deeper exploration of the topic.\n\nRemember: Provide university-level depth in your image analysis while maintaining clarity and accessibility."
                }
            ];

            // Add conversation history for context (limit to recent messages)
            const recentHistory = conversationHistory.slice(-15); // Fewer messages for image requests due to token limits
            // Filter out previous images to save tokens, keep only text
            const textOnlyHistory = recentHistory.filter(msg => 
                typeof msg.content === 'string' || 
                (Array.isArray(msg.content) && msg.content.some(item => item.type === 'text'))
            );
            messages.push(...textOnlyHistory);

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
                    max_tokens: 2500,
                    temperature: 0.8,
                });

                return response.choices[0].message.content.trim();
            } catch (visionError) {
                console.log('GPT-4 Vision not available, trying alternative models...');
                
                // Try GPT-4 Turbo with Vision
                try {
                    const response = await openai.chat.completions.create({
                        model: "gpt-4o",
                        messages: messages,
                        max_tokens: 2500,
                        temperature: 0.8,
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