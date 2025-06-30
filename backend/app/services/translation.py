import os
import re
import json
import tempfile
from typing import Optional, Dict, Any, List
from google.cloud import translate
from google.oauth2 import service_account
from app.config.settings import settings
import logging

logger = logging.getLogger(__name__)

class TranslationService:
    def __init__(self):
        self.client = None
        self.project_id = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Google Cloud Translate client"""
        try:
            # Handle Google Cloud credentials
            if settings.google_application_credentials:
                # Check if it's a JSON string or file path
                if settings.google_application_credentials.strip().startswith('{'):
                    # It's a JSON string - create a temporary file
                    try:
                        # Parse the JSON to validate it
                        creds_json = json.loads(settings.google_application_credentials)
                        
                        # Create a temporary file with the credentials
                        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
                            json.dump(creds_json, temp_file)
                            temp_file_path = temp_file.name
                        
                        # Set the environment variable to point to the temporary file
                        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_file_path
                        logger.info(f"Created temporary credentials file: {temp_file_path}")
                        
                    except json.JSONDecodeError as e:
                        logger.error(f"Invalid JSON in GOOGLE_APPLICATION_CREDENTIALS: {e}")
                        self.client = None
                        return
                else:
                    # It's a file path - use it directly
                    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = settings.google_application_credentials
                    logger.info(f"Using credentials file: {settings.google_application_credentials}")
            
            # Check if project ID is set
            if settings.google_cloud_project and settings.google_cloud_project != "your-google-project-id":
                self.client = translate.TranslationServiceClient()
                self.project_id = settings.google_cloud_project
                logger.info(f"Google Cloud Translate client initialized with project: {self.project_id}")
            else:
                logger.warning("Google Cloud project ID not configured.")
                self.client = None
                
        except Exception as e:
            logger.error(f"Failed to initialize Google Cloud Translate client: {e}")
            self.client = None
    
    def detect_language(self, text: str) -> Dict[str, Any]:
        """
        Detect the language of the input text using Google Cloud Translate API
        
        Args:
            text: Text to detect language for
            
        Returns:
            Dictionary with detection results
        """
        if not text.strip():
            return {
                "detected_language": "en",
                "confidence": 0.0,
                "is_reliable": False
            }
        
        if not self.client:
            raise RuntimeError("Google Cloud Translate client is not initialized.")
        
        try:
            # Use the TranslationServiceClient for language detection
            location = "global"
            parent = f"projects/{self.project_id}/locations/{location}"
            
            request = translate.DetectLanguageRequest(
                parent=parent,
                content=text,
                mime_type="text/plain",
            )
            
            response = self.client.detect_language(request=request)
            
            # Get the first detected language
            if response.languages:
                detected_lang = response.languages[0]
                logger.info(f"Google Cloud detected language: {detected_lang.language_code} with confidence {detected_lang.confidence}")
                
                return {
                    "detected_language": detected_lang.language_code,
                    "confidence": detected_lang.confidence,
                    "is_reliable": detected_lang.confidence > 0.8
                }
            else:
                logger.warning("No language detected by Google Cloud")
                return {
                    "detected_language": "en",
                    "confidence": 0.0,
                    "is_reliable": False
                }
            
        except Exception as e:
            logger.error(f"Google Cloud language detection error: {e}")
            raise
    
    def translate_with_detection(
        self, 
        text: str, 
        target_language: str = "en",
        auto_detect: bool = True,
        enable_punctuation: bool = True
    ) -> Dict[str, Any]:
        """
        Translate text with automatic language detection
        
        Args:
            text: Text to translate
            target_language: Target language code (e.g., 'en', 'es', 'zh')
            auto_detect: Whether to automatically detect source language
            enable_punctuation: Whether to enable punctuation processing
            
        Returns:
            Dictionary with translation and detection results
        """
        if not text.strip():
            return {
                "original_text": text,
                "translated_text": "",
                "source_language": "en",
                "target_language": target_language,
                "detected_language": "en",
                "confidence": 0.0,
                "detection_confidence": 0.0
            }
        
        # Detect source language if auto_detect is enabled
        source_language = "en"  # default
        detection_result = None
        
        if auto_detect:
            detection_result = self.detect_language(text)
            source_language = detection_result["detected_language"]
        
        # Check if detected language matches target language
        if source_language == target_language:
            # Return original text with optional punctuation processing
            processed_text = text
            if enable_punctuation:
                processed_text = process_translated_text(text, target_language)
            
            return {
                "original_text": text,
                "translated_text": processed_text,
                "source_language": source_language,
                "target_language": target_language,
                "confidence": 1.0,
                "detected_language": source_language if auto_detect else source_language,
                "detection_confidence": detection_result["confidence"] if detection_result else 1.0,
                "is_reliable_detection": detection_result["is_reliable"] if detection_result else True
            }
        
        # Perform translation
        translation_result = self.translate_text(text, source_language, target_language, enable_punctuation)
        
        # Combine results
        result = {
            "original_text": text,
            "translated_text": translation_result["translated_text"],
            "source_language": source_language,
            "target_language": target_language,
            "confidence": translation_result["confidence"],
            "detected_language": source_language if auto_detect else source_language,
            "detection_confidence": detection_result["confidence"] if detection_result else 1.0,
            "is_reliable_detection": detection_result["is_reliable"] if detection_result else True
        }
        
        return result
    
    def translate_text(
        self, 
        text: str, 
        source_language: str = "en", 
        target_language: str = "es",
        enable_punctuation: bool = True
    ) -> Dict[str, Any]:
        """
        Translate text using Google Cloud Translate API
        
        Args:
            text: Text to translate
            source_language: Source language code (e.g., 'en', 'es', 'zh')
            target_language: Target language code (e.g., 'en', 'es', 'zh')
            enable_punctuation: Whether to enable punctuation processing
            
        Returns:
            Dictionary with translation results
        """
        if not text.strip():
            return {
                "original_text": text,
                "translated_text": "",
                "source_language": source_language,
                "target_language": target_language,
                "confidence": 0.0
            }
        
        # Check if source and target languages are the same
        if source_language == target_language:
            # Return original text with optional punctuation processing
            processed_text = text
            if enable_punctuation:
                processed_text = process_translated_text(text, target_language)
            
            return {
                "original_text": text,
                "translated_text": processed_text,
                "source_language": source_language,
                "target_language": target_language,
                "confidence": 1.0  # No translation needed
            }
        
        # If Google Cloud client is not available, raise an error
        if not self.client:
            raise RuntimeError("Google Cloud Translate client is not initialized.")
        
        try:
            # Prepare the request
            location = "global"
            parent = f"projects/{self.project_id}/locations/{location}"
            
            # Create the translation request
            request = translate.TranslateTextRequest(
                parent=parent,
                contents=[text],
                mime_type="text/plain",
                source_language_code=source_language,
                target_language_code=target_language,
            )
            
            # Call the API
            response = self.client.translate_text(request=request)
            
            # Extract the translation
            translated_text = response.translations[0].translated_text if response.translations else ""
            
            return {
                "original_text": text,
                "translated_text": translated_text,
                "source_language": source_language,
                "target_language": target_language,
                "confidence": 1.0
            }
            
        except Exception as e:
            logger.error(f"Google Cloud translation error: {e}")
            raise

def process_translated_text(text: str, language: str = 'en') -> str:
    # Optionally add punctuation or other post-processing here
    return text

# Create singleton instance
translation_service = TranslationService()

# Punctuation restoration utility
def add_punctuation_to_text(text: str, language: str = 'en') -> str:
    """Add punctuation to text based on language patterns"""
    if not text or not text.strip():
        return text
    
    processed_text = text.strip()
    
    # Language-specific punctuation patterns
    punctuation_patterns = {
        'en': {
            'questions': r'\b(what|when|where|who|why|how|which|whose|whom|is|are|was|were|do|does|did|can|could|will|would|should|may|might)\b',
            'exclamations': r'\b(wow|oh|ah|amazing|incredible|fantastic|great|excellent|perfect|wonderful|terrible|awful|horrible|stop|wait|no|yes|please|thank you|thanks)\b',
            'greetings': r'\b(hello|hi|hey|good morning|good afternoon|good evening|goodbye|bye|see you)\b'
        },
        'es': {
            'questions': r'\b(qué|cuándo|dónde|quién|por qué|cómo|cuál|es|son|está|están|puede|podría|debería)\b',
            'exclamations': r'\b(hola|buenos días|buenas tardes|buenas noches|adiós|hasta luego|por favor|gracias|perdón|wow|increíble|fantástico)\b',
            'greetings': r'\b(hola|buenos días|buenas tardes|buenas noches|adiós|hasta luego)\b'
        },
        'fr': {
            'questions': r'\b(qu\'est-ce que|quand|où|qui|pourquoi|comment|quel|est|sont|peut|pourrait|devrait)\b',
            'exclamations': r'\b(bonjour|bonsoir|au revoir|s\'il vous plaît|merci|pardon|excusez-moi|wow|incroyable|fantastique)\b',
            'greetings': r'\b(bonjour|bonsoir|au revoir)\b'
        },
        'de': {
            'questions': r'\b(was|wann|wo|wer|warum|wie|welcher|ist|sind|kann|könnte|sollte)\b',
            'exclamations': r'\b(hallo|guten tag|guten abend|auf wiedersehen|bitte|danke|entschuldigung|wow|unglaublich|fantastisch)\b',
            'greetings': r'\b(hallo|guten tag|guten abend|auf wiedersehen)\b'
        },
        'zh': {
            'questions': r'\b(什么|什么时候|哪里|谁|为什么|怎么|哪个|是|可以|应该)\b',
            'exclamations': r'\b(你好|早上好|下午好|晚上好|再见|谢谢|请|对不起|哇|太棒了|不可思议)\b',
            'greetings': r'\b(你好|早上好|下午好|晚上好|再见)\b'
        },
        'ja': {
            'questions': r'\b(何|いつ|どこ|誰|なぜ|どう|どちら|です|できます|すべき)\b',
            'exclamations': r'\b(こんにちは|おはよう|こんばんは|さようなら|ありがとう|お願い|すみません|すごい|素晴らしい)\b',
            'greetings': r'\b(こんにちは|おはよう|こんばんは|さようなら)\b'
        }
    }
    
    # Get patterns for the language
    patterns = punctuation_patterns.get(language, punctuation_patterns['en'])
    
    # Check for questions
    if re.search(patterns['questions'], processed_text, re.IGNORECASE):
        if not processed_text.endswith('?'):
            processed_text += '?'
    # Check for exclamations
    elif re.search(patterns['exclamations'], processed_text, re.IGNORECASE):
        if not processed_text.endswith('!'):
            processed_text += '!'
    # Add period if no punctuation at the end
    elif not processed_text.endswith(('.', '!', '?', '。', '！', '？')):
        processed_text += '.'
    
    # Ensure proper capitalization
    if processed_text and processed_text[0].islower():
        processed_text = processed_text[0].upper() + processed_text[1:]
    
    # Clean up multiple spaces and punctuation
    processed_text = re.sub(r'\s+', ' ', processed_text)
    processed_text = re.sub(r'[.!?。！？]+$', lambda m: m.group()[0], processed_text)
    processed_text = re.sub(r',\s*,', ',', processed_text)
    
    return processed_text.strip()

def process_translated_text(text: str, language: str = 'en') -> str:
    """Process translated text with punctuation and cleanup"""
    if not text or not text.strip():
        return text
    
    # Step 1: Clean up common translation artifacts
    cleaned_text = text.strip()
    cleaned_text = re.sub(r'\s+', ' ', cleaned_text)  # Remove extra spaces
    
    # Step 2: Add punctuation
    punctuated_text = add_punctuation_to_text(cleaned_text, language)
    
    return punctuated_text 