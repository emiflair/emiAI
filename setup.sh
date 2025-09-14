#!/bin/bash

echo "🚀 Setting up emiAI Chatbot..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v14+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js v14+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check if config.js exists
if [ ! -f "config.js" ]; then
    echo ""
    echo "⚠️  Configuration needed:"
    echo "   1. Copy config.sample.js to config.js"
    echo "   2. Add your OpenAI API key to config.js"
    echo "   3. Get an API key from: https://platform.openai.com/api-keys"
    echo ""
    echo "💡 Quick setup:"
    echo "   cp config.sample.js config.js"
    echo "   # Then edit config.js with your API key"
    echo ""
else
    echo "✅ Configuration file found"
fi

echo ""
echo "🎉 Setup complete! To start the chatbot:"
echo "   npm start"
echo ""
echo "   Then open: http://localhost:3000"
echo ""
