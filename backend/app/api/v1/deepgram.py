from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from typing import List, Optional
import base64
from app.services.deepgram import deepgram_service
from app.services.translation import translation_service
from fastapi import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState
import asyncio
import json

router = APIRouter()

class DeepgramTranscriptionRequest(BaseModel):
    audio_data: str  # Base64 encoded audio data
    language: str = "en"
    auto_detect: bool = True

class DeepgramTranscriptionResponse(BaseModel):
    success: bool
    transcript: str
    confidence: float
    detected_language: str
    detection_confidence: float
    is_reliable_detection: bool
    words: List[dict]
    error: Optional[str] = None

class DeepgramLanguageDetectionRequest(BaseModel):
    audio_data: str  # Base64 encoded audio data

class DeepgramLanguageDetectionResponse(BaseModel):
    success: bool
    detected_language: str
    confidence: float
    is_reliable: bool
    error: Optional[str] = None

class DeepgramTranslationRequest(BaseModel):
    audio_data: str  # Base64 encoded audio data
    target_language: str = "en"
    auto_detect: bool = True

class DeepgramTranslationResponse(BaseModel):
    success: bool
    original_transcript: str
    translated_text: str
    detected_language: str
    detection_confidence: float
    translation_confidence: float
    is_reliable_detection: bool
    error: Optional[str] = None

class LanguageInfo(BaseModel):
    code: str
    name: str

