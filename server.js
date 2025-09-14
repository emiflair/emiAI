process.env["NODE_TLS_REJECT_UNAUTHORIZED"]=0;
const express = require('express');
const path = require('path');
const { OpenAIAPI } = require('./openai');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/getChatbotResponse', async (req, res) => {
    try {
        const { userMessage, hasImage, imageData, selectedModel } = req.body;

        let chatbotResponse;
        
        if (hasImage && imageData) {
            // Use OpenAI Vision API to analyze the image
            chatbotResponse = await OpenAIAPI.generateResponseWithImage(userMessage, imageData, selectedModel);
        } else {
            // Use regular text-only API
            chatbotResponse = await OpenAIAPI.generateResponse(userMessage, selectedModel);
        }

        // Send the response back to the client
        res.json({ chatbotResponse });
    } catch (error) {
        console.error('Error in getChatbotResponse:', error);
        res.status(500).json({ 
            chatbotResponse: 'Sorry, I encountered an error while processing your request. Please try again.' 
        });
    }
});
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Access from iPhone: http://192.168.0.133:${port}`);
    console.log(`Local access: http://localhost:${port}`);
});