# LinguaLive Browser Extension

Real-time speech translation for video calls and meetings. Works with Google Meet, Zoom, Microsoft Teams, Skype, and Discord.

## Features

- 🎤 **Real-time Speech Recognition**: Captures audio from video calls
- 🌍 **Multi-language Translation**: Supports 25+ languages
- 🔄 **Auto Language Detection**: Automatically detects source language
- 📝 **Live Subtitles**: Displays translations as subtitles on video calls
- ⚙️ **Customizable Settings**: Font size, position, language preferences
- 🎯 **Smart Integration**: Works seamlessly with popular video platforms

## Supported Platforms

- Google Meet
- Zoom
- Microsoft Teams
- Skype Web
- Discord

## Installation

### Development Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd VerbaFlow/extension
   ```

2. **Start the LinguaLive backend**
   ```bash
   cd ../backend
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Load the extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `extension` folder

4. **Grant permissions**
   - Click the extension icon
   - Grant microphone access when prompted
   - Allow the extension to access video call sites

### Production Installation

1. **Build the extension**
   ```bash
   npm run build
   ```

2. **Install from Chrome Web Store** (when published)
   - Search for "LinguaLive" in Chrome Web Store
   - Click "Add to Chrome"

## Usage

### Basic Usage

1. **Join a video call** on any supported platform
2. **Click the LinguaLive extension icon** in your browser toolbar
3. **Toggle "Enable Translation"** to start
4. **Select your target language** from the dropdown
5. **Start speaking** - translations will appear as subtitles

### Advanced Settings

- **Subtitle Position**: Choose bottom, top, or overlay
- **Font Size**: Small, medium, or large
- **Show Original**: Display both original and translated text
- **Auto-punctuation**: Automatically add punctuation to translations

### Supported Languages

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Chinese (zh)
- Japanese (ja)
- Korean (ko)
- Arabic (ar)
- Hindi (hi)
- Dutch (nl)
- Swedish (sv)
- Norwegian (no)
- Danish (da)
- Finnish (fi)
- Polish (pl)
- Turkish (tr)
- Hebrew (he)
- Thai (th)
- Vietnamese (vi)
- Indonesian (id)
- Malay (ms)
- Persian (fa)

## Development

### Project Structure

```
extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.css             # Popup styles
├── popup.js              # Popup logic
├── content.js            # Content script for web pages
├── content.css           # Content script styles
├── background.js         # Background service worker
├── icons/                # Extension icons
└── README.md            # This file
```

### Key Components

- **Popup**: User interface for settings and controls
- **Content Script**: Runs on video call pages, captures audio, displays subtitles
- **Background Script**: Manages extension lifecycle and communication
- **API Integration**: Connects to LinguaLive backend for translation

### Testing

1. **Load the extension** in developer mode
2. **Open a video call** on a supported platform
3. **Enable translation** via the popup
4. **Test speech recognition** by speaking
5. **Verify translations** appear as subtitles

### Debugging

- **Check console logs** in the extension popup and content script
- **Inspect background script** in `chrome://extensions/`
- **Test API connectivity** using the "Test Translation" button

## API Requirements

The extension requires the LinguaLive backend API running on `http://localhost:8000` with the following endpoints:

- `POST /api/v1/translation/translate` - Translate text
- `POST /api/v1/translation/translate-with-detection` - Translate with language detection

## Privacy & Security

- **Local Processing**: Speech recognition runs in your browser
- **Secure API**: Translations sent over HTTPS
- **No Data Storage**: Audio is not stored or recorded
- **User Control**: You can disable the extension at any time

## Troubleshooting

### Common Issues

1. **"Translation failed" error**
   - Ensure the LinguaLive backend is running on localhost:8000
   - Check your internet connection
   - Verify API credentials are configured

2. **No audio detected**
   - Grant microphone permissions to the extension
   - Check if your microphone is working
   - Ensure you're on a supported video call platform

3. **Subtitles not appearing**
   - Check if translation is enabled in the popup
   - Verify subtitle position settings
   - Try refreshing the page

4. **Extension not working on a site**
   - Ensure the site is in the supported domains list
   - Check if the content script is injected (developer tools)
   - Try reloading the extension

### Getting Help

- Check the [GitHub Issues](https://github.com/your-repo/issues)
- Review the [API Documentation](../docs/api.md)
- Contact support at support@lingualive.com

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Version History

- **v1.0.0** - Initial release with basic translation features
- **v1.1.0** - Added subtitle positioning and font size options
- **v1.2.0** - Improved language detection and error handling

---

**LinguaLive** - Breaking language barriers in real-time conversations. 