@router.post("/transcribe", response_model=DeepgramTranscriptionResponse)
async def transcribe_audio(request: DeepgramTranscriptionRequest):
    """Transcribe audio using Deepgram with optional language detection"""
    try:
        # Decode base64 audio data
        audio_data = base64.b64decode(request.audio_data)
        
        if request.auto_detect:
            # First detect language
            detection_result = await deepgram_service.detect_language(audio_data)
            if detection_result["success"]:
                language = detection_result["detected_language"]
            else:
                language = request.language
        else:
            language = request.language
        
        # Transcribe with detected or specified language
        result = await deepgram_service.transcribe_audio_data(audio_data, language)
        
        if result["success"]:
            return DeepgramTranscriptionResponse(
                success=True,
                transcript=result["transcript"],
                confidence=result["confidence"],
                detected_language=result["detected_language"],
                detection_confidence=result["detection_confidence"],
                is_reliable_detection=result["detection_confidence"] > 0.8,
                words=result["words"]
            )
        else:
            return DeepgramTranscriptionResponse(
                success=False,
                transcript="",
                confidence=0.0,
                detected_language="",
                detection_confidence=0.0,
                is_reliable_detection=False,
                words=[],
                error=result["error"]
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@router.post("/detect-language", response_model=DeepgramLanguageDetectionResponse)
async def detect_language(request: DeepgramLanguageDetectionRequest):
    """Detect language from audio using Deepgram"""
    try:
        # Decode base64 audio data
        audio_data = base64.b64decode(request.audio_data)
        
        result = await deepgram_service.detect_language(audio_data)
        
        if result["success"]:
            return DeepgramLanguageDetectionResponse(
                success=True,
                detected_language=result["detected_language"],
                confidence=result["confidence"],
                is_reliable=result["is_reliable"]
            )
        else:
            return DeepgramLanguageDetectionResponse(
                success=False,
                detected_language="",
                confidence=0.0,
                is_reliable=False,
                error=result["error"]
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Language detection failed: {str(e)}")

@router.post("/translate", response_model=DeepgramTranslationResponse)
async def translate_audio(request: DeepgramTranslationRequest):
    """Transcribe and translate audio using Deepgram and Google Translate"""
    try:
        # Decode base64 audio data
        audio_data = base64.b64decode(request.audio_data)
        
        # First transcribe the audio
        transcription_result = await deepgram_service.transcribe_audio_data(
            audio_data, 
            "en" if request.auto_detect else "en"  # We'll detect language during transcription
        )
        
        if not transcription_result["success"]:
            return DeepgramTranslationResponse(
                success=False,
                original_transcript="",
                translated_text="",
                detected_language="",
                detection_confidence=0.0,
                translation_confidence=0.0,
                is_reliable_detection=False,
                error=transcription_result["error"]
            )
        
        transcript = transcription_result["transcript"]
        detected_language = transcription_result["detected_language"]
        detection_confidence = transcription_result["detection_confidence"]
        
        # If detected language is the same as target language, return original
        if detected_language == request.target_language:
            return DeepgramTranslationResponse(
                success=True,
                original_transcript=transcript,
                translated_text=transcript,
                detected_language=detected_language,
                detection_confidence=detection_confidence,
                translation_confidence=1.0,
                is_reliable_detection=detection_confidence > 0.8
            )
        
        # Translate the transcript
        translation_result = translation_service.translate_text(
            transcript,
            detected_language,
            request.target_language,
            enable_punctuation=True
        )
        
        return DeepgramTranslationResponse(
            success=True,
            original_transcript=transcript,
            translated_text=translation_result["translated_text"],
            detected_language=detected_language,
            detection_confidence=detection_confidence,
            translation_confidence=translation_result["confidence"],
            is_reliable_detection=detection_confidence > 0.8
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

@router.post("/transcribe-file")
async def transcribe_file(
    file: UploadFile = File(...),
    language: str = Form("en"),
    auto_detect: bool = Form(True)
):
    """Transcribe uploaded audio file using Deepgram"""
    try:
        if not file.filename.lower().endswith(('.wav', '.mp3', '.m4a', '.flac')):
            raise HTTPException(status_code=400, detail="Unsupported audio format")
        
        audio_data = await file.read()
        
        if auto_detect:
            # First detect language
            detection_result = await deepgram_service.detect_language(audio_data)
            if detection_result["success"]:
                language = detection_result["detected_language"]
        
        # Transcribe with detected or specified language
        result = await deepgram_service.transcribe_audio_data(audio_data, language)
        
        if result["success"]:
            return {
                "success": True,
                "transcript": result["transcript"],
                "confidence": result["confidence"],
                "detected_language": result["detected_language"],
                "detection_confidence": result["detection_confidence"],
                "is_reliable_detection": result["detection_confidence"] > 0.8,
                "words": result["words"]
            }
        else:
            return {
                "success": False,
                "error": result["error"]
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File transcription failed: {str(e)}")

@router.get("/languages", response_model=List[LanguageInfo])
async def get_supported_languages():
    """Get list of supported languages for Deepgram"""
    return deepgram_service.get_supported_languages()

@router.get("/status")
async def get_service_status():
    """Get Deepgram service status"""
    return {
        "available": deepgram_service.is_available(),
        "api_key_configured": deepgram_service.api_key is not None
    }

# --- NEW: Live Transcription WebSocket Endpoint ---
@router.websocket("/ws/live-transcribe")
async def websocket_live_transcribe(websocket: WebSocket):
    """
    WebSocket endpoint for live audio transcription using Deepgram.
    The client should send raw audio chunks (bytes) as binary messages.
    The server streams these to Deepgram and sends back transcription results as JSON text messages.
    Now also includes detected language and confidence for each transcript.
    """
    await websocket.accept()
    print('WebSocket connection accepted')
    try:
        # Get language from query params
        language = websocket.query_params.get('language', 'en')
        # Async generator for audio chunks from client
        async def audio_stream():
            while True:
                if websocket.application_state != WebSocketState.CONNECTED:
                    break
                try:
                    data = await websocket.receive_bytes()
                    print(f'Received audio chunk: {len(data)} bytes')
                    yield data
                except Exception:
                    break
        # Stream to Deepgram and send results back
        async for result in deepgram_service.transcribe_live_audio_stream(audio_stream(), language=language):
            print(f'Sending transcript: {result}')
            # Detect language of the transcript using Google Translate
            transcript = None
            if result and result.get('channel') and result['channel'].get('alternatives'):
                transcript = result['channel']['alternatives'][0].get('transcript', '')
            detected_language = None
            detection_confidence = None
            if transcript and transcript.strip():
                try:
                    detection = translation_service.detect_language(transcript)
                    detected_language = detection.get('detected_language', '')
                    detection_confidence = detection.get('confidence', 0.0)
                except Exception as e:
                    print(f'Language detection error: {e}')
            # Send transcript + language detection to frontend
            await websocket.send_json({
                'result': result,
                'detected_language': detected_language,
                'detection_confidence': detection_confidence
            })
    except WebSocketDisconnect:
        print('WebSocket disconnected')
        pass
    except Exception as e:
        print(f'WebSocket error: {e}')
        await websocket.close(code=1011, reason=f"Internal error: {e}")

@router.websocket("/ws/live-translate")
async def websocket_live_translate(websocket: WebSocket):
    """
    WebSocket endpoint for real-time translation.
    The client sends JSON messages: {"text": ..., "target_language": ...}
    The server responds with JSON: {"translated_text": ..., "target_language": ...}
    """
    await websocket.accept()
    print('Live-translate WebSocket connection accepted')
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                text = payload.get('text', '')
                target_language = payload.get('target_language', 'en')
                if not text.strip():
                    continue
                # Use translation_service to translate
                result = translation_service.translate_text(
                    text,
                    target_language=target_language
                )
                response = {
                    'translated_text': result['translated_text'],
                    'target_language': target_language
                }
                await websocket.send_json(response)
            except Exception as e:
                print(f'Live-translate error: {e}')
                await websocket.send_json({'error': str(e)})
    except WebSocketDisconnect:
        print('Live-translate WebSocket disconnected')
        pass
    except Exception as e:
        print(f'Live-translate WebSocket error: {e}')
        await websocket.close(code=1011, reason=f"Internal error: {e}") 