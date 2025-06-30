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
                logger.warning("Google Cloud project ID not configured, using mock translations")
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
        
        # If Google Cloud client is not available, fall back to mock detection
        if not self.client:
            logger.info("Using mock language detection")
            return self._mock_detect_language(text)
        
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
                return self._mock_detect_language(text)
            
        except Exception as e:
            logger.error(f"Google Cloud language detection error: {e}")
            # Fall back to mock detection
            return self._mock_detect_language(text)
    
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
        
        # If Google Cloud client is not available, fall back to mock translations
        if not self.client:
            return self._mock_translate(text, source_language, target_language, enable_punctuation)
        
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
            translation = response.translations[0]
            
            # Process the translated text with punctuation if enabled
            processed_translation = translation.translated_text
            if enable_punctuation:
                processed_translation = process_translated_text(translation.translated_text, target_language)
            
            return {
                "original_text": text,
                "translated_text": processed_translation,
                "source_language": source_language,
                "target_language": target_language,
                "confidence": 0.95  # Google Translate doesn't provide confidence scores
            }
            
        except Exception as e:
            logger.error(f"Google Cloud Translate API error: {e}")
            
            # Handle specific error for same source/target language
            if "Target language can't be equal to source language" in str(e):
                logger.info(f"Source and target languages are the same ({source_language}), returning original text with punctuation")
                processed_text = text
                if enable_punctuation:
                    processed_text = process_translated_text(text, target_language)
                
                return {
                    "original_text": text,
                    "translated_text": processed_text,
                    "source_language": source_language,
                    "target_language": target_language,
                    "confidence": 1.0
                }
            
            # Fall back to mock translation for other errors
            return self._mock_translate(text, source_language, target_language, enable_punctuation)
    
    def _mock_translate(self, text: str, source_language: str, target_language: str, enable_punctuation: bool = True) -> Dict[str, Any]:
        """Fallback mock translation when Google Cloud is not available"""
        # Enhanced mock translations with more languages
        translations = {
            ("en", "es"): {
                "hello": "hola",
                "how are you": "cómo estás",
                "good morning": "buenos días",
                "thank you": "gracias",
                "goodbye": "adiós",
                "please": "por favor",
                "yes": "sí",
                "no": "no",
                "good": "bueno",
                "bad": "malo"
            },
            ("en", "fr"): {
                "hello": "bonjour",
                "how are you": "comment allez-vous",
                "good morning": "bonjour",
                "thank you": "merci",
                "goodbye": "au revoir",
                "please": "s'il vous plaît",
                "yes": "oui",
                "no": "non",
                "good": "bon",
                "bad": "mauvais"
            },
            ("en", "zh"): {
                "hello": "你好",
                "how are you": "你好吗",
                "good morning": "早上好",
                "thank you": "谢谢",
                "goodbye": "再见",
                "please": "请",
                "yes": "是",
                "no": "不",
                "good": "好",
                "bad": "坏",
                "today": "今天",
                "doing": "做",
                "morning": "早上",
                "are": "是",
                "you": "你",
                "how": "怎么"
            },
            ("en", "ja"): {
                "hello": "こんにちは",
                "how are you": "お元気ですか",
                "good morning": "おはようございます",
                "thank you": "ありがとうございます",
                "goodbye": "さようなら",
                "please": "お願いします",
                "yes": "はい",
                "no": "いいえ",
                "good": "良い",
                "bad": "悪い"
            },
            ("en", "ko"): {
                "hello": "안녕하세요",
                "how are you": "어떻게 지내세요",
                "good morning": "좋은 아침입니다",
                "thank you": "감사합니다",
                "goodbye": "안녕히 가세요",
                "please": "부탁합니다",
                "yes": "네",
                "no": "아니요",
                "good": "좋은",
                "bad": "나쁜"
            },
            ("en", "de"): {
                "hello": "hallo",
                "how are you": "wie geht es dir",
                "good morning": "guten morgen",
                "thank you": "danke",
                "goodbye": "auf wiedersehen",
                "please": "bitte",
                "yes": "ja",
                "no": "nein",
                "good": "gut",
                "bad": "schlecht"
            },
            ("en", "it"): {
                "hello": "ciao",
                "how are you": "come stai",
                "good morning": "buongiorno",
                "thank you": "grazie",
                "goodbye": "arrivederci",
                "please": "per favore",
                "yes": "sì",
                "no": "no",
                "good": "buono",
                "bad": "cattivo"
            },
            ("en", "pt"): {
                "hello": "olá",
                "how are you": "como você está",
                "good morning": "bom dia",
                "thank you": "obrigado",
                "goodbye": "adeus",
                "please": "por favor",
                "yes": "sim",
                "no": "não",
                "good": "bom",
                "bad": "ruim"
            },
            ("en", "ru"): {
                "hello": "привет",
                "how are you": "как дела",
                "good morning": "доброе утро",
                "thank you": "спасибо",
                "goodbye": "до свидания",
                "please": "пожалуйста",
                "yes": "да",
                "no": "нет",
                "good": "хороший",
                "bad": "плохой"
            }
        }
        
        key = (source_language, target_language)
        if key in translations:
            translated_text = text
            confidence = 0.95
            
            # Try to translate known phrases
            for original, translated in translations[key].items():
                if original.lower() in translated_text.lower():
                    translated_text = translated_text.lower().replace(original.lower(), translated)
            
            # If no translations were found, provide a more intelligent fallback
            if translated_text == text:
                # For Chinese, provide a basic translation structure
                if target_language == "zh":
                    if "good morning" in text.lower():
                        translated_text = "早上好"
                    elif "how are you" in text.lower():
                        translated_text = "你好吗"
                    elif "today" in text.lower():
                        translated_text = "今天"
                    else:
                        translated_text = f"[中文] {text}"
                    confidence = 0.8
                else:
                    translated_text = f"[{target_language.upper()}] {text}"
                    confidence = 0.7
            
            return {
                "original_text": text,
                "translated_text": process_translated_text(translated_text, target_language) if enable_punctuation else translated_text,
                "source_language": source_language,
                "target_language": target_language,
                "confidence": confidence
            }
        
        # Default mock translation for unsupported language pairs
        return {
            "original_text": text,
            "translated_text": process_translated_text(f"[{target_language.upper()}] {text}", target_language) if enable_punctuation else f"[{target_language.upper()}] {text}",
            "source_language": source_language,
            "target_language": target_language,
            "confidence": 0.5
        }
    
    def _mock_detect_language(self, text: str) -> Dict[str, Any]:
        """Fallback mock language detection when Google Cloud is not available"""
        # Simple keyword-based language detection with expanded support
        text_lower = text.lower()
        
        # Spanish detection (expanded)
        spanish_words = [
            "hola", "gracias", "por favor", "buenos días", "adiós", "cómo", "estás", "bien", "mal", "sí", "no",
            "amigo", "familia", "casa", "trabajo", "tiempo", "agua", "comida", "dinero", "amor", "vida",
            "muy", "mucho", "poco", "grande", "pequeño", "nuevo", "viejo", "bueno", "malo", "hermoso"
        ]
        if any(word in text_lower for word in spanish_words):
            return {
                "detected_language": "es",
                "confidence": 0.85,
                "is_reliable": True
            }
        
        # French detection (expanded)
        french_words = [
            "bonjour", "merci", "s'il vous plaît", "au revoir", "comment", "allez-vous", "oui", "non",
            "ami", "famille", "maison", "travail", "temps", "eau", "nourriture", "argent", "amour", "vie",
            "très", "beaucoup", "peu", "grand", "petit", "nouveau", "vieux", "bon", "mauvais", "beau"
        ]
        if any(word in text_lower for word in french_words):
            return {
                "detected_language": "fr",
                "confidence": 0.85,
                "is_reliable": True
            }
        
        # German detection (expanded)
        german_words = [
            "hallo", "danke", "bitte", "guten", "morgen", "auf", "wiedersehen", "wie", "geht", "es", "dir",
            "freund", "familie", "haus", "arbeit", "zeit", "wasser", "essen", "geld", "liebe", "leben",
            "sehr", "viel", "wenig", "groß", "klein", "neu", "alt", "gut", "schlecht", "schön"
        ]
        if any(word in text_lower for word in german_words):
            return {
                "detected_language": "de",
                "confidence": 0.85,
                "is_reliable": True
            }
        
        # Italian detection (expanded)
        italian_words = [
            "ciao", "grazie", "per favore", "buongiorno", "arrivederci", "come", "stai", "sì", "no",
            "amico", "famiglia", "casa", "lavoro", "tempo", "acqua", "cibo", "denaro", "amore", "vita",
            "molto", "tanto", "poco", "grande", "piccolo", "nuovo", "vecchio", "buono", "cattivo", "bello"
        ]
        if any(word in text_lower for word in italian_words):
            return {
                "detected_language": "it",
                "confidence": 0.85,
                "is_reliable": True
            }
        
        # Portuguese detection (expanded)
        portuguese_words = [
            "olá", "obrigado", "por favor", "bom dia", "adeus", "como", "você", "está", "sim", "não",
            "amigo", "família", "casa", "trabalho", "tempo", "água", "comida", "dinheiro", "amor", "vida",
            "muito", "pouco", "grande", "pequeno", "novo", "velho", "bom", "mau", "bonito"
        ]
        if any(word in text_lower for word in portuguese_words):
            return {
                "detected_language": "pt",
                "confidence": 0.85,
                "is_reliable": True
            }
        
        # Russian detection (expanded)
        russian_words = [
            "привет", "спасибо", "пожалуйста", "доброе", "утро", "до", "свидания", "как", "дела", "да", "нет",
            "друг", "семья", "дом", "работа", "время", "вода", "еда", "деньги", "любовь", "жизнь",
            "очень", "много", "мало", "большой", "маленький", "новый", "старый", "хороший", "плохой", "красивый"
        ]
        if any(word in text_lower for word in russian_words):
            return {
                "detected_language": "ru",
                "confidence": 0.85,
                "is_reliable": True
            }
        
        # Japanese detection (expanded)
        japanese_chars = ["こ", "ん", "に", "ち", "は", "お", "は", "よ", "う", "さ", "よ", "う", "な", "ら", "ま", "す", "で", "す", "か", "ら", "ま", "で", "し", "た", "い", "ま", "す"]
        if any(char in text for char in japanese_chars):
            return {
                "detected_language": "ja",
                "confidence": 0.9,
                "is_reliable": True
            }
        
        # Korean detection (expanded)
        korean_chars = ["안", "녕", "하", "세", "요", "감", "사", "합", "니", "다", "네", "아", "니", "요", "죄", "송", "합", "니", "다", "부", "탁", "합", "니", "다"]
        if any(char in text for char in korean_chars):
            return {
                "detected_language": "ko",
                "confidence": 0.9,
                "is_reliable": True
            }
        
        # Chinese detection (expanded)
        chinese_chars = ["你", "好", "谢", "谢", "再", "见", "早", "上", "好", "晚", "上", "好", "对", "不", "起", "请", "问", "多", "少", "钱", "大", "小", "新", "旧", "美", "丽"]
        if any(char in text for char in chinese_chars):
            return {
                "detected_language": "zh",
                "confidence": 0.9,
                "is_reliable": True
            }
        
        # Arabic detection
        arabic_chars = ["ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي"]
        if any(char in text for char in arabic_chars):
            return {
                "detected_language": "ar",
                "confidence": 0.9,
                "is_reliable": True
            }
        
        # Hindi detection
        hindi_chars = ["अ", "आ", "इ", "ई", "उ", "ऊ", "ए", "ऐ", "ओ", "औ", "क", "ख", "ग", "घ", "ङ", "च", "छ", "ज", "झ", "ञ", "ट", "ठ", "ड", "ढ", "ण", "त", "थ", "द", "ध", "न", "प", "फ", "ब", "भ", "म", "य", "र", "ल", "व", "श", "ष", "स", "ह"]
        if any(char in text for char in hindi_chars):
            return {
                "detected_language": "hi",
                "confidence": 0.9,
                "is_reliable": True
            }
        
        # Thai detection
        thai_chars = ["ก", "ข", "ค", "ง", "จ", "ฉ", "ช", "ซ", "ญ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ", "ณ", "ด", "ต", "ถ", "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม", "ย", "ร", "ล", "ว", "ศ", "ษ", "ส", "ห", "ฬ", "อ", "ฮ"]
        if any(char in text for char in thai_chars):
            return {
                "detected_language": "th",
                "confidence": 0.9,
                "is_reliable": True
            }
        
        # Dutch detection
        dutch_words = ["hallo", "dank", "alsjeblieft", "goedemorgen", "tot", "ziens", "hoe", "gaat", "het", "ja", "nee"]
        if any(word in text_lower for word in dutch_words):
            return {
                "detected_language": "nl",
                "confidence": 0.8,
                "is_reliable": True
            }
        
        # Swedish detection
        swedish_words = ["hej", "tack", "snälla", "god", "morgon", "hej", "då", "hur", "mår", "du", "ja", "nej"]
        if any(word in text_lower for word in swedish_words):
            return {
                "detected_language": "sv",
                "confidence": 0.8,
                "is_reliable": True
            }
        
        # Norwegian detection
        norwegian_words = ["hei", "takk", "vær", "så", "snill", "god", "morgen", "ha", "det", "bra", "ja", "nei"]
        if any(word in text_lower for word in norwegian_words):
            return {
                "detected_language": "no",
                "confidence": 0.8,
                "is_reliable": True
            }
        
        # Danish detection
        danish_words = ["hej", "tak", "vær", "så", "venlig", "god", "morgen", "farvel", "ja", "nej"]
        if any(word in text_lower for word in danish_words):
            return {
                "detected_language": "da",
                "confidence": 0.8,
                "is_reliable": True
            }
        
        # Polish detection
        polish_words = ["cześć", "dziękuję", "proszę", "dzień", "dobry", "do", "widzenia", "jak", "się", "masz", "tak", "nie"]
        if any(word in text_lower for word in polish_words):
            return {
                "detected_language": "pl",
                "confidence": 0.8,
                "is_reliable": True
            }
        
        # Czech detection
        czech_words = ["ahoj", "děkuji", "prosím", "dobrý", "den", "na", "shledanou", "jak", "se", "máš", "ano", "ne"]
        if any(word in text_lower for word in czech_words):
            return {
                "detected_language": "cs",
                "confidence": 0.8,
                "is_reliable": True
            }
        
        # Hungarian detection
        hungarian_words = ["szia", "köszönöm", "kérem", "jó", "reggelt", "viszlát", "hogy", "vagy", "igen", "nem"]
        if any(word in text_lower for word in hungarian_words):
            return {
                "detected_language": "hu",
                "confidence": 0.8,
                "is_reliable": True
            }
        
        # Finnish detection
        finnish_words = ["hei", "kiitos", "ole", "hyvä", "hyvää", "huomenta", "näkemiin", "miten", "menee", "kyllä", "ei"]
        if any(word in text_lower for word in finnish_words):
            return {
                "detected_language": "fi",
                "confidence": 0.8,
                "is_reliable": True
            }
        
        # Turkish detection
        turkish_words = ["merhaba", "teşekkürler", "lütfen", "günaydın", "görüşürüz", "nasılsın", "evet", "hayır"]
        if any(word in text_lower for word in turkish_words):
            return {
                "detected_language": "tr",
                "confidence": 0.8,
                "is_reliable": True
            }
        
        # Greek detection
        greek_chars = ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ι", "κ", "λ", "μ", "ν", "ξ", "ο", "π", "ρ", "σ", "τ", "υ", "φ", "χ", "ψ", "ω"]
        if any(char in text.lower() for char in greek_chars):
            return {
                "detected_language": "el",
                "confidence": 0.9,
                "is_reliable": True
            }
        
        # Hebrew detection
        hebrew_chars = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ", "ק", "ר", "ש", "ת"]
        if any(char in text for char in hebrew_chars):
            return {
                "detected_language": "he",
                "confidence": 0.9,
                "is_reliable": True
            }
        
        # Default to English with lower confidence
        return {
            "detected_language": "en",
            "confidence": 0.6,
            "is_reliable": False
        }
    
    def get_supported_languages(self) -> list:
        """Get list of supported languages"""
        try:
            if self.client:
                # Get supported languages from Google Cloud
                location = "global"
                parent = f"projects/{self.project_id}/locations/{location}"
                
                request = translate.GetSupportedLanguagesRequest(
                    parent=parent,
                    display_language_code="en"
                )
                
                response = self.client.get_supported_languages(request=request)
                return [lang.language_code for lang in response.languages]
            else:
                # Return mock supported languages
                return [
                    "en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh"
                ]
        except Exception as e:
            logger.error(f"Error getting supported languages: {e}")
            return ["en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh"]

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