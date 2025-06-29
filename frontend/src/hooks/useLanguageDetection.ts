import { useState, useCallback } from 'react';
import apiService from '../services/api';
import { LanguageDetectionResponse } from '../types';

interface UseLanguageDetectionReturn {
  detectedLanguage: string | null;
  detectionConfidence: number;
  isReliable: boolean;
  isDetecting: boolean;
  error: string | null;
  detectLanguage: (text: string) => Promise<LanguageDetectionResponse | null>;
  clearDetection: () => void;
}

export const useLanguageDetection = (): UseLanguageDetectionReturn => {
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [detectionConfidence, setDetectionConfidence] = useState<number>(0);
  const [isReliable, setIsReliable] = useState<boolean>(false);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const detectLanguage = useCallback(async (text: string): Promise<LanguageDetectionResponse | null> => {
    if (!text.trim()) {
      setError('No text provided for language detection');
      return null;
    }

    setIsDetecting(true);
    setError(null);

    try {
      const result = await apiService.detectLanguage(text);
      
      setDetectedLanguage(result.detected_language);
      setDetectionConfidence(result.confidence);
      setIsReliable(result.is_reliable);
      
      console.log('Language detection result:', result);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Language detection failed';
      setError(errorMessage);
      console.error('Language detection error:', err);
      return null;
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const clearDetection = useCallback(() => {
    setDetectedLanguage(null);
    setDetectionConfidence(0);
    setIsReliable(false);
    setError(null);
  }, []);

  return {
    detectedLanguage,
    detectionConfidence,
    isReliable,
    isDetecting,
    error,
    detectLanguage,
    clearDetection,
  };
}; 