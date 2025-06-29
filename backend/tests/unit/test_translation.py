import pytest
from unittest.mock import Mock, patch
from app.services.translation import TranslationService


class TestTranslationService:
    """Test cases for TranslationService"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.service = TranslationService()
    
    def test_translate_same_language(self):
        """Test that translation returns original text when source and target languages are the same"""
        text = "Hello world"
        source_lang = "en"
        target_lang = "en"
        
        # Test with punctuation enabled (default)
        result = self.service.translate_text(text, source_lang, target_lang)
        
        assert result["original_text"] == text
        assert result["translated_text"] == "Hello world."  # Punctuation added
        assert result["source_language"] == source_lang
        assert result["target_language"] == target_lang
        assert result["confidence"] == 1.0
        
        # Test with punctuation disabled
        result_no_punct = self.service.translate_text(text, source_lang, target_lang, enable_punctuation=False)
        
        assert result_no_punct["original_text"] == text
        assert result_no_punct["translated_text"] == text  # No punctuation added
        assert result_no_punct["confidence"] == 1.0
    
    def test_translate_with_detection_same_language(self):
        """Test that translate_with_detection handles same language correctly"""
        text = "Hello world"
        target_lang = "en"
        
        # Mock the detect_language method to return English
        with patch.object(self.service, 'detect_language') as mock_detect:
            mock_detect.return_value = {
                "detected_language": "en",
                "confidence": 0.95,
                "is_reliable": True
            }
            
            # Test with punctuation enabled (default)
            result = self.service.translate_with_detection(text, target_lang, auto_detect=True)
            
            assert result["original_text"] == text
            assert result["translated_text"] == "Hello world."  # Punctuation added
            assert result["source_language"] == "en"
            assert result["target_language"] == target_lang
            assert result["confidence"] == 1.0
            assert result["detected_language"] == "en"
            assert result["detection_confidence"] == 0.95
            assert result["is_reliable_detection"] == True
            
            # Test with punctuation disabled
            result_no_punct = self.service.translate_with_detection(
                text, target_lang, auto_detect=True, enable_punctuation=False
            )
            
            assert result_no_punct["original_text"] == text
            assert result_no_punct["translated_text"] == text  # No punctuation added
            assert result_no_punct["confidence"] == 1.0
    
    def test_translate_empty_text(self):
        """Test that translation handles empty text correctly"""
        result = self.service.translate_text("", "en", "es")
        
        assert result["original_text"] == ""
        assert result["translated_text"] == ""
        assert result["confidence"] == 0.0
    
    def test_translate_whitespace_only(self):
        """Test that translation handles whitespace-only text correctly"""
        result = self.service.translate_text("   ", "en", "es")
        
        assert result["original_text"] == "   "
        assert result["translated_text"] == ""
        assert result["confidence"] == 0.0 