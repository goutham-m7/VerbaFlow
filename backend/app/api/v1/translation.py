from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from app.services.translation import translation_service
from app.services.tts import tts_service

router = APIRouter()

class TranslationRequest(BaseModel):
    text: str
    source_language: str = "en"
    target_language: str = "es"
    enable_punctuation: bool = True

class TranslationWithDetectionRequest(BaseModel):
    text: str
    target_language: str = "en"
    auto_detect: bool = True
    enable_punctuation: bool = True

class LanguageDetectionRequest(BaseModel):
    text: str

class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: str
    target_language: str
    confidence: float

class TranslationWithDetectionResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: str
    target_language: str
    confidence: float
    detected_language: str
    detection_confidence: float
    is_reliable_detection: bool

class LanguageDetectionResponse(BaseModel):
    detected_language: str
    confidence: float
    is_reliable: bool

class LanguageInfo(BaseModel):
    code: str
    name: str
    native_name: str

class TTSRequest(BaseModel):
    text: str
    language_code: str = "en-US"
    voice_name: Optional[str] = None
    provider: str = "google"

class TTSResponse(BaseModel):
    success: bool
    provider: str
    text: str
    language_code: str
    voice_name: Optional[str] = None
    audio_data: Optional[str] = None  # Base64 encoded audio
    audio_format: Optional[str] = None
    error: Optional[str] = None

@router.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    result = translation_service.translate_text(
        text=request.text,
        source_language=request.source_language,
        target_language=request.target_language,
        enable_punctuation=request.enable_punctuation
    )
    return TranslationResponse(**result)

@router.post("/translate-with-detection", response_model=TranslationWithDetectionResponse)
async def translate_with_detection(request: TranslationWithDetectionRequest):
    """Translate text with automatic language detection"""
    result = translation_service.translate_with_detection(
        text=request.text,
        target_language=request.target_language,
        auto_detect=request.auto_detect,
        enable_punctuation=request.enable_punctuation
    )
    return TranslationWithDetectionResponse(**result)

@router.post("/detect-language", response_model=LanguageDetectionResponse)
async def detect_language(request: LanguageDetectionRequest):
    """Detect the language of the input text"""
    result = translation_service.detect_language(request.text)
    return LanguageDetectionResponse(**result)

@router.get("/languages", response_model=List[LanguageInfo])
async def get_languages():
    """Mock languages endpoint for testing"""
    return [
        LanguageInfo(code="en", name="English", native_name="English"),
        LanguageInfo(code="es", name="Spanish", native_name="Español"),
        LanguageInfo(code="fr", name="French", native_name="Français"),
        LanguageInfo(code="de", name="German", native_name="Deutsch"),
        LanguageInfo(code="it", name="Italian", native_name="Italiano"),
        LanguageInfo(code="pt", name="Portuguese", native_name="Português"),
        LanguageInfo(code="ru", name="Russian", native_name="Русский"),
        LanguageInfo(code="ja", name="Japanese", native_name="日本語"),
        LanguageInfo(code="ko", name="Korean", native_name="한국어"),
        LanguageInfo(code="zh", name="Chinese", native_name="中文")
    ]

@router.post("/tts", response_model=TTSResponse)
async def text_to_speech(request: TTSRequest):
    """Text-to-speech endpoint"""
    result = tts_service.synthesize_speech(
        text=request.text,
        language_code=request.language_code,
        voice_name=request.voice_name,
        provider=request.provider
    )
    
    # Convert audio data to base64 if present
    if result.get("audio_data"):
        import base64
        result["audio_data"] = base64.b64encode(result["audio_data"]).decode('utf-8')
    
    return TTSResponse(**result)

@router.get("/tts/voices/{language_code}")
async def get_voices(language_code: str = "en-US"):
    """Get available voices for a language"""
    voices = tts_service.get_available_voices(language_code)
    return {"voices": voices} 