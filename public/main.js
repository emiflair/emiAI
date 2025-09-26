// ===== SPLASH SCREEN CONTROLLER =====
class SplashScreen {
    constructor() {
        this.splashElement = document.getElementById('splash-screen');
        this.minimumDisplayTime = 2000; // Minimum 2 seconds
        this.startTime = Date.now();
        this.init();
    }

    init() {
        // Hide splash screen after minimum time and when page is fully loaded
        const hideAfterDelay = () => {
            const elapsedTime = Date.now() - this.startTime;
            const remainingTime = Math.max(0, this.minimumDisplayTime - elapsedTime);
            
            setTimeout(() => {
                this.hideSplash();
            }, remainingTime);
        };

        // Wait for page to be fully loaded
        if (document.readyState === 'complete') {
            hideAfterDelay();
        } else {
            window.addEventListener('load', hideAfterDelay);
        }

        // Also hide after CSS animation completes (fallback)
        setTimeout(() => {
            this.hideSplash();
        }, 3200);
    }

    hideSplash() {
        if (this.splashElement) {
            this.splashElement.style.pointerEvents = 'none';
            setTimeout(() => {
                this.splashElement.style.display = 'none';
            }, 500);
        }
    }
}

// Initialize splash screen immediately
document.addEventListener('DOMContentLoaded', () => {
    new SplashScreen();
});

// Enhanced ChatBot with comprehensive features
class ChatBot {
    constructor() {
        this.currentEditingMessage = null;
        this.chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
        this.settings = JSON.parse(localStorage.getItem('chatSettings')) || {
            theme: 'light', // Always use light theme
            model: 'gpt-3.5-turbo',
            voiceEnabled: true, // Enable voice by default
            autoSpeak: false,
            language: 'en-US',
            customPrompt: ''
        };
        this.conversations = JSON.parse(localStorage.getItem('conversations')) || [];
        this.currentConversationId = null;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.searchResults = [];
        this.messageCounter = 0;
        this.selectedImage = null;
        this.selectedImageBase64 = null;
        this.messageHistory = [];
        
        // Enhanced conversation memory system
        this.conversationHistory = JSON.parse(localStorage.getItem('conversationHistory')) || [];
        this.currentSessionId = this.generateSessionId();
        this.maxHistoryLength = 50; // Maximum messages to keep in memory
        
        // Bind the settings outside click handler to maintain proper reference
        this.boundSettingsOutsideClick = this.handleSettingsOutsideClick.bind(this);
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applyTheme();
        this.loadConversations();
        this.setupVoice();
        this.setupContextMenu();
        this.restoreLastConversation();
        this.updateSendButtonState();
        
        // Load conversation memory
        this.loadConversationHistory();
        
        // Log memory status quietly (no popup notification)
        const stats = this.getConversationStats();
        if (stats.totalMessages > 0) {
            console.log(`🧠 Memory loaded: ${stats.totalMessages} messages from previous sessions`);
            // Show memory indicator in conversation status instead of popup
            this.updateConversationStatus();
        }
    }

    setupEventListeners() {
        // Basic chat functionality
        const sendBtn = document.getElementById('send-btn');
        const chatInput = document.getElementById('user-input');
        
        if (sendBtn) sendBtn.addEventListener('click', () => this.sendMessage());
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            chatInput.addEventListener('input', () => this.updateSendButtonState());
        }

