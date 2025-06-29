# System Architecture

## Overview

The VerbaFlow platform consists of two main applications sharing a common backend infrastructure. The architecture is designed for scalability, reliability, and real-time performance.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   LinguaLive    │    │  LinguaLive     │    │   Shared        │
│   (Standalone)  │    │     Meet        │    │   Backend       │
│                 │    │                 │    │                 │
│ • React SPA     │    │ • React SPA     │    │ • FastAPI       │
│ • Microphone    │    │ • WebRTC        │    │ • MongoDB       │
│ • STT/Translate │    │ • Video/Audio   │    │ • Redis Cache   │
│ • Real-time UI  │    │ • Subtitles     │    │ • Google APIs   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Azure Cloud   │
                    │                 │
                    │ • Web Apps      │
                    │ • CDN           │
                    │ • Monitor       │
                    │ • Sentry        │
                    └─────────────────┘
```

## Component Architecture

### Frontend Architecture

#### LinguaLive (Standalone)
```
src/
├── components/
│   ├── AudioCapture/
│   │   ├── MicrophoneInput.tsx
│   │   ├── AudioVisualizer.tsx
│   │   └── AudioControls.tsx
│   ├── Translation/
│   │   ├── TranscriptionDisplay.tsx
│   │   ├── TranslationDisplay.tsx
│   │   └── LanguageSelector.tsx
│   ├── UI/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── ThemeToggle.tsx
│   └── Widget/
│       ├── EmbeddableWidget.tsx
│       └── WidgetConfig.tsx
├── hooks/
│   ├── useAudioCapture.ts
│   ├── useSpeechToText.ts
│   ├── useTranslation.ts
│   └── useWebSocket.ts
├── services/
│   ├── audioService.ts
│   ├── sttService.ts
│   ├── translationService.ts
│   └── apiService.ts
├── store/
│   ├── audioStore.ts
│   ├── translationStore.ts
│   └── uiStore.ts
└── utils/
    ├── audioUtils.ts
    ├── languageUtils.ts
    └── validationUtils.ts
```

#### LinguaLive Meet
```
src/
├── components/
│   ├── VideoConference/
│   │   ├── VideoGrid.tsx
│   │   ├── ParticipantVideo.tsx
│   │   ├── Controls.tsx
│   │   └── ScreenShare.tsx
│   ├── Subtitles/
│   │   ├── SubtitleOverlay.tsx
│   │   ├── SubtitleFeed.tsx
│   │   └── LanguageToggle.tsx
│   ├── Transcript/
│   │   ├── TranscriptPanel.tsx
│   │   ├── TranscriptItem.tsx
│   │   └── ExportOptions.tsx
│   ├── Meeting/
│   │   ├── MeetingRoom.tsx
│   │   ├── ParticipantList.tsx
│   │   └── MeetingControls.tsx
│   └── Auth/
│       ├── LoginModal.tsx
│       ├── GuestAccess.tsx
│       └── UserProfile.tsx
├── hooks/
│   ├── useWebRTC.ts
│   ├── useMeeting.ts
│   ├── useSubtitles.ts
│   └── useTranscript.ts
├── services/
│   ├── webrtcService.ts
│   ├── meetingService.ts
│   ├── subtitleService.ts
│   └── userService.ts
├── store/
│   ├── meetingStore.ts
│   ├── participantStore.ts
│   ├── subtitleStore.ts
│   └── userStore.ts
└── utils/
    ├── webrtcUtils.ts
    ├── meetingUtils.ts
    └── exportUtils.ts
```

### Backend Architecture

#### FastAPI Application Structure
```
backend/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── config/
│   │   ├── settings.py         # Environment configuration
│   │   └── database.py         # Database connection setup
│   │   └── database.py         # Database connection setup
│   ├── api/
│   │   ├── v1/
│   │   │   ├── auth.py         # Authentication endpoints
│   │   │   ├── meetings.py     # Meeting management
│   │   │   ├── translation.py  # Translation services
│   │   │   ├── users.py        # User management
│   │   │   └── transcripts.py  # Transcript management
│   │   └── websocket.py        # WebSocket handlers
│   ├── models/
│   │   ├── user.py             # User data models
│   │   ├── meeting.py          # Meeting data models
│   │   ├── transcript.py       # Transcript data models
│   │   └── translation.py      # Translation data models
│   ├── services/
│   │   ├── auth_service.py     # Authentication logic
│   │   ├── stt_service.py      # Speech-to-text service
│   │   ├── translation_service.py # Translation service
│   │   ├── meeting_service.py  # Meeting management
│   │   └── webrtc_service.py   # WebRTC coordination
│   ├── utils/
│   │   ├── audio_processing.py # Audio preprocessing
│   │   ├── language_detection.py # Language detection
│   │   └── validation.py       # Input validation
│   └── middleware/
│       ├── auth.py             # Authentication middleware
│       ├── cors.py             # CORS configuration
│       └── logging.py          # Request logging
├── requirements.txt
└── Dockerfile
```

## Database Schema

### MongoDB Collections

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  name: String,
  avatar: String,
  preferences: {
    defaultSourceLanguage: String,
    defaultTargetLanguage: String,
    theme: String,
    notifications: Boolean
  },
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date,
  isActive: Boolean
}
```

