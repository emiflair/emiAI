# emiAI - Advanced AI ChatBot

A modern, responsive AI chatbot with beautiful light/dark themes, voice capabilities, and multiple AI models.

![emiAI Screenshot](https://via.placeholder.com/800x400/000000/FFFFFF?text=emiAI+ChatBot)

## ✨ Features

- 🎨 **Beautiful UI/UX** - Clean, modern design with smooth animations
- 🌓 **Light/Dark Theme** - Toggle between elegant light and dark modes
- 🤖 **Multiple AI Models** - Support for different AI models (emy 3.0, emy pro)
- 🎙️ **Voice Input/Output** - Speak to the AI and hear responses
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- ⚡ **Fast & Lightweight** - Optimized for performance
- 🔧 **Customizable** - Adjustable creativity levels and response lengths

## 🚀 Quick Start

### Option 1: Docker (Recommended) 🐳

**Prerequisites:**
- Docker and Docker Compose

**Installation:**
1. **Clone the repository**
   ```bash
   git clone https://github.com/emiflair/emiAI.git
   cd emiAI
   ```

2. **Run the automated setup**
   ```bash
   ./docker-setup.sh
   ```

3. **Add your OpenAI API key**
   - The script will create `config.js` from the template
   - Edit `config.js` and add your OpenAI API key
   - Run `./docker-setup.sh` again

4. **Access your chatbot**
   ```
   http://localhost:3000
   ```

### Option 2: Manual Installation

**Prerequisites:**
- Node.js (v14 or higher)
- npm or yarn

**Installation:**

1. **Clone the repository**
   ```bash
   git clone https://github.com/emiflair/emiAI.git
   cd emiAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `config.js` file in the root directory:
   ```javascript
   const config = {
       openaiApiKey: 'your-openai-api-key-here',
       port: 3000
   };

   module.exports = config;
   ```

   **⚠️ Important:** You need an OpenAI API key to use this chatbot. Get one from [OpenAI's website](https://platform.openai.com/api-keys).

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📋 Project Structure

```
emiAI/
├── server.js          # Main server file
├── config.js          # Configuration (API keys, etc.)
├── openai.js          # OpenAI API integration
├── package.json       # Dependencies and scripts
├── public/
│   ├── index.html     # Main HTML file
│   ├── style.css      # All styling
│   ├── main.js        # Frontend JavaScript
│   ├── chat.png       # Chat icon
│   └── manifest.json  # PWA manifest
└── README.md          # This file
```

## 🔧 Configuration

### API Keys
- Edit `config.js` to add your OpenAI API key
- Optionally configure the server port (default: 3000)

### Customization
- **Themes**: Modify CSS variables in `public/style.css`
- **AI Models**: Update model options in `public/main.js`
- **Voice Settings**: Configure voice parameters in the settings panel

## 📱 Usage

1. **Start Chatting**: Type your message in the input field
2. **Voice Input**: Click the microphone icon to speak
3. **Settings**: Click the gear icon to customize:
   - Toggle light/dark theme
   - Select AI model
   - Adjust response length
   - Configure creativity level
   - Set up voice preferences

## 🎨 Themes

### Light Theme
- Clean white backgrounds with subtle gray accents
- Perfect for daytime use
- High contrast for excellent readability

### Dark Theme
- Elegant dark backgrounds with layered grays
- Easy on the eyes for night use
- Maintains visual hierarchy and depth

## 🔊 Voice Features

- **Voice Input**: Speak naturally to the AI
- **Voice Output**: Hear AI responses read aloud
- **Multiple Voices**: Choose from different voice options
- **Customizable**: Adjust speech rate and pitch

## 🤖 AI Models

- **emy 3.0**: Fast and efficient responses
- **emy pro**: Advanced reasoning and detailed answers

## 🛠️ Development

### Running in Development Mode
```bash
# Start the server with auto-restart
npm run dev
```

### Available Scripts
- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-restart
- `npm test` - Run tests (if any)

## 📱 Mobile Support

The chatbot is fully responsive and works great on:
- 📱 Mobile phones
- 📱 Tablets
- 💻 Desktop computers
- 🖥️ Large screens

## 🔒 Security

- API keys are stored server-side only
- No sensitive data is logged
- HTTPS ready for production

## 🚀 Deployment

### Docker Deployment 🐳

#### Development/Testing
```bash
# Build and run locally
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

#### Production Deployment
```bash
# Build for production
docker build -t emiai-chatbot:latest .

# Run with custom configuration
docker run -d \
  --name emiai-chatbot \
  -p 3000:3000 \
  -v $(pwd)/config.js:/app/config.js:ro \
  --restart unless-stopped \
  emiai-chatbot:latest
```

### Local Network Access
The server automatically provides local network access:
- Local: `http://localhost:3000`
- Network: `http://[your-ip]:3000`

### Production Deployment
1. Set up your production server
2. Configure environment variables
3. Run `npm start`
4. Set up reverse proxy (nginx recommended)
5. Enable HTTPS with SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. **Check your API key** - Make sure it's valid and has credits
2. **Verify Node.js version** - Ensure you're using Node.js v14+
3. **Check the console** - Look for error messages in browser/terminal
4. **Network issues** - Ensure you have internet connectivity

## 🙏 Acknowledgments

- OpenAI for providing the AI models
- Font Awesome for the beautiful icons
- The open-source community for inspiration

---

**Made with ❤️ by [emiflair](https://github.com/emiflair)**

⭐ If you found this project helpful, please give it a star!
