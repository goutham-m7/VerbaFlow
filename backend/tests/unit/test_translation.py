import pytest
import sys
import os
from pathlib import Path

# Ensure the backend directory is in the Python path
backend_dir = Path(__file__).parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

try:
    from app.services.translation import TranslationService
except ImportError as e:
    # Fallback: try to import with absolute path
    try:
        import app.services.translation
        from app.services.translation import TranslationService
    except ImportError:
        print(f"Failed to import TranslationService: {e}")
        print(f"Python path: {sys.path}")
        print(f"Current directory: {os.getcwd()}")
        print(f"Backend directory: {backend_dir}")
        raise


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