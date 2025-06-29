// Popup script for LinguaLive browser extension
class LinguaLivePopup {
  constructor() {
    this.elements = {};
    this.settings = {};
    this.init();
  }

  async init() {
    this.cacheElements();
    this.loadSettings();
    this.bindEvents();
    this.updateStatus();
    
    // Start status updates
    this.startStatusUpdates();
  }

  cacheElements() {
    this.elements = {
      enableTranslation: document.getElementById('enableTranslation'),
      targetLanguage: document.getElementById('targetLanguage'),
      autoDetect: document.getElementById('autoDetect'),
      enablePunctuation: document.getElementById('enablePunctuation'),
      subtitlePosition: document.getElementById('subtitlePosition'),
      fontSize: document.getElementById('fontSize'),
      showOriginal: document.getElementById('showOriginal'),
      statusDot: document.getElementById('statusDot'),
      statusText: document.getElementById('statusText'),
      detectedLanguage: document.getElementById('detectedLanguage'),
      confidence: document.getElementById('confidence'),
      audioBar: document.getElementById('audioBar'),
      openSettings: document.getElementById('openSettings'),
      testTranslation: document.getElementById('testTranslation'),
      overlayBtn: document.getElementById('overlayBtn')
    };
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

      this.settings = result;
      this.updateUI();
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  updateUI() {
    this.elements.enableTranslation.checked = this.settings.enabled;
    this.elements.targetLanguage.value = this.settings.targetLanguage;
    this.elements.autoDetect.checked = this.settings.autoDetect;
    this.elements.enablePunctuation.checked = this.settings.enablePunctuation;
    this.elements.subtitlePosition.value = this.settings.subtitlePosition;
    this.elements.fontSize.value = this.settings.fontSize;
    this.elements.showOriginal.checked = this.settings.showOriginal;
  }

  bindEvents() {
    // Main toggle
    this.elements.enableTranslation.addEventListener('change', (e) => {
      this.settings.enabled = e.target.checked;
      this.saveSettings();
      this.toggleTranslation();
    });

    // Settings changes
    this.elements.targetLanguage.addEventListener('change', (e) => {
      this.settings.targetLanguage = e.target.value;
      this.saveSettings();
    });

    this.elements.autoDetect.addEventListener('change', (e) => {
      this.settings.autoDetect = e.target.checked;
      this.saveSettings();
    });

    this.elements.enablePunctuation.addEventListener('change', (e) => {
      this.settings.enablePunctuation = e.target.checked;
      this.saveSettings();
    });

    this.elements.subtitlePosition.addEventListener('change', (e) => {
      this.settings.subtitlePosition = e.target.value;
      this.saveSettings();
    });

    this.elements.fontSize.addEventListener('change', (e) => {
      this.settings.fontSize = e.target.value;
      this.saveSettings();
    });

    this.elements.showOriginal.addEventListener('change', (e) => {
      this.settings.showOriginal = e.target.checked;
      this.saveSettings();
    });

    // Buttons
    this.elements.openSettings.addEventListener('click', () => {
      this.openAdvancedSettings();
    });

    this.elements.testTranslation.addEventListener('click', () => {
      this.testTranslation();
    });

    this.elements.overlayBtn.addEventListener('click', () => {
      this.openTranslationOverlay();
    });
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set(this.settings);
      
      // Notify content script of settings change
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SETTINGS_UPDATED',
          settings: this.settings
        });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async toggleTranslation() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    if (this.settings.enabled) {
      // Enable translation
      chrome.tabs.sendMessage(tab.id, {
        type: 'ENABLE_TRANSLATION',
        settings: this.settings
      });
    } else {
      // Disable translation
      chrome.tabs.sendMessage(tab.id, {
        type: 'DISABLE_TRANSLATION'
      });
    }
  }

  async updateStatus() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_STATUS'
      });

      if (response) {
        this.updateStatusUI(response);
      }
    } catch (error) {
      // Content script not ready or not on supported page
      this.updateStatusUI({
        active: false,
        detectedLanguage: '-',
        confidence: '-',
        audioLevel: 0
      });
    }
  }

  updateStatusUI(status) {
    // Update status dot
    this.elements.statusDot.classList.toggle('active', status.active);
    this.elements.statusText.textContent = status.active ? 'Active' : 'Inactive';

    // Update detected language
    this.elements.detectedLanguage.textContent = status.detectedLanguage || '-';

    // Update confidence
    this.elements.confidence.textContent = status.confidence ? 
      `${Math.round(status.confidence * 100)}%` : '-';

    // Update audio level
    const audioLevel = status.audioLevel || 0;
    this.elements.audioBar.style.width = `${audioLevel * 100}%`;
  }

  startStatusUpdates() {
    // Update status every 2 seconds
    setInterval(() => {
      this.updateStatus();
    }, 2000);
  }

  async openAdvancedSettings() {
    // Open a new tab with advanced settings
    chrome.tabs.create({
      url: chrome.runtime.getURL('settings.html')
    });
  }

  async testTranslation() {
    const testText = "Hello, this is a test of the translation system.";
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/translation/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: testText,
          target_language: this.settings.targetLanguage,
          auto_detect: this.settings.autoDetect,
          enable_punctuation: this.settings.enablePunctuation
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Test successful!\n\nOriginal: ${testText}\nTranslated: ${result.translated_text}`);
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      alert('Test failed. Please make sure the LinguaLive backend is running on localhost:8000');
    }
  }

  async openTranslationOverlay() {
    try {
      // Open the translation overlay in a new window
      const overlayWindow = window.open(
        chrome.runtime.getURL('translation-overlay.html'),
        'lingualive-overlay',
        'width=600,height=400,resizable=yes,scrollbars=no,status=no,toolbar=no,menubar=no,location=no'
      );

      if (overlayWindow) {
        // Send current settings to the overlay
        overlayWindow.addEventListener('load', () => {
          overlayWindow.postMessage({
            type: 'SETTINGS_UPDATE',
            settings: this.settings
          }, '*');
        });

        // Show instructions
        setTimeout(() => {
          alert(
            'Translation overlay opened!\n\n' +
            'To share translations with others:\n' +
            '1. Start screen sharing in your video call\n' +
            '2. Select "Share a specific window"\n' +
            '3. Choose the "LinguaLive Translation Overlay" window\n' +
            '4. Speak and others will see your translations!\n\n' +
            'Keyboard shortcuts:\n' +
            'Ctrl+H: Hide/Show overlay\n' +
            'Ctrl+S: Settings\n' +
            'Ctrl+Q: Close overlay'
          );
        }, 1000);
      } else {
        alert('Failed to open overlay. Please allow popups for this extension.');
      }
    } catch (error) {
      console.error('Failed to open translation overlay:', error);
      alert('Failed to open translation overlay. Please try again.');
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LinguaLivePopup();
}); 