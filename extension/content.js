// Enhanced content script for multi-user translation sharing
class LinguaLiveContentScript {
  constructor() {
    this.isActive = false;
    this.settings = {};
    this.recognition = null;
    this.overlay = null;
    this.websocket = null;
    this.roomId = null;
    this.userId = null;
    this.participants = new Map();
    this.init();
  }

  async init() {
    this.loadSettings();
    this.createOverlay();
    this.setupMessageListener();
    this.generateRoomId();
    this.setupWebSocket();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get({
        enabled: false,
        targetLanguage: 'en',
        autoDetect: true,
        enablePunctuation: true,
        subtitlePosition: 'bottom',
        fontSize: 'medium',
        showOriginal: true,
        shareTranslations: true,
        roomId: null
      });
      this.settings = result;
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  generateRoomId() {
    // Generate a unique room ID based on current tab URL and timestamp
    const url = window.location.href;
    const timestamp = Math.floor(Date.now() / 1000);
    this.roomId = btoa(`${url}-${timestamp}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
    this.userId = `user-${Math.random().toString(36).substr(2, 9)}`;
    
    // Save room ID to settings
    this.settings.roomId = this.roomId;
    chrome.storage.sync.set({ roomId: this.roomId });
  }

  setupWebSocket() {
    // Connect to WebSocket server for real-time translation sharing
    try {
      this.websocket = new WebSocket('ws://localhost:8000/ws/translations');
      
      this.websocket.onopen = () => {
        console.log('WebSocket connected for translation sharing');
        this.joinRoom();
      };
      
      this.websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      };
      
      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      this.websocket.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.setupWebSocket(), 5000);
      };
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
    }
  }

  joinRoom() {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'join_room',
        roomId: this.roomId,
        userId: this.userId,
        settings: {
          targetLanguage: this.settings.targetLanguage,
          showOriginal: this.settings.showOriginal
        }
      }));
    }
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'translation':
        if (data.userId !== this.userId) {
          this.showParticipantTranslation(data);
        }
        break;
      case 'user_joined':
        this.addParticipant(data.userId, data.settings);
        break;
      case 'user_left':
        this.removeParticipant(data.userId);
        break;
      case 'room_info':
        this.updateParticipantList(data.participants);
        break;
    }
  }

  addParticipant(userId, settings) {
    this.participants.set(userId, {
      settings,
      translations: []
    });
    this.updateParticipantDisplay();
  }

  removeParticipant(userId) {
    this.participants.delete(userId);
    this.updateParticipantDisplay();
  }

  updateParticipantList(participants) {
    this.participants.clear();
    participants.forEach(p => {
      this.participants.set(p.userId, {
        settings: p.settings,
        translations: []
      });
    });
    this.updateParticipantDisplay();
  }

  updateParticipantDisplay() {
    // Update the participant list in the overlay
    if (this.overlay) {
      const participantList = this.overlay.querySelector('.participant-list');
      if (participantList) {
        participantList.innerHTML = '';
        this.participants.forEach((participant, userId) => {
          const participantEl = document.createElement('div');
          participantEl.className = 'participant-item';
          participantEl.innerHTML = `
            <span class="participant-name">${userId === this.userId ? 'You' : `User ${userId.slice(-4)}`}</span>
            <span class="participant-language">${this.getLanguageName(participant.settings.targetLanguage)}</span>
          `;
          participantList.appendChild(participantEl);
        });
      }
    }
  }

  showParticipantTranslation(data) {
    // Show translation from another participant
    const translationEl = document.createElement('div');
    translationEl.className = 'participant-translation';
    translationEl.innerHTML = `
      <div class="translation-header">
        <span class="participant-name">${data.userId === this.userId ? 'You' : `User ${data.userId.slice(-4)}`}</span>
        <span class="language-badge">${this.getLanguageName(data.sourceLanguage)} → ${this.getLanguageName(data.targetLanguage)}</span>
      </div>
      <div class="translation-content">
        ${data.showOriginal ? `<div class="original-text">${data.original}</div>` : ''}
        <div class="translated-text">${data.translated}</div>
      </div>
    `;
    
    // Add to overlay
    if (this.overlay) {
      const translationsContainer = this.overlay.querySelector('.translations-container');
      if (translationsContainer) {
        translationsContainer.appendChild(translationEl);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
          if (translationEl.parentNode) {
            translationEl.remove();
          }
        }, 10000);
      }
    }
  }

  createOverlay() {
    // Create enhanced overlay with participant support
    this.overlay = document.createElement('div');
    this.overlay.id = 'lingualive-overlay';
    this.overlay.className = 'lingualive-overlay';
    this.overlay.innerHTML = `
      <div class="overlay-header">
        <div class="overlay-title">
          <span class="logo">🌍 LinguaLive</span>
          <span class="room-id">Room: ${this.roomId}</span>
        </div>
        <div class="overlay-controls">
          <button class="control-btn" id="toggleOverlay">Hide</button>
          <button class="control-btn" id="shareRoom">Share Room</button>
        </div>
      </div>
      
      <div class="overlay-content">
        <div class="participant-section">
          <h4>Participants (${this.participants.size + 1})</h4>
          <div class="participant-list"></div>
        </div>
        
        <div class="translation-section">
          <div class="current-translation">
            <div class="translation-header">
              <span class="status">Listening...</span>
              <span class="language-info">
                <span class="source-lang">Auto-detect</span>
                <span class="arrow">→</span>
                <span class="target-lang">${this.getLanguageName(this.settings.targetLanguage)}</span>
              </span>
            </div>
            <div class="translation-display">
              <div class="original-text" id="originalText"></div>
              <div class="translated-text" id="translatedText">Waiting for speech...</div>
            </div>
          </div>
          
          <div class="translations-container"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.overlay);
    this.bindOverlayEvents();
  }

  bindOverlayEvents() {
    const toggleBtn = this.overlay.querySelector('#toggleOverlay');
    const shareBtn = this.overlay.querySelector('#shareRoom');
    
    toggleBtn.addEventListener('click', () => {
      this.toggleOverlay();
    });
    
    shareBtn.addEventListener('click', () => {
      this.shareRoom();
    });
  }

  toggleOverlay() {
    const content = this.overlay.querySelector('.overlay-content');
    const toggleBtn = this.overlay.querySelector('#toggleOverlay');
    
    if (content.style.display === 'none') {
      content.style.display = 'block';
      toggleBtn.textContent = 'Hide';
    } else {
      content.style.display = 'none';
      toggleBtn.textContent = 'Show';
    }
  }

  shareRoom() {
    const roomUrl = `${window.location.origin}${window.location.pathname}?lingualive-room=${this.roomId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join LinguaLive Translation Room',
        text: `Join my translation room: ${this.roomId}`,
        url: roomUrl
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`Join my LinguaLive translation room: ${roomUrl}\nRoom ID: ${this.roomId}`);
      alert('Room link copied to clipboard!');
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'ENABLE_TRANSLATION':
          this.settings = { ...this.settings, ...message.settings };
          this.enableTranslation();
          break;
        case 'DISABLE_TRANSLATION':
          this.disableTranslation();
          break;
        case 'SETTINGS_UPDATED':
          this.settings = { ...this.settings, ...message.settings };
          this.updateSettings();
          break;
        case 'GET_STATUS':
          sendResponse({
            active: this.isActive,
            detectedLanguage: this.currentLanguage,
            confidence: this.currentConfidence,
            audioLevel: this.currentAudioLevel,
            participants: this.participants.size
          });
          break;
      }
    });
  }

  enableTranslation() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.startSpeechRecognition();
    this.showOverlay();
  }

  disableTranslation() {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.stopSpeechRecognition();
    this.hideOverlay();
  }

  startSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      
      this.recognition.onstart = () => {
        this.updateStatus('Listening...');
      };
      
      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          this.processText(finalTranscript);
        } else if (interimTranscript) {
          this.showInterimText(interimTranscript);
        }
      };
      
      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.updateStatus('Error: ' + event.error);
      };
      
      this.recognition.onend = () => {
        this.updateStatus('Stopped');
        if (this.isActive) {
          // Restart if still active
          setTimeout(() => this.startSpeechRecognition(), 1000);
        }
      };
      
      try {
        this.recognition.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
      }
    }
  }

  stopSpeechRecognition() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
  }

  async processText(text) {
    if (!text.trim()) return;
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/translation/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          target_language: this.settings.targetLanguage,
          auto_detect: this.settings.autoDetect,
          enable_punctuation: this.settings.enablePunctuation
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        this.showTranslation(text, result);
        this.shareTranslation(text, result);
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      this.showTranslation(text, {
        translated_text: 'Translation error',
        detected_language: 'unknown',
        confidence: 0
      });
    }
  }

  showTranslation(original, result) {
    const originalText = this.overlay.querySelector('#originalText');
    const translatedText = this.overlay.querySelector('#translatedText');
    
    if (this.settings.showOriginal) {
      originalText.textContent = original;
      originalText.style.display = 'block';
    } else {
      originalText.style.display = 'none';
    }
    
    translatedText.textContent = result.translated_text;
    
    // Update language info
    const sourceLang = this.overlay.querySelector('.source-lang');
    const targetLang = this.overlay.querySelector('.target-lang');
    
    sourceLang.textContent = this.getLanguageName(result.detected_language || result.source_language);
    targetLang.textContent = this.getLanguageName(result.target_language);
    
    this.currentLanguage = result.detected_language;
    this.currentConfidence = result.confidence;
  }

  shareTranslation(original, result) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'translation',
        roomId: this.roomId,
        userId: this.userId,
        original: original,
        translated: result.translated_text,
        sourceLanguage: result.detected_language || result.source_language,
        targetLanguage: result.target_language,
        showOriginal: this.settings.showOriginal,
        timestamp: Date.now()
      }));
    }
  }

  showInterimText(text) {
    const translatedText = this.overlay.querySelector('#translatedText');
    translatedText.textContent = text + '...';
  }

  updateStatus(status) {
    const statusEl = this.overlay.querySelector('.status');
    if (statusEl) {
      statusEl.textContent = status;
    }
  }

  showOverlay() {
    if (this.overlay) {
      this.overlay.style.display = 'block';
    }
  }

  hideOverlay() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }

  updateSettings() {
    // Update UI based on new settings
    const targetLang = this.overlay.querySelector('.target-lang');
    if (targetLang) {
      targetLang.textContent = this.getLanguageName(this.settings.targetLanguage);
    }
    
    // Update WebSocket with new settings
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'update_settings',
        roomId: this.roomId,
        userId: this.userId,
        settings: {
          targetLanguage: this.settings.targetLanguage,
          showOriginal: this.settings.showOriginal
        }
      }));
    }
  }

  getLanguageName(code) {
    const languages = {
      'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
      'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'zh': 'Chinese',
      'ja': 'Japanese', 'ko': 'Korean', 'ar': 'Arabic', 'hi': 'Hindi'
    };
    return languages[code] || code.toUpperCase();
  }
}

// Initialize content script
new LinguaLiveContentScript(); 