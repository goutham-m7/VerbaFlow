# VerbaFlow - LinguaLive Platform

Real-time speech translation and video conferencing platform with multilingual capabilities.

## Applications

### 1. LinguaLive
Standalone real-time speech translator with microphone input, live transcription, and translation.

### 2. LinguaLive Meet  
Full-featured video conferencing platform with WebRTC, real-time multilingual subtitles, and transcript management.

## Tech Stack

- **Frontend**: React, Tailwind CSS, Material UI, Chakra UI
- **Backend**: FastAPI (Python), MongoDB Atlas
- **Speech-to-Text**: Google Cloud Speech-to-Text (Streaming)
- **Translation**: Google Cloud Translate API
- **WebRTC**: 100ms SDK
- **Hosting**: Azure Web Apps
- **CI/CD**: GitHub Actions
- **Observability**: Azure Monitor + Sentry

## Quick Start

```bash
# Clone and setup
git clone <repository>
cd VerbaFlow

# Backend setup
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend setup
cd frontend
npm install
npm start
```

## Documentation

- [Product Requirements](./docs/PRDs.md)
- [System Architecture](./docs/architecture.md)
- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)