#### Meetings Collection
```javascript
{
  _id: ObjectId,
  meetingId: String,           // Unique meeting identifier
  title: String,
  hostId: ObjectId,            // Reference to Users collection
  participants: [{
    userId: ObjectId,
    name: String,
    role: String,              // host, co-host, participant
    joinedAt: Date,
    leftAt: Date,
    languagePreferences: {
      sourceLanguage: String,
      targetLanguage: String
    }
  }],
  settings: {
    maxParticipants: Number,
    recordingEnabled: Boolean,
    transcriptionEnabled: Boolean,
    autoTranslate: Boolean
  },
  status: String,              // scheduled, active, ended, cancelled
  scheduledAt: Date,
  startedAt: Date,
  endedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Transcripts Collection
```javascript
{
  _id: ObjectId,
  meetingId: ObjectId,         // Reference to Meetings collection
  speakerId: ObjectId,         // Reference to Users collection
  timestamp: Date,
  originalText: String,
  sourceLanguage: String,
  translations: [{
    targetLanguage: String,
    translatedText: String,
    confidence: Number
  }],
  confidence: Number,
  isFinal: Boolean,
  audioSegment: {
    startTime: Number,
    endTime: Number,
    audioUrl: String           // Optional: stored audio segment
  }
}
```

#### Sessions Collection
```javascript
{
  _id: ObjectId,
  sessionId: String,           // WebSocket session identifier
  userId: ObjectId,            // Reference to Users collection
  meetingId: ObjectId,         // Reference to Meetings collection
  connectionInfo: {
    userAgent: String,
    ipAddress: String,
    location: String
  },
  status: String,              // connected, disconnected, reconnected
  connectedAt: Date,
  disconnectedAt: Date,
  lastActivity: Date
}
```

## API Design

### RESTful Endpoints

#### Authentication
```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
GET    /api/v1/auth/profile
PUT    /api/v1/auth/profile
```

#### Meetings
```
GET    /api/v1/meetings
POST   /api/v1/meetings
GET    /api/v1/meetings/{meeting_id}
PUT    /api/v1/meetings/{meeting_id}
DELETE /api/v1/meetings/{meeting_id}
POST   /api/v1/meetings/{meeting_id}/join
POST   /api/v1/meetings/{meeting_id}/leave
GET    /api/v1/meetings/{meeting_id}/participants
```

#### Translation
```
POST   /api/v1/translation/translate
POST   /api/v1/translation/stream
GET    /api/v1/translation/languages
POST   /api/v1/translation/detect
```

#### Transcripts
```
GET    /api/v1/transcripts/{meeting_id}
POST   /api/v1/transcripts/{meeting_id}/export
DELETE /api/v1/transcripts/{meeting_id}
```

### WebSocket Events

#### Client to Server
```javascript
// Join meeting
{
  type: 'join_meeting',
  data: {
    meetingId: string,
    userId: string,
    languagePreferences: object
  }
}

// Audio stream
{
  type: 'audio_stream',
  data: {
    meetingId: string,
    userId: string,
    audioData: ArrayBuffer,
    timestamp: number
  }
}

// Translation request
{
  type: 'translate',
  data: {
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  }
}
```

#### Server to Client
```javascript
// Transcription update
{
  type: 'transcription_update',
  data: {
    speakerId: string,
    text: string,
    isFinal: boolean,
    confidence: number,
    timestamp: number
  }
}

// Translation update
{
  type: 'translation_update',
  data: {
    originalText: string,
    translatedText: string,
    sourceLanguage: string,
    targetLanguage: string,
    timestamp: number
  }
}

// Participant update
{
  type: 'participant_update',
  data: {
    action: 'join' | 'leave' | 'mute' | 'unmute',
    participant: object
  }
}
```

## Data Flow

### LinguaLive Standalone Flow
1. **Audio Capture**: Browser microphone → Audio processing → WebSocket stream
2. **STT Processing**: Audio stream → Google Cloud Speech-to-Text → Text output
3. **Translation**: Text → Google Cloud Translate → Translated text
4. **UI Update**: Real-time updates to transcription and translation displays

### LinguaLive Meet Flow
1. **Meeting Setup**: User creates/joins meeting → WebRTC connection established
2. **Audio Capture**: Multiple participants → Audio mixing → STT processing
3. **Translation Pipeline**: STT output → Language detection → Multi-language translation
4. **Subtitle Distribution**: Translated text → Real-time subtitle overlay
5. **Transcript Storage**: All interactions → MongoDB storage → Export capabilities

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **OAuth 2.0**: Google login integration
- **Role-based Access**: Host, co-host, participant permissions
- **Session Management**: Secure session handling with Redis

### Data Protection
- **End-to-End Encryption**: WebRTC audio/video streams
- **TLS/SSL**: All API communications encrypted
- **Data Encryption**: MongoDB data encryption at rest
- **GDPR Compliance**: Data retention and deletion policies

### API Security
- **Rate Limiting**: Prevent abuse and DDoS attacks
- **Input Validation**: Comprehensive input sanitization
- **CORS Configuration**: Proper cross-origin resource sharing
- **API Versioning**: Backward compatibility management

## Scalability Considerations

### Horizontal Scaling
- **Load Balancing**: Azure Application Gateway for traffic distribution
- **Microservices**: Separate services for different functionalities
- **Database Sharding**: MongoDB sharding for large datasets
- **CDN Integration**: Global content delivery for static assets

### Performance Optimization
- **Caching Strategy**: Redis for session and translation caching
- **Connection Pooling**: Database connection optimization
- **Audio Compression**: Efficient audio processing and transmission
- **Lazy Loading**: On-demand resource loading

### Monitoring & Observability
- **Application Monitoring**: Azure Monitor for performance metrics
- **Error Tracking**: Sentry for real-time error monitoring
- **Logging**: Structured logging with correlation IDs
- **Health Checks**: Comprehensive health monitoring endpoints 