        // Single theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
                this.updateToggleButton();
            });
        }
        
        // Settings panel
        const settingsBtn = document.getElementById('settings-btn');
        const closeSettings = document.getElementById('close-settings-btn');
        if (settingsBtn) settingsBtn.addEventListener('click', () => this.toggleSettings());
        if (closeSettings) closeSettings.addEventListener('click', () => this.toggleSettings());
        
        // Search functionality with multiple event binding approaches
        const searchBtn = document.getElementById('search-btn');
        const closeSearch = document.getElementById('search-close-btn');
        const searchInput = document.getElementById('search-input');
        
        if (searchBtn) {
            // Try multiple ways to ensure the event listener works
            searchBtn.onclick = () => this.toggleSearch();
            searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSearch();
            });
        }
        if (closeSearch) {
            closeSearch.onclick = () => this.toggleSearch();
            closeSearch.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSearch();
            });
        }
        if (searchInput) searchInput.addEventListener('input', (e) => this.performSearch(e.target.value));
        
        // Voice recording
        const voiceBtn = document.getElementById('voice-record-btn');
        if (voiceBtn) voiceBtn.addEventListener('click', () => this.toggleVoiceRecording());
        
        // Enhanced message composer features
        this.setupMessageComposer();
        
        // Export functionality
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportConversation());
        
        // New chat functionality
        const newChatBtn = document.getElementById('new-chat-btn');
        if (newChatBtn) newChatBtn.addEventListener('click', () => this.showNewChatModal());
        
        // Clear chat functionality  
        const clearBtn = document.getElementById('clear-btn');
        if (clearBtn) clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the chat history?')) {
                this.clearChat();
            }
        });
        
        // Legacy image upload support - now handled by plus button menu
        const imageInput = document.getElementById('image-input');
        const removeImageBtn = document.getElementById('remove-image-btn');
        
        if (imageInput) imageInput.addEventListener('change', (e) => this.handleImageSelect(e));
        if (removeImageBtn) removeImageBtn.addEventListener('click', () => this.removeSelectedImage());
        
        // AI model selection
        const aiModelSelect = document.getElementById('ai-model');
        if (aiModelSelect) {
            aiModelSelect.addEventListener('change', () => {
                this.updateCurrentModel();
                this.saveSettings();
            });
            // Initialize model display
            this.updateCurrentModel();
        }
        
        // Quick model selector dropdown
        const modelSelector = document.getElementById('current-model');
        const modelDropdown = document.getElementById('model-dropdown');
        
        if (modelSelector && modelDropdown) {
            modelSelector.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleModelDropdown();
            });
            
            // Handle model option clicks
            const modelOptions = modelDropdown.querySelectorAll('.model-option');
            modelOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const selectedModel = option.dataset.model;
                    this.selectModel(selectedModel);
                    this.hideModelDropdown();
                });
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                this.hideModelDropdown();
            });
        }
        
        // Voice settings
        const voiceInputBtn = document.getElementById('voice-input-btn');
        const voiceOutputBtn = document.getElementById('voice-output-btn');
        
        if (voiceInputBtn) voiceInputBtn.addEventListener('click', () => {
            this.settings.voiceEnabled = !this.settings.voiceEnabled;
            voiceInputBtn.classList.toggle('active', this.settings.voiceEnabled);
            this.saveSettings();
        });
        
        if (voiceOutputBtn) voiceOutputBtn.addEventListener('click', () => {
            this.settings.autoSpeak = !this.settings.autoSpeak;
            voiceOutputBtn.classList.toggle('active', this.settings.autoSpeak);
            this.saveSettings();
        });
        
        // Memory management buttons
        const clearMemoryBtn = document.getElementById('clear-memory-btn');
        const memoryStatsBtn = document.getElementById('memory-stats-btn');
        
        if (clearMemoryBtn) clearMemoryBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all conversation memory? This cannot be undone.')) {
                this.clearConversationHistory();
                this.updateMemoryDisplay();
            }
        });
        
        if (memoryStatsBtn) memoryStatsBtn.addEventListener('click', () => {
            this.showMemoryStats();
        });
        
        // New chat modal buttons
        const closeNewChatBtn = document.getElementById('close-new-chat');
        const continueCurrent = document.getElementById('continue-current');
        const saveAndNew = document.getElementById('save-and-new');
        const clearAndNew = document.getElementById('clear-and-new');
        
        if (closeNewChatBtn) closeNewChatBtn.addEventListener('click', () => this.hideNewChatModal());
        if (continueCurrent) continueCurrent.addEventListener('click', () => this.hideNewChatModal());
        if (saveAndNew) saveAndNew.addEventListener('click', () => this.saveAndStartNew());
        if (clearAndNew) clearAndNew.addEventListener('click', () => this.clearAndStartNew());
        
        // Sidebar toggle for mobile
        this.createSidebarToggle();
        
        // Close overlays on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllOverlays();
            }
        });
        
        // Responsive handling
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
    }

    clearChat() {
        const chatLog = document.getElementById('chat-log');
        if (chatLog) {
            const messages = chatLog.querySelectorAll('.message');
            messages.forEach(message => {
                message.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {  
                    message.remove();
                }, 300);
            });
            
            // Reset counters and history
            this.messageCounter = 0;
            this.messageHistory = [];
            
            // Clear conversation memory but keep in localStorage for later sessions
            this.conversationHistory = [];
            this.currentSessionId = this.generateSessionId();
            
            // Update conversation status
            setTimeout(() => {
                this.updateConversationStatus();
            }, 400);
            
            // Show confirmation
            this.showNotification('Chat cleared! Starting fresh conversation.', 'success');
        }
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    createSidebarToggle() {
        const existingToggle = document.querySelector('.sidebar-toggle');
        if (existingToggle) return;

        const sidebarToggle = document.createElement('button');
        sidebarToggle.className = 'sidebar-toggle hidden';
        sidebarToggle.innerHTML = '<i class="fas fa-bars"></i>';
        sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        document.body.appendChild(sidebarToggle);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        
        // Force logo color update with multiple selectors
        const botNameSelectors = ['.bot-name', 'h2.bot-name', '#bot-name-logo'];
        botNameSelectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                if (this.settings.theme === 'dark') {
                    element.style.setProperty('color', '#ffffff', 'important');
                    element.style.setProperty('visibility', 'visible', 'important');
                    element.style.setProperty('opacity', '1', 'important');
                } else {
                    element.style.setProperty('color', '#000000', 'important');
                    element.style.setProperty('visibility', 'visible', 'important');
                    element.style.setProperty('opacity', '1', 'important');
                }
            }
        });
        
        // Update the toggle button
        this.updateToggleButton();
    }

    updateToggleButton() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            const text = toggleBtn.querySelector('span');
            
            if (this.settings.theme === 'dark') {
                icon.className = 'fas fa-sun';
                text.textContent = 'Light Mode';
            } else {
                icon.className = 'fas fa-moon';
                text.textContent = 'Dark Mode';
            }
        }
    }

    toggleTheme() {
        this.settings.theme = this.settings.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveSettings();
    }

    toggleSettings() {
        const panel = document.getElementById('settings-panel');
        if (panel) {
            const isOpening = !panel.classList.contains('open');
            
            if (isOpening) {
                // Opening the panel
                panel.classList.add('open');
                this.loadSettingsForm();
                // Add click outside to close
                setTimeout(() => {
                    document.addEventListener('click', this.boundSettingsOutsideClick);
                }, 100);
            } else {
                // Closing the panel
                this.closeSettingsPanel();
            }
        }
    }

    closeSettingsPanel() {
        const panel = document.getElementById('settings-panel');
        if (panel) {
            panel.classList.remove('open');
            document.removeEventListener('click', this.boundSettingsOutsideClick);
        }
    }

    handleSettingsOutsideClick(event) {
        const panel = document.getElementById('settings-panel');
        const settingsContent = panel?.querySelector('.settings-content');
        
        if (panel && panel.classList.contains('open')) {
            // If click is outside the settings content, close the panel
            if (!settingsContent?.contains(event.target)) {
                this.closeSettingsPanel();
            }
        }
    }

    loadSettingsForm() {
        // Update the toggle button to reflect current theme
        this.updateToggleButton();

        // Load AI model setting
        const modelSelect = document.getElementById('ai-model');
        if (modelSelect) modelSelect.value = this.settings.model;
        
        // Load other settings if elements exist
        const elements = {
            voiceToggle: document.getElementById('voice-input-btn'),
            autoSpeakToggle: document.getElementById('voice-output-btn'),
            languageSelect: document.getElementById('language-select'),
            customPrompt: document.getElementById('custom-prompt')
        };

        // Update voice button states
        if (elements.voiceToggle) {
            elements.voiceToggle.classList.toggle('active', this.settings.voiceEnabled);
        }
        if (elements.autoSpeakToggle) {
            elements.autoSpeakToggle.classList.toggle('active', this.settings.autoSpeak);
        }
        
        // Update memory display
        this.updateMemoryDisplay();
    }

    saveSettings() {
        // Get AI model selection
        const modelSelect = document.getElementById('ai-model');
        if (modelSelect) {
            this.settings.model = modelSelect.value;
        }
        
        localStorage.setItem('chatSettings', JSON.stringify(this.settings));
        this.applyTheme();
        this.setupVoice();
    }

    toggleSearch() {
        const container = document.getElementById('search-container');
        if (container) {
            container.classList.toggle('hidden');
            
            if (!container.classList.contains('hidden')) {
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    setTimeout(() => searchInput.focus(), 100);
                }
            } else {
                this.clearSearch();
            }
        }
    }

    updateSendButtonState() {
        const chatInput = document.getElementById('user-input');
        const sendBtn = document.getElementById('send-btn');
        
        if (!chatInput || !sendBtn) return;
        
        const hasText = chatInput.value.trim().length > 0;
        const hasImage = this.selectedImage !== null;
        const canSend = hasText || hasImage;
        
        sendBtn.style.opacity = canSend ? '1' : '0.5';
        sendBtn.style.transform = canSend ? 'scale(1)' : 'scale(0.9)';
    }

    sendMessage() {
        const chatInput = document.getElementById('user-input');
        if (!chatInput) return;

        if (this.currentEditingMessage) {
            this.updateMessage();
            return;
        }
        
        const message = chatInput.value.trim();
        const hasImage = this.selectedImage !== null;
        
        if (!message && !hasImage) return;
        
        // Immediate UI feedback
        const sendBtn = document.getElementById('send-btn');
        if (sendBtn) {
            sendBtn.style.opacity = '0.6';
            sendBtn.disabled = true;
        }
        
        const messageData = {
            text: message,
            image: hasImage ? this.selectedImageBase64 : null,
            hasImage: hasImage
        };
        
        // Clear input immediately for better UX
        chatInput.value = '';
        this.removeSelectedImage();
        this.updateSendButtonState();
        
        // Re-enable send button
        if (sendBtn) {
            setTimeout(() => {
                sendBtn.disabled = false;
                sendBtn.style.opacity = '';
            }, 100);
        }
        
        this.displayMessage('user', messageData);
        chatInput.focus();
        
        this.getChatbotResponse(messageData);
    }

    handleImageSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processImageFile(file);
        }
    }

    processImageFile(file) {
        if (file.size > 10 * 1024 * 1024) {
            alert('Image size should be less than 10MB.');
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }
        
        this.selectedImage = file;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.compressAndPreviewImage(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    compressAndPreviewImage(dataUrl) {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            let { width, height } = img;
            const maxSize = 1024;
            
            if (width > height) {
                if (width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            this.selectedImageBase64 = canvas.toDataURL('image/jpeg', 0.8);
            
            const previewImage = document.getElementById('preview-image');
            const imagePreviewContainer = document.getElementById('image-preview-container');
            
            if (previewImage && imagePreviewContainer) {
                previewImage.src = this.selectedImageBase64;
                imagePreviewContainer.classList.remove('hidden');
            }
            
            this.updateSendButtonState();
        };
        img.src = dataUrl;
    }

    removeSelectedImage() {
        this.selectedImage = null;
        this.selectedImageBase64 = null;
        
        const previewImage = document.getElementById('preview-image');
        const imagePreviewContainer = document.getElementById('image-preview-container');
        const imageInput = document.getElementById('image-input');
        
        if (previewImage) previewImage.src = '';
        if (imagePreviewContainer) imagePreviewContainer.classList.add('hidden');
        if (imageInput) imageInput.value = '';
        
        this.updateSendButtonState();
        
        const chatInput = document.getElementById('user-input');
        if (chatInput) chatInput.focus();
    }

    // Enhanced message formatting with fancy fonts, emojis, and syntax highlighting
    enhanceAIMessage(message) {
        // First, handle code blocks with syntax highlighting
        message = message.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || 'javascript';
            const highlightedCode = this.highlightCode(code.trim(), language);
            return `<div class="ai-code-container">
                <div class="ai-code-header">
                    <span class="ai-code-language">${language.toUpperCase()}</span>
                    <button class="ai-code-copy" onclick="chatBot.copyCode(\`${code.trim().replace(/`/g, '\\`')}\`)">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                <pre class="ai-code-block"><code class="language-${language}">${highlightedCode}</code></pre>
            </div>`;
        });

        // Handle inline code
        message = message.replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>');

        // Enhance headers with fancy styling
        message = message.replace(/^### (.*$)/gm, '<h3 class="ai-heading-3">🔸 $1</h3>');
        message = message.replace(/^## (.*$)/gm, '<h2 class="ai-heading-2">✨ $1</h2>');
        message = message.replace(/^# (.*$)/gm, '<h1 class="ai-heading-1">🌟 $1</h1>');

        // Enhance bullet points with fancy icons
        message = message.replace(/^- (.*$)/gm, '<div class="ai-bullet-point">🔹 $1</div>');
        message = message.replace(/^\* (.*$)/gm, '<div class="ai-bullet-point">⭐ $1</div>');
        message = message.replace(/^\+ (.*$)/gm, '<div class="ai-bullet-point">➕ $1</div>');

        // Enhance numbered lists
        message = message.replace(/^(\d+)\. (.*$)/gm, '<div class="ai-numbered-item"><span class="ai-number">$1</span> $2</div>');

        // Enhance bold and italic text
        message = message.replace(/\*\*(.*?)\*\*/g, '<strong class="ai-bold">$1</strong>');
        message = message.replace(/\*(.*?)\*/g, '<em class="ai-italic">$1</em>');

        // Add special formatting for key phrases
        message = message.replace(/(Key Features?|Important|Note|Remember|Tips?|Best Practices?)/gi, 
            '<span class="ai-highlight-keyword">💡 $1</span>');
        
        message = message.replace(/(Examples?|For instance|Such as)/gi, 
            '<span class="ai-example-keyword">📝 $1</span>');

        // Convert line breaks to proper HTML
        message = message.replace(/\n/g, '<br>');

        return message;
    }

    // Advanced syntax highlighting function
    highlightCode(code, language) {
        const patterns = {
            javascript: {
                keywords: /\b(function|const|let|var|if|else|for|while|return|class|import|export|async|await|try|catch)\b/g,
                strings: /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g,
                comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
                numbers: /\b\d+\.?\d*\b/g,
                operators: /[+\-*/%=<>!&|]+/g
            },
            python: {
                keywords: /\b(def|class|if|elif|else|for|while|return|import|from|try|except|with|as|pass|break|continue)\b/g,
                strings: /(["'])((?:\\.|(?!\1)[^\\])*?)\1/g,
                comments: /(#.*$)/gm,
                numbers: /\b\d+\.?\d*\b/g,
                operators: /[+\-*/%=<>!&|]+/g
            },
            html: {
                tags: /(<\/?[^>]+>)/g,
                attributes: /(\w+)=/g,
                strings: /(["'])((?:\\.|(?!\1)[^\\])*?)\1/g
            },
            css: {
                selectors: /([.#]?[\w-]+)\s*\{/g,
                properties: /([\w-]+)\s*:/g,
                values: /:\s*([^;]+);/g,
                comments: /(\/\*[\s\S]*?\*\/)/g
            }
        };

        let highlighted = code;
        const langPatterns = patterns[language] || patterns.javascript;

        // Apply syntax highlighting
        if (langPatterns.keywords) {
            highlighted = highlighted.replace(langPatterns.keywords, '<span class="ai-code-keyword">$1</span>');
        }
        if (langPatterns.strings) {
            highlighted = highlighted.replace(langPatterns.strings, '<span class="ai-code-string">$1$2$1</span>');
        }
        if (langPatterns.comments) {
            highlighted = highlighted.replace(langPatterns.comments, '<span class="ai-code-comment">$1</span>');
        }
        if (langPatterns.numbers) {
            highlighted = highlighted.replace(langPatterns.numbers, '<span class="ai-code-number">$1</span>');
        }
        if (langPatterns.operators) {
            highlighted = highlighted.replace(langPatterns.operators, '<span class="ai-code-operator">$1</span>');
        }

        return highlighted;
    }

    displayMessage(sender, messageData) {
        const chatLog = document.getElementById('chat-log');
        if (!chatLog) return;

        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        
        // Add timestamp
        const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        if (sender === 'user') {
            this.messageCounter++;
            messageElement.setAttribute('data-message-id', this.messageCounter);
            
            this.messageHistory[this.messageCounter] = {
                text: typeof messageData === 'string' ? messageData : messageData.text,
                image: typeof messageData === 'string' ? null : messageData.image,
                hasImage: typeof messageData === 'string' ? false : messageData.hasImage,
                timestamp: timestamp
            };
        }
        
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        
        if (typeof messageData === 'string') {
            let formattedMessage;
            if (sender === 'chatbot') {
                // Apply enhanced formatting for AI messages
                formattedMessage = this.enhanceAIMessage(messageData);
                messageContent.classList.add('ai-enhanced-message');
            } else {
                // Simple formatting for user messages
                formattedMessage = messageData.replace(/\n/g, '<br>');
            }
            messageContent.innerHTML = formattedMessage;
        } else {
            if (messageData.text) {
                const textDiv = document.createElement('div');
                textDiv.classList.add('message-text');
                let formattedMessage;
                if (sender === 'chatbot') {
                    // Apply enhanced formatting for AI messages
                    formattedMessage = this.enhanceAIMessage(messageData.text);
                    textDiv.classList.add('ai-enhanced-message');
                } else {
                    // Simple formatting for user messages
                    formattedMessage = messageData.text.replace(/\n/g, '<br>');
                }
                textDiv.innerHTML = formattedMessage;
                messageContent.appendChild(textDiv);
            }
            
            if (messageData.hasImage && messageData.image) {
                const imageDiv = document.createElement('div');
                imageDiv.classList.add('message-image-container');
                const img = document.createElement('img');
                img.src = messageData.image;
                img.classList.add('message-image');
                img.alt = 'Uploaded image';
                img.onclick = () => window.open(messageData.image, '_blank');
                imageDiv.appendChild(img);
                messageContent.appendChild(imageDiv);
            }
        }
        
        messageElement.appendChild(messageContent);
        
        // Add timestamp and copy button below message
        const messageFooter = document.createElement('div');
        messageFooter.classList.add('message-footer');
        
        if (sender === 'user') {
            // For user messages: copy button first, then timestamp
            const copyButton = document.createElement('button');
            copyButton.classList.add('copy-btn');
            copyButton.innerHTML = '<i class="fas fa-copy"></i>';
            copyButton.title = 'Copy message';
            copyButton.onclick = () => this.copyMessage(messageElement);
            
            const timestampSpan = document.createElement('span');
            timestampSpan.classList.add('message-timestamp');
            timestampSpan.textContent = timestamp;
            
            messageFooter.appendChild(copyButton);
            messageFooter.appendChild(timestampSpan);
        } else {
            // For AI messages: timestamp first, then copy button
            const timestampSpan = document.createElement('span');
            timestampSpan.classList.add('message-timestamp');
            timestampSpan.textContent = timestamp;
            
            const copyButton = document.createElement('button');
            copyButton.classList.add('copy-btn');
            copyButton.innerHTML = '<i class="fas fa-copy"></i>';
            copyButton.title = 'Copy message';
            copyButton.onclick = () => this.copyMessage(messageElement);
            
            messageFooter.appendChild(timestampSpan);
            messageFooter.appendChild(copyButton);
        }
        
        messageElement.appendChild(messageFooter);
        
        if (sender === 'user') {
            const editButton = document.createElement('button');
            editButton.classList.add('edit-btn');
            editButton.innerHTML = '<i class="fas fa-edit"></i>';
            editButton.title = 'Edit message';
            editButton.onclick = () => this.editMessage(this.messageCounter);
            
            const messageActions = document.createElement('div');
            messageActions.classList.add('message-actions');
            messageActions.appendChild(editButton);
            messageElement.appendChild(messageActions);
        }
        
        chatLog.appendChild(messageElement);
        this.scrollToBottom();
        
        // Update conversation status
        this.updateConversationStatus();
        
        requestAnimationFrame(() => {
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateY(20px)';
            messageElement.style.transition = 'all 0.3s ease';
            
            requestAnimationFrame(() => {
                messageElement.style.opacity = '1';
                messageElement.style.transform = 'translateY(0)';
            });
        });
    }

    showTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.classList.remove('hidden');
            // Add immediate visual feedback
            typingIndicator.style.opacity = '0';
            typingIndicator.style.transform = 'translateY(10px)';
            
            requestAnimationFrame(() => {
                typingIndicator.style.transition = 'all 0.2s ease';
                typingIndicator.style.opacity = '1';
                typingIndicator.style.transform = 'translateY(0)';
            });
            
            this.scrollToBottom();
        }
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.classList.add('hidden');
        }
    }

    scrollToBottom() {
        const chatLog = document.getElementById('chat-log');
        if (chatLog) {
            requestAnimationFrame(() => {
                chatLog.scrollTop = chatLog.scrollHeight;
            });
        }
    }

    getChatbotResponse(messageData) {
        const aiModelSelect = document.getElementById('ai-model');
        const selectedModel = aiModelSelect ? aiModelSelect.value : 'emy-pro';
        
        // Add user message to conversation history
        this.addToConversationHistory('user', messageData.text || '');
        
        // Show faster, more responsive typing indicator
        this.showTypingIndicator();
        
        const requestData = {
            userMessage: messageData.text || '',
            hasImage: messageData.hasImage || false,
            imageData: messageData.image || null,
            selectedModel: selectedModel,
            customPrompt: this.settings.customPrompt,
            conversationHistory: this.conversationHistory // Include conversation history
        };
        
        // Start the request immediately with optimized settings
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        fetch('/getChatbotResponse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
            signal: controller.signal,
            // Add performance optimizations
            keepalive: true,
            cache: 'no-cache'
        })
        .then(response => {
            clearTimeout(timeoutId); // Clear the timeout
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            this.hideTypingIndicator();
            
            // Add AI response to conversation history
            this.addToConversationHistory('assistant', data.chatbotResponse);
            
            // Faster response display - reduce delay
            setTimeout(() => {
                this.displayMessage('chatbot', data.chatbotResponse);
                
                if (this.settings.autoSpeak && this.settings.voiceEnabled) {
                    this.speakText(data.chatbotResponse);
                }
                
                // Save conversation history to localStorage
                this.saveConversationHistory();
            }, 200); // Reduced from default delay
        })
        .catch(error => {
            clearTimeout(timeoutId); // Clear timeout on error too
            console.error('Error:', error);
            this.hideTypingIndicator();
            
            setTimeout(() => {
                this.displayMessage('chatbot', 'Sorry, I encountered an error. Please try again later.');
            }, 200);
        });
    }

    editMessage(messageId) {
        const messageData = this.messageHistory[messageId];
        if (!messageData) return;
        
        const chatInput = document.getElementById('user-input');
        if (!chatInput) return;
        
        chatInput.value = messageData.text || '';
        
        if (messageData.hasImage && messageData.image) {
            this.selectedImageBase64 = messageData.image;
            const previewImage = document.getElementById('preview-image');
            const imagePreviewContainer = document.getElementById('image-preview-container');
            if (previewImage && imagePreviewContainer) {
                previewImage.src = messageData.image;
                imagePreviewContainer.classList.remove('hidden');
            }
        }
        
        this.currentEditingMessage = messageId;
        chatInput.focus();
        chatInput.setSelectionRange(chatInput.value.length, chatInput.value.length);
        this.updateSendButtonState();
    }

    copyMessage(messageElement) {
        const messageContent = messageElement.querySelector('.message-content');
        const textContent = messageContent.textContent || messageContent.innerText;
        
        navigator.clipboard.writeText(textContent).then(() => {
            // Show visual feedback
            const copyBtn = messageElement.querySelector('.copy-btn');
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            copyBtn.style.color = '#10b981';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalIcon;
                copyBtn.style.color = '';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy message:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        });
    }

    updateMessage() {
        if (!this.currentEditingMessage) return;
        
        const chatInput = document.getElementById('user-input');
        if (!chatInput) return;
        
        const message = chatInput.value.trim();
        const hasImage = this.selectedImage !== null || this.selectedImageBase64 !== null;
        
        if (!message && !hasImage) {
            this.currentEditingMessage = null;
            this.updateSendButtonState();
            return;
        }
        
        // Find and remove subsequent messages
        const originalMessageElement = document.querySelector(`[data-message-id="${this.currentEditingMessage}"]`);
        if (originalMessageElement) {
            let nextElement = originalMessageElement.nextElementSibling;
            while (nextElement) {
                const toRemove = nextElement;
                nextElement = nextElement.nextElementSibling;
                toRemove.remove();
            }
            
            // Update message data
            const messageData = {
                text: message,
                image: this.selectedImageBase64,
                hasImage: hasImage
            };
            
            this.messageHistory[this.currentEditingMessage] = messageData;
            this.updateMessageDisplay(originalMessageElement, messageData);
        }
        
        chatInput.value = '';
        this.removeSelectedImage();
        this.currentEditingMessage = null;
        this.updateSendButtonState();
        
        // When editing, we need to truncate conversation history to this point
        // to maintain accurate context
        const messageIndex = this.conversationHistory.findIndex(msg => 
            msg.role === 'user' && msg.content === this.messageHistory[this.currentEditingMessage].text
        );
        
        if (messageIndex !== -1) {
            // Remove everything after this message from conversation history
            this.conversationHistory = this.conversationHistory.slice(0, messageIndex);
        }
        
        this.showTypingIndicator();
        this.getChatbotResponse({
            text: message,
            image: this.selectedImageBase64,
            hasImage: hasImage
        });
    }

    updateMessageDisplay(messageElement, messageData) {
        const messageContent = messageElement.querySelector('.message-content');
        if (!messageContent) return;
        
        messageContent.innerHTML = '';
        
        if (messageData.text) {
            const textDiv = document.createElement('div');
            textDiv.classList.add('message-text');
            const formattedMessage = messageData.text.replace(/\n/g, '<br>');
            textDiv.innerHTML = formattedMessage;
            messageContent.appendChild(textDiv);
        }
        
        if (messageData.hasImage && messageData.image) {
            const imageDiv = document.createElement('div');
            imageDiv.classList.add('message-image-container');
            const img = document.createElement('img');
            img.src = messageData.image;
            img.classList.add('message-image');
            img.alt = 'Uploaded image';
            img.onclick = () => window.open(messageData.image, '_blank');
            imageDiv.appendChild(img);
            messageContent.appendChild(imageDiv);
        }
        
        messageElement.style.background = 'rgba(99, 102, 241, 0.1)';
        setTimeout(() => {
            messageElement.style.background = '';
            messageElement.style.transition = 'background 0.5s ease';
        }, 500);
    }

    // Additional methods for comprehensive features
    setupVoice() {
        // Check if speech recognition is supported
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            this.hideVoiceFeatures();
            return;
        }

        // Only set up speech recognition if voice is enabled in settings
        if (!this.settings.voiceEnabled) {
            return;
        }

        try {
            const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = this.settings.language;

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const chatInput = document.getElementById('user-input');
                if (chatInput) {
                    chatInput.value = transcript;
                    this.updateSendButtonState();
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopVoiceRecording();
                
                // Handle specific errors gracefully
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    this.showNotification('Microphone access denied. Please allow microphone access and try again.', 'warning');
                } else if (event.error === 'network') {
                    this.showNotification('Network error. Please check your connection and try again.', 'error');
                }
            };

            this.recognition.onend = () => {
                this.stopVoiceRecording();
            };
        } catch (error) {
            console.error('Speech recognition setup failed:', error);
            this.hideVoiceFeatures();
        }
    }
    
    hideVoiceFeatures() {
        const voiceBtn = document.getElementById('voice-record-btn');
        const voiceInputBtn = document.getElementById('voice-input-btn');
        const voiceOutputBtn = document.getElementById('voice-output-btn');
        
        // Keep the voice button visible but show it's not working
        if (voiceBtn) {
            voiceBtn.style.opacity = '0.6';
            voiceBtn.title = 'Voice recognition not supported in this browser. Try Chrome, Edge, or Safari.';
            // Don't disable it - let the user click and get a helpful message
        }
        if (voiceInputBtn) voiceInputBtn.style.opacity = '0.5';
        if (voiceOutputBtn) voiceOutputBtn.style.opacity = '0.5';
    }

    toggleVoiceRecording() {
        // Check if speech recognition is available
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            this.showNotification('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.', 'warning');
            return;
        }
        
        // Auto-enable voice if user clicks the button
        if (!this.settings.voiceEnabled) {
            this.settings.voiceEnabled = true;
            this.saveSettings();
            this.showNotification('Voice input enabled!', 'success');
        }

        // If recognition isn't set up yet, set it up
        if (!this.recognition) {
            this.setupVoice();
            if (!this.recognition) {
                this.showNotification('Speech recognition setup failed. Please try refreshing the page.', 'error');
                return;
            }
        }

        if (this.isRecording) {
            this.stopVoiceRecording();
        } else {
            this.startVoiceRecording();
        }
    }

    startVoiceRecording() {
        if (!this.recognition) return;

        try {
            this.recognition.start();
            this.isRecording = true;
            
            const voiceBtn = document.getElementById('voice-record-btn');
            if (voiceBtn) {
                voiceBtn.classList.add('recording');
                voiceBtn.title = 'Stop recording';
            }
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    }

    stopVoiceRecording() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
        }
        
        this.isRecording = false;
        const voiceBtn = document.getElementById('voice-record-btn');
        if (voiceBtn) {
            voiceBtn.classList.remove('recording');
            voiceBtn.title = 'Voice input';
        }
    }

    performSearch(query) {
        if (!query.trim()) {
            this.clearSearch();
            return;
        }
        
        const messages = document.querySelectorAll('.message');
        this.searchResults = [];
        
        messages.forEach((message, index) => {
            const content = message.querySelector('.message-content')?.textContent?.toLowerCase() || '';
            if (content.includes(query.toLowerCase())) {
                this.searchResults.push({ element: message, index });
                message.classList.add('search-highlight');
            } else {
                message.classList.remove('search-highlight');
            }
        });
        
        this.updateSearchResults();
    }

    updateSearchResults() {
        const resultsDiv = document.getElementById('searchResults');
        if (!resultsDiv) return;

        if (this.searchResults.length === 0) {
            resultsDiv.innerHTML = '<div class="search-result">No results found</div>';
        } else {
            resultsDiv.innerHTML = this.searchResults.map((result, index) => {
                const content = result.element.querySelector('.message-content')?.textContent || '';
                return `<div class="search-result" onclick="chatBot.scrollToSearchResult(${index})">
                    Result ${index + 1}: ${content.substring(0, 100)}...
                </div>`;
            }).join('');
        }
    }

    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');
        
        if (searchInput) searchInput.value = '';
        if (searchResults) searchResults.innerHTML = '';
        
        document.querySelectorAll('.search-highlight').forEach(el => {
            el.classList.remove('search-highlight', 'search-highlight-active');
        });
        this.searchResults = [];
    }

    handleFileUpload(event) {
        const files = event.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            
            if (file.type.startsWith('image/')) {
                this.processImageFile(file);
            } else {
                this.processOtherFile(file);
            }
        }
    }

    processOtherFile(file) {
        if (file.size > 50 * 1024 * 1024) {
            alert('File size should be less than 50MB.');
            return;
        }
        
        const chatInput = document.getElementById('user-input');
        if (chatInput) {
            chatInput.value += `\n[File attached: ${file.name}]`;
            this.updateSendButtonState();
        }
    }

    setupMessageComposer() {
        const userInput = document.getElementById('user-input');
        const charCounter = document.getElementById('char-counter');
        const plusBtn = document.getElementById('plus-btn');
        const attachmentMenu = document.getElementById('attachment-menu');
        
        console.log('Setting up message composer');
        console.log('Plus button found:', plusBtn);
        console.log('Attachment menu found:', attachmentMenu);
        
        // Auto-resize textarea
        if (userInput) {
            userInput.addEventListener('input', () => {
                // Update character counter
                if (charCounter) {
                    const count = userInput.value.length;
                    charCounter.textContent = `${count}/2000`;
                    charCounter.style.color = count > 1800 ? 'var(--danger)' : 'var(--text-light)';
                }
                
                // Auto-resize
                userInput.style.height = 'auto';
                userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
                
                this.updateSendButtonState();
            });
            
            // Handle Ctrl+/ for commands
            userInput.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === '/') {
                    e.preventDefault();
                    this.showCommandPalette();
                }
            });
        }
        
        // Plus button for attachment menu
        if (plusBtn && attachmentMenu) {
            plusBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Plus button clicked');
                console.log('Attachment menu found:', attachmentMenu);
                console.log('Menu classes before toggle:', attachmentMenu.className);
                
                if (attachmentMenu.classList.contains('hidden')) {
                    // Position the menu above the button
                    const rect = plusBtn.getBoundingClientRect();
                    const menuHeight = 200; // Approximate height
                    
                    // Position above the button with some margin
                    attachmentMenu.style.left = rect.left + 'px';
                    attachmentMenu.style.top = (rect.top - menuHeight - 10) + 'px';
                    
                    // Check if menu would go off-screen at top
                    if (rect.top - menuHeight - 10 < 0) {
                        // Position below the button instead
                        attachmentMenu.style.top = (rect.bottom + 10) + 'px';
                    }
                }
                
                attachmentMenu.classList.toggle('hidden');
                console.log('Menu classes after toggle:', attachmentMenu.className);
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', () => {
                attachmentMenu.classList.add('hidden');
            });
            
            // Handle attachment options
            document.querySelectorAll('.attachment-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const type = option.dataset.type;
                    this.handleAttachmentOption(type);
                    attachmentMenu.classList.add('hidden');
                });
            });
        }
        
        // Composer toolbar buttons
        const emojiBtn = document.getElementById('emoji-btn');
        const formatBtn = document.getElementById('format-btn');
        const templateBtn = document.getElementById('template-btn');
        
        if (emojiBtn) emojiBtn.addEventListener('click', () => this.showEmojiPicker());
        if (formatBtn) formatBtn.addEventListener('click', () => this.showFormatOptions());
        if (templateBtn) templateBtn.addEventListener('click', () => this.showMessageTemplates());
    }

    // Test function for debugging
    testAttachmentMenu() {
        const attachmentMenu = document.getElementById('attachment-menu');
        if (attachmentMenu) {
            attachmentMenu.classList.toggle('hidden');
            console.log('Menu toggled, classes:', attachmentMenu.className);
        } else {
            console.log('Attachment menu not found');
        }
    }

    handleAttachmentOption(type) {
        switch(type) {
            case 'image':
                document.getElementById('image-input')?.click();
                break;
            case 'file':
                document.getElementById('file-input')?.click();
                break;
            case 'camera':
                this.openCamera();
                break;
            case 'code':
                this.insertCodeSnippet();
                break;
            case 'web-search':
                this.initiateWebSearch();
                break;
            case 'chart':
                this.createChart();
                break;
            case 'table':
                this.createTable();
                break;
            case 'math':
                this.insertMathFormula();
                break;
        }
    }

    showCommandPalette() {
        const userInput = document.getElementById('user-input');
        if (userInput) {
            const commands = [
                '/help - Show available commands',
                '/clear - Clear chat history',
                '/export - Export conversation',
                '/theme - Toggle theme',
                '/voice - Toggle voice input'
            ];
            
            const commandText = commands.join('\n');
            alert(`Available Commands:\n\n${commandText}`);
        }
    }

    showEmojiPicker() {
        const emojis = ['😊', '😂', '🤔', '👍', '❤️', '🎉', '🔥', '💡', '✨', '🚀'];
        const userInput = document.getElementById('user-input');
        if (userInput) {
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            userInput.value += emoji;
            userInput.focus();
            this.updateSendButtonState();
        }
    }

    showFormatOptions() {
        const userInput = document.getElementById('user-input');
        if (userInput && userInput.selectionStart !== userInput.selectionEnd) {
            const start = userInput.selectionStart;
            const end = userInput.selectionEnd;
            const selectedText = userInput.value.substring(start, end);
            const formattedText = `**${selectedText}**`; // Bold formatting
            
            userInput.value = userInput.value.substring(0, start) + formattedText + userInput.value.substring(end);
            userInput.focus();
            this.updateSendButtonState();
        }
    }

    showMessageTemplates() {
        const templates = [
            "Could you please help me with...",
            "I'm looking for information about...", 
            "Can you explain how to...",
            "What's the best way to...",
            "I need assistance with..."
        ];
        
        const template = templates[Math.floor(Math.random() * templates.length)];
        const userInput = document.getElementById('user-input');
        if (userInput) {
            userInput.value = template;
            userInput.focus();
            this.updateSendButtonState();
        }
    }

    insertCodeSnippet() {
        const userInput = document.getElementById('user-input');
        if (userInput) {
            // Show a popup to select programming language
            const languages = ['python', 'javascript', 'html', 'css', 'java', 'cpp', 'go', 'rust', 'php', 'sql'];
            const language = prompt('Select programming language:\n' + languages.join(', ')) || 'javascript';
            
            const codeTemplate = `\`\`\`${language}\n// Write or paste your ${language} code here\n\n\`\`\`\n\nCan you help me with this code?`;
            userInput.value = codeTemplate;
            userInput.focus();
            
            // Position cursor inside the code block
            const cursorPos = userInput.value.indexOf('// Write or paste');
            userInput.setSelectionRange(cursorPos, cursorPos + `// Write or paste your ${language} code here`.length);
            this.updateSendButtonState();
        }
    }

    openCamera() {
        this.showNotification('Camera functionality will be available in the next update!', 'info');
    }

    initiateWebSearch() {
        const userInput = document.getElementById('user-input');
        if (userInput) {
            userInput.value = 'Search the web for: ';
            userInput.focus();
            userInput.setSelectionRange(userInput.value.length, userInput.value.length);
            this.showNotification('Type your search query after "Search the web for:"', 'info');
        }
    }

    createChart() {
        const userInput = document.getElementById('user-input');
        if (userInput) {
            userInput.value = 'Create a chart showing: ';
            userInput.focus();
            userInput.setSelectionRange(userInput.value.length, userInput.value.length);
            this.showNotification('Describe the data you want to visualize', 'info');
        }
    }

    createTable() {
        const userInput = document.getElementById('user-input');
        if (userInput) {
            userInput.value = 'Create a table with: ';
            userInput.focus();
            userInput.setSelectionRange(userInput.value.length, userInput.value.length);
            this.showNotification('Describe the table structure and data you need', 'info');
        }
    }



    insertMathFormula() {
        const userInput = document.getElementById('user-input');
        if (userInput) {
            userInput.value = 'Solve this math problem: ';
            userInput.focus();
            userInput.setSelectionRange(userInput.value.length, userInput.value.length);
            this.showNotification('Enter your mathematical equation or problem', 'info');
        }
    }

    updateCurrentModel() {
        const aiModelSelect = document.getElementById('ai-model');
        const currentModelSpan = document.getElementById('current-model');
        
        if (aiModelSelect && currentModelSpan) {
            const selectedValue = aiModelSelect.value;
            const modelNames = {
                'emy-3.0': 'emy 3.0',
                'emy-pro': 'emy pro', 
                'emy-deep-think': 'emy deep think'
            };
            
            // Update the model name in the dropdown button
            const modelNameSpan = currentModelSpan.querySelector('.model-name');
            if (modelNameSpan) {
                modelNameSpan.textContent = modelNames[selectedValue] || 'emy pro';
            } else {
                currentModelSpan.textContent = modelNames[selectedValue] || 'emy pro';
            }
            
            // Update dropdown selection indicators
            this.updateDropdownSelection(selectedValue);
            
            // Add visual feedback for model capabilities
            const modelIndicator = document.getElementById('model-indicator');
            if (modelIndicator) {
                modelIndicator.className = 'model-indicator';
                
                switch(selectedValue) {
                    case 'emy-3.0':
                        modelIndicator.classList.add('model-fast');
                        break;
                    case 'emy-pro':
                        modelIndicator.classList.add('model-balanced');
                        break;
                    case 'emy-deep-think':
                        modelIndicator.classList.add('model-advanced');
                        break;
                }
            }
        }
    }
    
    toggleModelDropdown() {
        const dropdown = document.getElementById('model-dropdown');
        const button = document.getElementById('current-model');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
            if (button) {
                button.classList.toggle('open');
            }
        }
    }
    
    hideModelDropdown() {
        const dropdown = document.getElementById('model-dropdown');
        const button = document.getElementById('current-model');
        if (dropdown) {
            dropdown.classList.add('hidden');
            if (button) {
                button.classList.remove('open');
            }
        }
    }
    
    selectModel(modelValue) {
        const modelSelect = document.getElementById('ai-model');
        if (modelSelect) {
            modelSelect.value = modelValue;
            this.updateCurrentModel();
            this.saveSettings();
        }
    }
    
    updateDropdownSelection(selectedValue) {
        const modelOptions = document.querySelectorAll('.model-option');
        modelOptions.forEach(option => {
            if (option.dataset.model === selectedValue) {
                option.classList.add('selected');
                const indicator = option.querySelector('.model-indicator');
                if (indicator) {
                    indicator.textContent = '✓';
                }
            } else {
                option.classList.remove('selected');
                const indicator = option.querySelector('.model-indicator');
                if (indicator) {
                    indicator.textContent = '';
                }
            }
        });
    }



    setupContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            const message = e.target.closest('.message');
            if (message) {
                e.preventDefault();
                this.showContextMenu(e, message);
            }
        });

        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
    }

    showContextMenu(event, messageElement) {
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = event.pageX + 'px';
        menu.style.top = event.pageY + 'px';

        const actions = [
            { icon: 'fas fa-copy', text: 'Copy', action: () => this.copyMessage(messageElement) },
            { icon: 'fas fa-bookmark', text: 'Bookmark', action: () => this.bookmarkMessage(messageElement) },
            { icon: 'fas fa-share', text: 'Share', action: () => this.shareMessage(messageElement) }
        ];

        actions.forEach(item => {
            const button = document.createElement('button');
            button.className = 'context-item';
            button.innerHTML = `<i class="${item.icon}"></i> ${item.text}`;
            button.onclick = item.action;
            menu.appendChild(button);
        });

        document.body.appendChild(menu);
    }

    hideContextMenu() {
        const menu = document.querySelector('.context-menu');
        if (menu) {
            menu.remove();
        }
    }

    copyMessage(messageElement) {
        const content = messageElement.querySelector('.message-content').textContent;
        navigator.clipboard.writeText(content).then(() => {
            this.showNotification('Message copied to clipboard');
        });
    }

    bookmarkMessage(messageElement) {
        this.showNotification('Message bookmarked');
    }

    shareMessage(messageElement) {
        const content = messageElement.querySelector('.message-content').textContent;
        if (navigator.share) {
            navigator.share({
                text: content
            });
        } else {
            this.copyMessage(messageElement);
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // Set colors based on notification type
        let backgroundColor, color;
        switch (type) {
            case 'error':
                backgroundColor = 'var(--danger)';
                color = 'white';
                break;
            case 'warning':
                backgroundColor = 'var(--warning)';
                color = 'white';
                break;
            case 'info':
                backgroundColor = '#3b82f6';
                color = 'white';
                break;
            default: // success
                backgroundColor = 'var(--accent-primary)';
                color = 'white';
        }
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: ${color};
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, type === 'error' ? 5000 : 3000);
    }

    loadConversations() {
        const conversationList = document.getElementById('conversationList');
        if (!conversationList) return;

        conversationList.innerHTML = '';
        
        this.conversations.forEach(conv => {
            const item = document.createElement('div');
            item.className = 'conversation-item';
            item.innerHTML = `
                <div class="conversation-title">${conv.title}</div>
                <div class="conversation-date">${new Date(conv.date).toLocaleDateString()}</div>
            `;
            item.onclick = () => this.loadConversation(conv.id);
            conversationList.appendChild(item);
        });
    }

    createNewConversation() {
        const conversationId = Date.now().toString();
        const conversation = {
            id: conversationId,
            title: 'New Conversation',
            date: new Date().toISOString(),
            messages: []
        };
        
        this.conversations.unshift(conversation);
        this.currentConversationId = conversationId;
        
        const chatLog = document.getElementById('chat-log');
        if (chatLog) {
            chatLog.innerHTML = '';
        }
        
        this.saveConversations();
        this.loadConversations();
    }

    loadConversation(conversationId) {
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (!conversation) return;

        this.currentConversationId = conversationId;
        
        const chatLog = document.getElementById('chat-log');
        if (chatLog) {
            chatLog.innerHTML = '';
            
            conversation.messages.forEach(msg => {
                this.displayMessage(msg.sender, msg.content);
            });
        }
    }

    saveConversations() {
        localStorage.setItem('conversations', JSON.stringify(this.conversations));
    }

    restoreLastConversation() {
        if (this.conversations.length > 0) {
            this.loadConversation(this.conversations[0].id);
        }
    }

    exportConversation() {
        const chatLog = document.getElementById('chat-log');
        if (!chatLog) return;

        const messages = Array.from(chatLog.querySelectorAll('.message')).map(msg => {
            const sender = msg.classList.contains('user') ? 'User' : 'Assistant';
            const content = msg.querySelector('.message-content').textContent;
            return `${sender}: ${content}`;
        });

        const text = messages.join('\n\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    }

    closeAllOverlays() {
        const settingsPanel = document.getElementById('settings-panel');
        const searchOverlay = document.getElementById('search-overlay');
        const newChatModal = document.getElementById('new-chat-modal');
        
        if (settingsPanel && settingsPanel.classList.contains('open')) {
            settingsPanel.classList.remove('open');
            document.removeEventListener('click', this.handleSettingsOutsideClick.bind(this));
        }
        if (searchOverlay) searchOverlay.classList.remove('active');
        if (newChatModal) newChatModal.classList.add('hidden');
        
        this.hideContextMenu();
    }

    handleResize() {
        const width = window.innerWidth;
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        
        if (sidebarToggle) {
            if (width <= 768) {
                sidebarToggle.classList.remove('hidden');
            } else {
                sidebarToggle.classList.add('hidden');
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) sidebar.classList.remove('active');
            }
        }
    }

    speakText(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = this.settings.language;
            speechSynthesis.speak(utterance);
        }
    }

    scrollToSearchResult(index) {
        if (this.searchResults[index]) {
            this.searchResults[index].element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.searchResults[index].element.classList.add('search-highlight-active');
            setTimeout(() => {
                this.searchResults[index].element.classList.remove('search-highlight-active');
            }, 2000);
        }
    }

    // Copy code functionality for enhanced AI messages
    copyCode(code) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).then(() => {
                // Show success feedback
                this.showCopyFeedback();
            }).catch(err => {
                console.error('Failed to copy code:', err);
                this.fallbackCopyCode(code);
            });
        } else {
            this.fallbackCopyCode(code);
        }
    }

    fallbackCopyCode(code) {
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            this.showCopyFeedback();
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
        document.body.removeChild(textArea);
    }

    showCopyFeedback() {
        // Create and show a temporary success message
        const feedback = document.createElement('div');
        feedback.className = 'copy-feedback';
        feedback.innerHTML = '✅ Code copied to clipboard!';
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            z-index: 10000;
            font-weight: 500;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(feedback);
            }, 300);
        }, 2000);
    }

    // ===== CONVERSATION MEMORY SYSTEM =====
    
    addToConversationHistory(role, content) {
        const message = {
            role: role, // 'user' or 'assistant'
            content: content,
            timestamp: new Date().toISOString(),
            sessionId: this.currentSessionId
        };
        
        this.conversationHistory.push(message);
        
        // Maintain maximum history length for performance
        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        }
    }

    saveConversationHistory() {
        try {
            localStorage.setItem('conversationHistory', JSON.stringify(this.conversationHistory));
        } catch (error) {
            console.warn('Failed to save conversation history to localStorage:', error);
            // If localStorage is full, clear old history and try again
            if (error.name === 'QuotaExceededError') {
                this.conversationHistory = this.conversationHistory.slice(-20); // Keep only last 20 messages
                try {
                    localStorage.setItem('conversationHistory', JSON.stringify(this.conversationHistory));
                } catch (retryError) {
                    console.error('Failed to save even reduced conversation history:', retryError);
                }
            }
        }
    }

    loadConversationHistory() {
        try {
            const saved = localStorage.getItem('conversationHistory');
            if (saved) {
                this.conversationHistory = JSON.parse(saved);
                
                // Clean up old sessions (keep only last 7 days)
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                this.conversationHistory = this.conversationHistory.filter(msg => 
                    new Date(msg.timestamp) > weekAgo
                );
                
                // Save the cleaned history back
                this.saveConversationHistory();
            }
        } catch (error) {
            console.warn('Failed to load conversation history:', error);
            this.conversationHistory = [];
        }
    }

    getRecentConversationHistory(limit = 20) {
        // Return recent messages formatted for OpenAI API
        return this.conversationHistory
            .slice(-limit)
            .map(msg => ({
                role: msg.role,
                content: msg.content
            }));
    }

    clearConversationHistory() {
        this.conversationHistory = [];
        this.currentSessionId = this.generateSessionId();
        localStorage.removeItem('conversationHistory');
        this.showNotification('Conversation memory cleared!', 'success');
    }

    getConversationStats() {
        const stats = {
            totalMessages: this.conversationHistory.length,
            userMessages: this.conversationHistory.filter(m => m.role === 'user').length,
            assistantMessages: this.conversationHistory.filter(m => m.role === 'assistant').length,
            currentSession: this.conversationHistory.filter(m => m.sessionId === this.currentSessionId).length,
            oldestMessage: this.conversationHistory[0]?.timestamp,
            newestMessage: this.conversationHistory[this.conversationHistory.length - 1]?.timestamp
        };
        
        return stats;
    }

    updateMemoryDisplay() {
        const memoryInfo = document.getElementById('memory-info');
        if (memoryInfo) {
            const stats = this.getConversationStats();
            const memoryStats = memoryInfo.querySelector('.memory-stats');
            
            if (stats.totalMessages === 0) {
                memoryStats.textContent = '🧠 No conversation history stored';
            } else {
                memoryStats.innerHTML = `
                    <div>🧠 ${stats.totalMessages} messages in memory</div>
                    <div>💬 ${stats.currentSession} messages this session</div>
                `;
            }
        }
    }

    showMemoryStats() {
        const stats = this.getConversationStats();
        
        let message = `📊 **Memory Statistics**\n\n`;
        message += `🧠 Total Messages: ${stats.totalMessages}\n`;
        message += `👤 User Messages: ${stats.userMessages}\n`;
        message += `🤖 AI Messages: ${stats.assistantMessages}\n`;
        message += `💬 Current Session: ${stats.totalMessages - stats.currentSession} previous + ${stats.currentSession} current\n\n`;
        
        if (stats.oldestMessage) {
            const oldestDate = new Date(stats.oldestMessage).toLocaleDateString();
            const newestDate = new Date(stats.newestMessage).toLocaleDateString();
            message += `📅 Memory Span: ${oldestDate} - ${newestDate}\n`;
        }
        
        message += `\n💡 **Memory Features:**\n`;
        message += `• I remember our conversations across sessions\n`;
        message += `• Context is maintained for relevant responses\n`;
        message += `• Memory is automatically cleaned after 7 days\n`;
        message += `• Maximum 50 messages kept for performance\n`;
        
        // Create a nice popup instead of basic alert
        this.showMemoryStatsModal(message);
    }

    showMemoryStatsModal(content) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'memory-stats-overlay';
        
        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'memory-stats-modal';
        
        const header = document.createElement('div');
        header.className = 'memory-stats-header';
        header.innerHTML = `
            <h3>🧠 Memory Statistics</h3>
            <button class="close-memory-stats" aria-label="Close">&times;</button>
        `;
        
        const body = document.createElement('div');
        body.className = 'memory-stats-body';
        body.innerHTML = content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        modal.appendChild(header);
        modal.appendChild(body);
        overlay.appendChild(modal);
        
        // Add styles
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        modal.style.cssText = `
            background: var(--bg-primary);
            color: var(--text-primary);
            padding: 24px;
            border-radius: 12px;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            animation: modalSlideIn 0.3s ease;
        `;
        
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--border-light);
        `;
        
        body.style.cssText = `
            line-height: 1.6;
            font-size: 0.95rem;
        `;
        
        // Close functionality
        const closeBtn = modal.querySelector('.close-memory-stats');
        const closeModal = () => {
            overlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => document.body.removeChild(overlay), 300);
        };
        
        closeBtn.onclick = closeModal;
        overlay.onclick = (e) => {
            if (e.target === overlay) closeModal();
        };
        
        document.body.appendChild(overlay);
    }

    // ===== NEW CHAT FUNCTIONALITY =====
    
    showNewChatModal() {
        const modal = document.getElementById('new-chat-modal');
        const messageCountSpan = document.getElementById('message-count');
        
        if (modal && messageCountSpan) {
            // Update message count
            const currentMessages = document.querySelectorAll('.message').length;
            messageCountSpan.textContent = currentMessages;
            
            // Show modal
            modal.classList.remove('hidden');
            
            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideNewChatModal();
                }
            });
        }
    }
    
    hideNewChatModal() {
        const modal = document.getElementById('new-chat-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    saveAndStartNew() {
        // Save current conversation to history
        this.saveCurrentConversationToHistory();
        
        // Start new chat but keep memory
        this.startNewChat(false); // false = keep memory
        
        this.hideNewChatModal();
        this.showNotification('💾 Current chat saved! Starting fresh conversation with memory intact.', 'success');
    }
    
    clearAndStartNew() {
        // Confirm action
        if (confirm('This will permanently clear all conversation memory. Are you sure?')) {
            // Start completely fresh
            this.startNewChat(true); // true = clear memory
            
            this.hideNewChatModal();
            this.showNotification('🆕 Started completely fresh! All memory cleared.', 'success');
        }
    }
    
    saveCurrentConversationToHistory() {
        const chatLog = document.getElementById('chat-log');
        if (!chatLog) return;
        
        const messages = Array.from(chatLog.querySelectorAll('.message')).map(msg => {
            const isUser = msg.classList.contains('user');
            const content = msg.querySelector('.message-content').textContent.trim();
            const timestamp = msg.querySelector('.message-timestamp')?.textContent || new Date().toLocaleTimeString();
            
            return {
                sender: isUser ? 'user' : 'chatbot',
                content: content,
                timestamp: timestamp
            };
        });
        
        if (messages.length > 0) {
            const conversation = {
                id: Date.now().toString(),
                title: this.generateConversationTitle(messages),
                date: new Date().toISOString(),
                messages: messages,
                messageCount: messages.length
            };
            
            // Add to conversations list
            this.conversations.unshift(conversation);
            
            // Keep only last 20 conversations to save storage
            if (this.conversations.length > 20) {
                this.conversations = this.conversations.slice(0, 20);
            }
            
            this.saveConversations();
            this.loadConversations();
        }
    }
    
    generateConversationTitle(messages) {
        if (messages.length === 0) return 'Empty Conversation';
        
        // Get first user message
        const firstUserMessage = messages.find(m => m.sender === 'user');
        if (firstUserMessage) {
            // Extract first 50 characters and clean up
            let title = firstUserMessage.content.substring(0, 50).trim();
            
            // Remove common prefixes
            title = title.replace(/^(how|what|why|when|where|can|could|would|should|tell me|explain|help me with)/i, '');
            title = title.trim();
            
            // Clean up and add ellipsis if needed
            if (title.length > 30) {
                title = title.substring(0, 30).trim() + '...';
            }
            
            return title || 'New Conversation';
        }
        
        return 'New Conversation';
    }
    
    startNewChat(clearMemory = false) {
        // Clear the chat display
        const chatLog = document.getElementById('chat-log');
        if (chatLog) {
            const messages = chatLog.querySelectorAll('.message');
            messages.forEach(message => {
                message.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    if (message.parentNode) {
                        message.remove();
                    }
                }, 300);
            });
        }
        
        // Reset counters and message history
        this.messageCounter = 0;
        this.messageHistory = [];
        
        if (clearMemory) {
            // Clear all memory
            this.conversationHistory = [];
            localStorage.removeItem('conversationHistory');
        } else {
            // Keep memory but start new session
            this.currentSessionId = this.generateSessionId();
        }
        
        // Focus on input
        // Update conversation status
        this.updateConversationStatus();
        
        setTimeout(() => {
            const userInput = document.getElementById('user-input');
            if (userInput) {
                userInput.focus();
            }
        }, 500);
    }
    
    updateConversationStatus() {
        const statusElement = document.getElementById('conversation-status');
        const messageIndicator = document.getElementById('message-indicator');
        
        if (statusElement && messageIndicator) {
            const messageCount = document.querySelectorAll('.message').length;
            
            if (messageCount === 0) {
                statusElement.classList.add('hidden');
            } else {
                statusElement.classList.remove('hidden');
                messageIndicator.textContent = `${messageCount} message${messageCount !== 1 ? 's' : ''}`;
                
                // Add pulse animation
                statusElement.classList.add('updated');
                setTimeout(() => {
                    statusElement.classList.remove('updated');
                }, 500);
            }
        }
    }
}

// Initialize the chatbot when DOM is loaded
let chatBot;
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure all elements are rendered
    setTimeout(() => {
        chatBot = new ChatBot();
        
        // Make test function globally accessible for debugging
        window.testAttachmentMenu = () => chatBot.testAttachmentMenu();
        window.chatBot = chatBot;
        
        // Additional search button setup as backup
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn && chatBot) {
            searchBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                chatBot.toggleSearch();
            });
        }
        
        // Focus on input when page loads
        const userInput = document.getElementById('user-input');
        if (userInput) {
            userInput.focus();
        }
    }, 100);
});

// Legacy function support for backward compatibility
function sendMessage() {
    if (chatBot) {
        chatBot.sendMessage();
    }
}

function editMessage(messageId) {
    if (chatBot) {
        chatBot.editMessage(messageId);
    }
}