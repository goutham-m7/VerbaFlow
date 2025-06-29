import os
from typing import Optional, Dict, Any
from google.cloud import texttospeech
from app.config.settings import settings
import logging

logger = logging.getLogger(__name__)

class TTSService:
    def __init__(self):
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Google Cloud Text-to-Speech client"""
        try:
            # Check if credentials are provided via environment variable
            if settings.google_application_credentials:
                os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = settings.google_application_credentials
            
            # Check if project ID is set
            if settings.google_cloud_project and settings.google_cloud_project != "your-google-project-id":
                self.client = texttospeech.TextToSpeechClient()
                logger.info("Google Cloud Text-to-Speech client initialized")
            else:
                logger.warning("Google Cloud project ID not configured, using browser TTS")
                self.client = None
                
        except Exception as e:
            logger.error(f"Failed to initialize Google Cloud Text-to-Speech client: {e}")
            self.client = None
    
    def synthesize_speech(
        self, 
        text: str, 
        language_code: str = "en-US",
        voice_name: Optional[str] = None,
        provider: str = "google"
    ) -> Dict[str, Any]:
        """
        Synthesize speech using Google Cloud Text-to-Speech API
        
        Args:
            text: Text to synthesize
            language_code: Language code (e.g., 'en-US', 'es-ES', 'zh-CN')
            voice_name: Specific voice name (optional)
            provider: TTS provider ('google' or 'browser')
            
        Returns:
            Dictionary with TTS results
        """
        if not text.strip():
            return {
                "success": False,
                "error": "No text provided",
                "audio_data": None,
                "provider": provider
            }
        
        # If Google Cloud client is not available or browser TTS requested, return browser TTS info
        if not self.client or provider == "browser":
            return {
                "success": True,
                "provider": "browser",
                "text": text,
                "language_code": language_code,
                "voice_name": voice_name,
                "audio_data": None  # Browser TTS doesn't return audio data
            }
        
        try:
            # Set up the text input
            synthesis_input = texttospeech.SynthesisInput(text=text)
            
            # Build the voice request
            voice = texttospeech.VoiceSelectionParams(
                language_code=language_code,
                name=voice_name if voice_name else None,
                ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
            )
            
            # Select the type of audio file to return
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=1.0,
                pitch=0.0
            )
            
            # Perform the text-to-speech request
            response = self.client.synthesize_speech(
                input=synthesis_input, voice=voice, audio_config=audio_config
            )
            
            return {
                "success": True,
                "provider": "google",
                "text": text,
                "language_code": language_code,
                "voice_name": voice_name,
                "audio_data": response.audio_content,
                "audio_format": "mp3"
            }
            
        except Exception as e:
            logger.error(f"Google Cloud Text-to-Speech API error: {e}")
            return {
                "success": False,
                "error": str(e),
                "provider": "google",
                "audio_data": None
            }
    
    def get_available_voices(self, language_code: str = "en-US") -> list:
        """Get list of available voices for a language"""
        try:
            if self.client:
                # Get available voices from Google Cloud
                request = texttospeech.ListVoicesRequest(language_code=language_code)
                response = self.client.list_voices(request=request)
                return [
                    {
                        "name": voice.name,
                        "language_code": voice.language_codes[0],
                        "ssml_gender": voice.ssml_gender.name,
                        "natural_sample_rate_hertz": voice.natural_sample_rate_hertz
                    }
                    for voice in response.voices
                ]
            else:
                # Return mock voices for browser TTS
                return [
                    {
                        "name": "browser-default",
                        "language_code": language_code,
                        "ssml_gender": "NEUTRAL",
                        "natural_sample_rate_hertz": 22050
                    }
                ]
        except Exception as e:
            logger.error(f"Error getting available voices: {e}")
            return []

# Create singleton instance
tts_service = TTSService() 