import { useState, useCallback, useRef } from 'react';
import apiService from '../services/api';
import { TTSRequest, TTSResponse, Voice } from '../types';

interface TTSState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  currentText: string;
  provider: 'google' | 'browser';
}

interface TTSActions {
  speak: (text: string, languageCode?: string, provider?: 'google' | 'browser') => Promise<void>;
  stop: () => void;
  setProvider: (provider: 'google' | 'browser') => void;
  getVoices: (languageCode: string) => Promise<Voice[]>;
}

export const useTTS = (): TTSState & TTSActions => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentText, setCurrentText] = useState('');
  const [provider, setProviderState] = useState<'google' | 'browser'>('browser');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(async (
    text: string, 
    languageCode: string = 'en-US', 
    ttsProvider: 'google' | 'browser' = provider
  ) => {
    if (!text.trim()) {
      setError('No text to speak');
      return;
    }

    setError(null);
    setIsLoading(true);
    setCurrentText(text);

    try {
      if (ttsProvider === 'browser') {
        // Use browser's built-in speech synthesis
        if ('speechSynthesis' in window) {
          // Stop any current speech
          window.speechSynthesis.cancel();
          
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = languageCode;
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          
          utterance.onstart = () => {
            setIsPlaying(true);
            setIsLoading(false);
          };
          
          utterance.onend = () => {
            setIsPlaying(false);
          };
          
          utterance.onerror = (event) => {
            setError(`Speech synthesis error: ${event.error}`);
            setIsPlaying(false);
            setIsLoading(false);
          };
          
          speechSynthesisRef.current = utterance;
          window.speechSynthesis.speak(utterance);
        } else {
          throw new Error('Speech synthesis not supported in this browser');
        }
      } else {
        // Use Google Cloud TTS
        const ttsRequest: TTSRequest = {
          text,
          language_code: languageCode,
          provider: 'google'
        };
        
        const response: TTSResponse = await apiService.synthesizeSpeech(ttsRequest);
        
        if (response.success && response.audio_data) {
          // Convert base64 to audio blob
          const audioData = atob(response.audio_data);
          const audioArray = new Uint8Array(audioData.length);
          for (let i = 0; i < audioData.length; i++) {
            audioArray[i] = audioData.charCodeAt(i);
          }
          
          const audioBlob = new Blob([audioArray], { type: 'audio/mp3' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Create and play audio
          const audio = new Audio(audioUrl);
          audio.onloadstart = () => {
            setIsPlaying(true);
            setIsLoading(false);
          };
          
          audio.onended = () => {
            setIsPlaying(false);
            URL.revokeObjectURL(audioUrl);
          };
          
          audio.onerror = () => {
            setError('Failed to play audio');
            setIsPlaying(false);
            setIsLoading(false);
            URL.revokeObjectURL(audioUrl);
          };
          
          audioRef.current = audio;
          await audio.play();
        } else {
          throw new Error(response.error || 'Failed to synthesize speech');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to speak text');
      setIsPlaying(false);
      setIsLoading(false);
    }
  }, [provider]);

  const stop = useCallback(() => {
    if (provider === 'browser') {
      window.speechSynthesis.cancel();
      speechSynthesisRef.current = null;
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, [provider]);

  const setProvider = useCallback((newProvider: 'google' | 'browser') => {
    // Stop any current speech when changing providers
    if (isPlaying) {
      stop();
    }
    setProviderState(newProvider);
  }, [isPlaying, stop]);

  const getVoices = useCallback(async (languageCode: string): Promise<Voice[]> => {
    try {
      return await apiService.getVoices(languageCode);
    } catch (err: any) {
      setError(err.message || 'Failed to get voices');
      return [];
    }
  }, []);

  return {
    isPlaying,
    isLoading,
    error,
    currentText,
    provider,
    speak,
    stop,
    setProvider,
    getVoices,
  };
}; 