// Sample configuration file for emiAI Chatbot
// Copy this file to 'config.js' if you prefer file-based config.
// Recommended: set OPENAI_API_KEY as an environment variable instead of storing it in a file.

const config = {
    // Get your API key from: https://platform.openai.com/api-keys
    // If not set via env var, place it here. Leave empty by default.
    openaiApiKey: '',
    
    // Server configuration
    port: 3000,
    
    // Optional: Add other configuration options here
    // maxTokens: 150,
    // temperature: 0.7,
};

module.exports = config;
