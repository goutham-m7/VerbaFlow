# API Documentation

## Overview

The VerbaFlow API provides RESTful endpoints and WebSocket connections for both LinguaLive applications. All endpoints return JSON responses and use standard HTTP status codes.

## Base URL

```
Production: https://api.verbaflow.com
Development: http://localhost:8000
```

## Authentication

### JWT Token Authentication

Most endpoints require authentication via JWT tokens in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Guest Access

Some endpoints support guest access with limited functionality using session tokens.

## REST API Endpoints

### Authentication

#### POST /api/v1/auth/login
Authenticate user with Google OAuth or email/password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "preferences": {
      "defaultSourceLanguage": "en",
      "defaultTargetLanguage": "es",
      "theme": "light",
      "notifications": true
    }
  }
}
```

#### POST /api/v1/auth/google
Authenticate with Google OAuth.

**Request Body:**
```json
{
  "id_token": "google_id_token_here"
}
```

#### POST /api/v1/auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### GET /api/v1/auth/profile
Get current user profile.

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://example.com/avatar.jpg",
  "preferences": {
    "defaultSourceLanguage": "en",
    "defaultTargetLanguage": "es",
    "theme": "light",
    "notifications": true
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLogin": "2024-01-15T10:30:00Z"
}
```

#### PUT /api/v1/auth/profile
Update user profile.

**Request Body:**
```json
{
  "name": "John Smith",
  "preferences": {
    "defaultSourceLanguage": "fr",
    "defaultTargetLanguage": "de",
    "theme": "dark",
    "notifications": false
  }
}
```

### Meetings

#### GET /api/v1/meetings
Get user's meetings (paginated).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `status`: Filter by status (scheduled, active, ended, cancelled)
- `search`: Search in meeting titles

**Response:**
```json
{
  "meetings": [
    {
      "id": "507f1f77bcf86cd799439011",
      "meetingId": "abc123def456",
      "title": "Team Standup",
      "hostId": "507f1f77bcf86cd799439012",
      "hostName": "John Doe",
      "participantCount": 5,
      "status": "active",
      "scheduledAt": "2024-01-15T09:00:00Z",
      "startedAt": "2024-01-15T09:05:00Z",
      "createdAt": "2024-01-14T15:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### POST /api/v1/meetings
Create a new meeting.

**Request Body:**
```json
{
  "title": "Team Standup",
  "scheduledAt": "2024-01-15T09:00:00Z",
  "settings": {
    "maxParticipants": 20,
    "recordingEnabled": true,
    "transcriptionEnabled": true,
    "autoTranslate": true
  }
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "meetingId": "abc123def456",
  "title": "Team Standup",
  "joinUrl": "https://meet.verbaflow.com/abc123def456",
  "hostId": "507f1f77bcf86cd799439012",
  "status": "scheduled",
  "scheduledAt": "2024-01-15T09:00:00Z",
  "createdAt": "2024-01-14T15:00:00Z"
}
```

#### GET /api/v1/meetings/{meeting_id}
Get meeting details.

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "meetingId": "abc123def456",
  "title": "Team Standup",
  "hostId": "507f1f77bcf86cd799439012",
  "hostName": "John Doe",
  "participants": [
    {
      "userId": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "role": "host",
      "joinedAt": "2024-01-15T09:05:00Z",
      "languagePreferences": {
        "sourceLanguage": "en",
        "targetLanguage": "es"
      }
    }
  ],
  "settings": {
    "maxParticipants": 20,
    "recordingEnabled": true,
    "transcriptionEnabled": true,
    "autoTranslate": true
  },
  "status": "active",
  "scheduledAt": "2024-01-15T09:00:00Z",
  "startedAt": "2024-01-15T09:05:00Z",
  "createdAt": "2024-01-14T15:00:00Z"
}
```

