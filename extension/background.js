// Background service worker for LinguaLive browser extension

// Extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First time installation
    console.log('LinguaLive extension installed');
    
    // Set default settings
    chrome.storage.sync.set({
      enabled: false,
      targetLanguage: 'en',
      autoDetect: true,
      enablePunctuation: true,
      subtitlePosition: 'bottom',
      fontSize: 'medium',
      showOriginal: true
    });
    
    // Open welcome page
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html')
    });
  } else if (details.reason === 'update') {
    console.log('LinguaLive extension updated');
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will only trigger if popup is not defined in manifest
  // Since we have a popup, this won't be called
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_TAB_INFO':
      // Return information about the current tab
      sendResponse({
        url: sender.tab?.url,
        title: sender.tab?.title,
        isSupported: isSupportedPage(sender.tab?.url)
      });
      break;
      
    case 'OPEN_OPTIONS':
      // Open options page
      chrome.runtime.openOptionsPage();
      sendResponse({ success: true });
      break;
      
    case 'NOTIFICATION':
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'LinguaLive',
        message: message.message
      });
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && isSupportedPage(tab.url)) {
    // Inject content script if not already injected
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(() => {
      // Content script might already be injected
    });
  }
});

// Handle tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (isSupportedPage(tab.url)) {
      // Update extension icon state
      chrome.action.setIcon({
        path: {
          "16": "icons/icon16.png",
          "32": "icons/icon32.png",
          "48": "icons/icon48.png",
          "128": "icons/icon128.png"
        },
        tabId: activeInfo.tabId
      });
    } else {
      // Disable extension icon for unsupported pages
      chrome.action.setIcon({
        path: {
          "16": "icons/icon16-disabled.png",
          "32": "icons/icon32-disabled.png",
          "48": "icons/icon48-disabled.png",
          "128": "icons/icon128-disabled.png"
        },
        tabId: activeInfo.tabId
      });
    }
  } catch (error) {
    console.error('Error handling tab activation:', error);
  }
});

// Helper function to check if page is supported
function isSupportedPage(url) {
  if (!url) return false;
  
  const supportedDomains = [
    'meet.google.com',
    'zoom.us',
    'teams.microsoft.com',
    'web.skype.com',
    'discord.com'
  ];
  
  try {
    const urlObj = new URL(url);
    return supportedDomains.some(domain => urlObj.hostname.includes(domain));
  } catch (error) {
    return false;
  }
}

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('LinguaLive extension started');
});

// Handle extension shutdown
chrome.runtime.onSuspend.addListener(() => {
  console.log('LinguaLive extension suspended');
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    // Notify all content scripts of settings changes
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (isSupportedPage(tab.url)) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_UPDATED',
            changes: changes
          }).catch(() => {
            // Content script might not be ready
          });
        }
      });
    });
  }
}); 