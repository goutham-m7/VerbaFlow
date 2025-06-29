// Content script for LinguaLive browser extension
class LinguaLiveContent {
  constructor() {
    this.settings = {
      enabled: false,
      targetLanguage: 'en',
      autoDetect: true,
      enablePunctuation: true,
      subtitlePosition: 'bottom',
      fontSize: 'medium',
      showOriginal: true
    };
    
    this.state = {
      active: false,
      detectedLanguage: null,
      confidence: null,
      audioLevel: 0,
      isRecording: false,
      currentText: '',
      subtitleElement: null
    };

    this.audioContext = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recognition = null;
    
    this.init();
  }

  async init() {
    this.loadSettings();
    this.createSubtitleElement();
    this.setupMessageListener();
    this.setupSpeechRecognition();
    
    // Check if we should auto-enable on supported pages
    if (this.isSupportedPage()) {
      this.checkAutoEnable();
    }
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
        showOriginal: true
      });
      
      this.settings = { ...this.settings, ...result };
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'ENABLE_TRANSLATION':
          this.settings = { ...this.settings, ...message.settings };
          this.enable();
          sendResponse({ success: true });
          break;
          
        case 'DISABLE_TRANSLATION':
          this.disable();
          sendResponse({ success: true });
          break;
          
        case 'SETTINGS_UPDATED':
          this.settings = { ...this.settings, ...message.settings };
          this.updateSubtitleStyle();
          sendResponse({ success: true });
          break;
          
        case 'GET_STATUS':
          sendResponse({
            active: this.state.active,
            detectedLanguage: this.state.detectedLanguage,
            confidence: this.state.confidence,
            audioLevel: this.state.audioLevel
          });
          break;
      }
    });
  }

  setupSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US'; // Will be updated based on settings
      
      this.recognition.onstart = () => {
        console.log('Speech recognition started');
        this.state.isRecording = true;
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
          this.updateSubtitle(interimTranscript, true);
        }
      };
      
      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.state.isRecording = false;
      };
      
      this.recognition.onend = () => {
        console.log('Speech recognition ended');
        this.state.isRecording = false;
      };
    }
  }

  createSubtitleElement() {
    // Remove existing subtitle element if any
    const existing = document.getElementById('lingualive-subtitles');
    if (existing) {
      existing.remove();
    }
    
    // Create new subtitle element
    this.state.subtitleElement = document.createElement('div');
    this.state.subtitleElement.id = 'lingualive-subtitles';
    this.state.subtitleElement.style.cssText = `
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      bottom: 100px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 500;
      text-align: center;
      max-width: 80%;
      z-index: 10000;
      display: none;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    
    document.body.appendChild(this.state.subtitleElement);
  }

  updateSubtitleStyle() {
    if (!this.state.subtitleElement) return;
    
    const fontSizeMap = {
      small: '14px',
      medium: '18px',
      large: '24px'
    };
    
    const positionMap = {
      bottom: 'bottom: 100px; top: auto;',
      top: 'top: 100px; bottom: auto;',
      overlay: 'top: 50%; transform: translate(-50%, -50%);'
    };
    
    this.state.subtitleElement.style.fontSize = fontSizeMap[this.settings.fontSize] || '18px';
    this.state.subtitleElement.style.cssText = this.state.subtitleElement.style.cssText.replace(
      /(top|bottom):[^;]+;/g,
      positionMap[this.settings.subtitlePosition] || positionMap.bottom
    );
  }

  async processText(text) {
    if (!text.trim()) return;
    
    try {
      // Update subtitle with original text
      this.updateSubtitle(text, false);
      
      // Send to translation API
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
        
        // Update state
        this.state.detectedLanguage = result.detected_language || result.source_language;
        this.state.confidence = result.confidence || result.detection_confidence;
        
        // Update subtitle with translation
        if (result.translated_text) {
          const displayText = this.settings.showOriginal ? 
            `${text}\n→ ${result.translated_text}` : 
            result.translated_text;
          
          this.updateSubtitle(displayText, false);
        }
      }
    } catch (error) {
      console.error('Translation failed:', error);
      this.updateSubtitle(`Translation error: ${error.message}`, false);
    }
  }

  updateSubtitle(text, isInterim = false) {
    if (!this.state.subtitleElement) return;
    
    this.state.subtitleElement.textContent = text;
    this.state.subtitleElement.style.display = 'block';
    this.state.subtitleElement.style.opacity = isInterim ? '0.7' : '1';
    
    // Hide subtitle after 5 seconds if not interim
    if (!isInterim) {
      clearTimeout(this.subtitleTimeout);
      this.subtitleTimeout = setTimeout(() => {
        this.state.subtitleElement.style.display = 'none';
      }, 5000);
    }
  }

  enable() {
    if (this.state.active) return;
    
    this.state.active = true;
    this.updateSubtitleStyle();
    
    // Start speech recognition
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
      }
    }
    
    console.log('LinguaLive translation enabled');
  }

  disable() {
    if (!this.state.active) return;
    
    this.state.active = false;
    
    // Stop speech recognition
    if (this.recognition && this.state.isRecording) {
      this.recognition.stop();
    }
    
    // Hide subtitle
    if (this.state.subtitleElement) {
      this.state.subtitleElement.style.display = 'none';
    }
    
    console.log('LinguaLive translation disabled');
  }

  isSupportedPage() {
    const supportedDomains = [
      'meet.google.com',
      'zoom.us',
      'teams.microsoft.com',
      'web.skype.com',
      'discord.com'
    ];
    
    return supportedDomains.some(domain => window.location.hostname.includes(domain));
  }

  async checkAutoEnable() {
    // Auto-enable if user has enabled it before
    if (this.settings.enabled) {
      this.enable();
    }
  }
}

// Initialize content script
new LinguaLiveContent(); 