#### POST /api/v1/meetings/{meeting_id}/join
Join a meeting.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "languagePreferences": {
    "sourceLanguage": "en",
    "targetLanguage": "fr"
  }
}
```

**Response:**
```json
{
  "meetingId": "abc123def456",
  "participantId": "507f1f77bcf86cd799439013",
  "webrtcToken": "100ms_webrtc_token_here",
  "websocketUrl": "wss://api.verbaflow.com/ws"
}
```

#### POST /api/v1/meetings/{meeting_id}/leave
Leave a meeting.

**Response:**
```json
{
  "message": "Successfully left the meeting"
}
```

### Translation

#### POST /api/v1/translation/translate
Translate text to target language.

**Request Body:**
```json
{
  "text": "Hello, how are you?",
  "sourceLanguage": "en",
  "targetLanguage": "es"
}
```

**Response:**
```json
{
  "originalText": "Hello, how are you?",
  "translatedText": "Hola, ¿cómo estás?",
  "sourceLanguage": "en",
  "targetLanguage": "es",
  "confidence": 0.95
}
```

#### POST /api/v1/translation/stream
Start streaming translation session.

**Request Body:**
```json
{
  "sourceLanguage": "en",
  "targetLanguage": "es",
  "sessionId": "unique_session_id"
}
```

**Response:**
```json
{
  "sessionId": "unique_session_id",
  "websocketUrl": "wss://api.verbaflow.com/ws/translation"
}
```

#### GET /api/v1/translation/languages
Get supported languages.

**Response:**
```json
{
  "languages": [
    {
      "code": "en",
      "name": "English",
      "nativeName": "English"
    },
    {
      "code": "es",
      "name": "Spanish",
      "nativeName": "Español"
    }
  ]
}
```

#### POST /api/v1/translation/detect
Detect language of text.

**Request Body:**
```json
{
  "text": "Bonjour, comment allez-vous?"
}
```

**Response:**
```json
{
  "detectedLanguage": "fr",
  "confidence": 0.98
}
```

### Transcripts

#### GET /api/v1/transcripts/{meeting_id}
Get meeting transcript.

**Query Parameters:**
- `language`: Filter by language (default: all)
- `speaker`: Filter by speaker ID
- `startTime`: Filter from timestamp
- `endTime`: Filter to timestamp

**Response:**
```json
{
  "meetingId": "abc123def456",
  "transcripts": [
    {
      "id": "507f1f77bcf86cd799439014",
      "speakerId": "507f1f77bcf86cd799439012",
      "speakerName": "John Doe",
      "timestamp": "2024-01-15T09:10:00Z",
      "originalText": "Good morning everyone",
      "sourceLanguage": "en",
      "translations": [
        {
          "targetLanguage": "es",
          "translatedText": "Buenos días a todos",
          "confidence": 0.95
        }
      ],
      "confidence": 0.98,
      "isFinal": true
    }
  ],
  "summary": {
    "totalEntries": 150,
    "duration": 3600,
    "languages": ["en", "es", "fr"],
    "speakers": 5
  }
}
```

#### POST /api/v1/transcripts/{meeting_id}/export
Export transcript in various formats.

**Request Body:**
```json
{
  "format": "srt", // txt, json, srt
  "language": "es", // optional: specific language
  "includeOriginal": true
}
```

**Response:**
```json
{
  "downloadUrl": "https://api.verbaflow.com/downloads/transcript_abc123.srt",
  "expiresAt": "2024-01-16T09:10:00Z"
}
```

## WebSocket API

### Connection

Connect to WebSocket endpoint:

```
wss://api.verbaflow.com/ws
```

### Authentication

Send authentication message after connection:

```json
{
  "type": "authenticate",
  "data": {
    "token": "jwt_token_here"
  }
}
```

### Meeting Events

#### Join Meeting
```json
{
  "type": "join_meeting",
  "data": {
    "meetingId": "abc123def456",
    "participantId": "507f1f77bcf86cd799439013",
    "languagePreferences": {
      "sourceLanguage": "en",
      "targetLanguage": "es"
    }
  }
}
```

#### Audio Stream
```json
{
  "type": "audio_stream",
  "data": {
    "meetingId": "abc123def456",
    "participantId": "507f1f77bcf86cd799439013",
    "audioData": "base64_encoded_audio",
    "timestamp": 1642234567890
  }
}
```

#### Participant Update
```json
{
  "type": "participant_update",
  "data": {
    "action": "mute", // join, leave, mute, unmute, video_on, video_off
    "participantId": "507f1f77bcf86cd799439013",
    "participantName": "Jane Smith"
  }
}
```

### Server Events

#### Transcription Update
```json
{
  "type": "transcription_update",
  "data": {
    "speakerId": "507f1f77bcf86cd799439013",
    "speakerName": "Jane Smith",
    "text": "Hello everyone",
    "isFinal": false,
    "confidence": 0.95,
    "timestamp": 1642234567890
  }
}
```

#### Translation Update
```json
{
  "type": "translation_update",
  "data": {
    "speakerId": "507f1f77bcf86cd799439013",
    "originalText": "Hello everyone",
    "translatedText": "Hola a todos",
    "sourceLanguage": "en",
    "targetLanguage": "es",
    "timestamp": 1642234567890
  }
}
```

#### Participant List Update
```json
{
  "type": "participant_list_update",
  "data": {
    "participants": [
      {
        "id": "507f1f77bcf86cd799439013",
        "name": "Jane Smith",
        "role": "participant",
        "isMuted": false,
        "isVideoOn": true,
        "joinedAt": "2024-01-15T09:10:00Z"
      }
    ]
  }
}
```

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_FAILED` | 401 | Invalid or expired token |
| `AUTHORIZATION_FAILED` | 403 | Insufficient permissions |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

## Rate Limiting

- **Authenticated users**: 1000 requests per hour
- **Guest users**: 100 requests per hour
- **WebSocket connections**: 10 concurrent connections per user

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642234567
```

## Pagination

List endpoints support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## SDK Examples

### JavaScript/TypeScript
```javascript
import { VerbaFlowAPI } from '@verbaflow/sdk';

const api = new VerbaFlowAPI({
  baseUrl: 'https://api.verbaflow.com',
  token: 'your_jwt_token'
});

// Create meeting
const meeting = await api.meetings.create({
  title: 'Team Standup',
  scheduledAt: new Date('2024-01-15T09:00:00Z')
});

// Join meeting
const joinData = await api.meetings.join(meeting.meetingId, {
  name: 'John Doe',
  languagePreferences: {
    sourceLanguage: 'en',
    targetLanguage: 'es'
  }
});
```

### Python
```python
from verbaflow import VerbaFlowAPI

api = VerbaFlowAPI(
    base_url="https://api.verbaflow.com",
    token="your_jwt_token"
)

# Create meeting
meeting = api.meetings.create(
    title="Team Standup",
    scheduled_at="2024-01-15T09:00:00Z"
)

# Join meeting
join_data = api.meetings.join(
    meeting.meeting_id,
    name="John Doe",
    language_preferences={
        "source_language": "en",
        "target_language": "es"
    }
)
``` 