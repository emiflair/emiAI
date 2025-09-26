#!/bin/bash

echo "🐳 emiAI Docker Setup Script"
echo "============================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if config.js exists
if [ ! -f "config.js" ]; then
    echo "⚠️  Configuration needed:"
    echo "   Creating config.js from template..."
    
    if [ -f "config.sample.js" ]; then
        cp config.sample.js config.js
        echo "✅ config.js created from config.sample.js"
        echo ""
        echo "🔑 IMPORTANT: Edit config.js and add your OpenAI API key before running!"
        echo "   Get an API key from: https://platform.openai.com/api-keys"
        echo ""
        echo "📝 To edit config.js:"
        echo "   nano config.js"
        echo "   # or use your preferred editor"
        echo ""
        echo "After adding your API key, run: ./docker-setup.sh"
        exit 0
    else
        echo "❌ config.sample.js not found!"
        exit 1
    fi
fi

# Check if config.js has a real API key
if grep -q "your-openai-api-key-here" config.js; then
    echo "⚠️  Please add your real OpenAI API key to config.js"
    echo "   Edit config.js and replace 'your-openai-api-key-here' with your actual API key"
    echo "   Get an API key from: https://platform.openai.com/api-keys"
    exit 1
fi

echo "✅ Configuration file ready"
echo ""

# Build and run with Docker Compose
echo "🔨 Building Docker image..."
docker-compose build

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully"
else
    echo "❌ Failed to build Docker image"
    exit 1
fi

echo ""
echo "🚀 Starting emiAI chatbot..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo "✅ emiAI chatbot is now running!"
    echo ""
    echo "🌐 Access your chatbot at:"
    echo "   Local: http://localhost:3000"
    echo "   Network: http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    echo "📊 Useful Docker commands:"
    echo "   docker-compose logs -f    # View logs"
    echo "   docker-compose stop       # Stop the container"
    echo "   docker-compose restart    # Restart the container"
    echo "   docker-compose down       # Stop and remove container"
    echo ""
    echo "💡 The chatbot will automatically restart if it crashes"
else
    echo "❌ Failed to start emiAI chatbot"
    exit 1
fi
