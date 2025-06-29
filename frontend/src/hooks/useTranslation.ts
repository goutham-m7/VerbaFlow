import { useCallback } from 'react';
import { useTranslationStore } from '../store/translationStore';
import { TranslationRequest, TranslationResponse, TranslationWithDetectionRequest, TranslationWithDetectionResponse } from '../types';
import apiService from '../services/api';

export const useTranslation = () => {
  const {
    translateText,
    languagePreferences,
    setLanguagePreferences,
    getSupportedLanguages,
    supportedLanguages,
    isLoading,
    error,
  } = useTranslationStore();

  const translate = useCallback(
    async (
      text: string,
      sourceLanguage?: string,
      targetLanguage?: string,
      enablePunctuation?: boolean
    ): Promise<TranslationResponse | null> => {
      if (!text.trim()) {
        return {
          original_text: '',
          translated_text: '',
          source_language: sourceLanguage || '',
          target_language: targetLanguage || '',
          confidence: 0.0,
        };
      }

      if (sourceLanguage !== 'auto' && sourceLanguage === targetLanguage) {
        const processedText = enablePunctuation ? 
          text.replace(/\s+/g, ' ').trim() : text;
        
        return {
          original_text: text,
          translated_text: processedText,
          source_language: sourceLanguage || '',
          target_language: targetLanguage || '',
          confidence: 1.0,
        };
      }

      try {
        const translationData: TranslationRequest = {
          text,
          source_language: sourceLanguage || languagePreferences.sourceLanguage,
          target_language: targetLanguage || languagePreferences.targetLanguage,
          enable_punctuation: enablePunctuation !== undefined ? enablePunctuation : true,
        };

        const response = await translateText(translationData);
        return response;
      } catch (err) {
        console.error('Translation error:', err);
        return {
          original_text: text,
          translated_text: '',
          source_language: sourceLanguage || '',
          target_language: targetLanguage || '',
          confidence: 0.0,
        };
      }
    },
    [translateText, languagePreferences]
  );

  const translateWithDetection = useCallback(
    async (
      text: string,
      targetLanguage?: string,
      autoDetect: boolean = true,
      enablePunctuation?: boolean
    ): Promise<TranslationWithDetectionResponse | null> => {
      if (!text.trim()) {
        return {
          original_text: '',
          translated_text: '',
          source_language: '',
          target_language: targetLanguage || '',
          confidence: 0.0,
          detected_language: '',
          detection_confidence: 0.0,
          is_reliable_detection: false,
        };
      }

      const finalTargetLanguage = targetLanguage || languagePreferences.targetLanguage;
      
      // If auto-detect is disabled and we have a source language, check for same language
      if (!autoDetect && languagePreferences.sourceLanguage && 
          languagePreferences.sourceLanguage === finalTargetLanguage) {
        const processedText = enablePunctuation ? 
          text.replace(/\s+/g, ' ').trim() : text;
        
        return {
          original_text: text,
          translated_text: processedText,
          source_language: languagePreferences.sourceLanguage,
          target_language: finalTargetLanguage,
          confidence: 1.0,
          detected_language: languagePreferences.sourceLanguage,
          detection_confidence: 1.0,
          is_reliable_detection: true,
        };
      }

      try {
        const translationData: TranslationWithDetectionRequest = {
          text,
          target_language: finalTargetLanguage,
          auto_detect: autoDetect,
          enable_punctuation: enablePunctuation !== undefined ? enablePunctuation : true,
        };

        return await apiService.translateWithDetection(translationData);
      } catch (err) {
        console.error('Translation with detection error:', err);
        return {
          original_text: text,
          translated_text: '',
          source_language: '',
          target_language: finalTargetLanguage,
          confidence: 0.0,
          detected_language: '',
          detection_confidence: 0.0,
          is_reliable_detection: false,
        };
      }
    },
    [languagePreferences]
  );

  const updateLanguagePreferences = useCallback(
    (preferences: { sourceLanguage?: string; targetLanguage?: string }) => {
      setLanguagePreferences({
        ...languagePreferences,
        ...preferences,
      });
    },
    [setLanguagePreferences, languagePreferences]
  );

  const loadSupportedLanguages = useCallback(async () => {
    await getSupportedLanguages();
  }, [getSupportedLanguages]);

  return {
    translate,
    translateWithDetection,
    languagePreferences,
    updateLanguagePreferences,
    loadSupportedLanguages,
    supportedLanguages,
    isLoading,
    error,
  };
}; 