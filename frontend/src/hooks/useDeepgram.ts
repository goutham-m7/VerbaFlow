import { useState, useCallback, useRef } from 'react';
import { createClient } from '@deepgram/sdk';

export interface DeepgramTranscriptionResult {
  success: boolean;
  transcript: string;
  confidence: number;
  detected_language: string;
  detection_confidence: number;
  is_reliable_detection: boolean;
  words: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  error?: string;
}

export interface DeepgramLanguageDetectionResult {
  success: boolean;
  detected_language: string;
  confidence: number;
  is_reliable: boolean;
  error?: string;
}

export interface DeepgramTranslationResult {
  success: boolean;
  original_transcript: string;
  translated_text: string;
  detected_language: string;
  detection_confidence: number;
  translation_confidence: number;
  is_reliable_detection: boolean;
  error?: string;
}

export interface LanguageInfo {
  code: string;
  name: string;
}

export const useDeepgram = () => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeTranscribing, setIsRealtimeTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const deepgramClientRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Initialize Deepgram client
  const initializeDeepgram = useCallback(() => {
    try {
      const apiKey = process.env.REACT_APP_DEEPGRAM_API_KEY;
      if (!apiKey) {
        throw new Error('Deepgram API key not found');
      }
      deepgramClientRef.current = createClient(apiKey);
      return true;
    } catch (err) {
      setError('Failed to initialize Deepgram client');
      return false;
    }
  }, []);

  // Convert audio blob to base64
  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  // Transcribe audio using backend API
  const transcribeAudio = useCallback(async (
    audioBlob: Blob,
    language: string = 'en',
    autoDetect: boolean = true
  ): Promise<DeepgramTranscriptionResult> => {
    try {
      setIsTranscribing(true);
      setError(null);

      const base64Audio = await blobToBase64(audioBlob);
      
      const response = await fetch('/api/v1/deepgram/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_data: base64Audio,
          language,
          auto_detect: autoDetect
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transcription failed';
      setError(errorMessage);
      return {
        success: false,
        transcript: '',
        confidence: 0.0,
        detected_language: '',
        detection_confidence: 0.0,
        is_reliable_detection: false,
        words: [],
        error: errorMessage
      };
    } finally {
      setIsTranscribing(false);
    }
  }, [blobToBase64]);

  // Detect language from audio
  const detectLanguage = useCallback(async (
    audioBlob: Blob
  ): Promise<DeepgramLanguageDetectionResult> => {
    try {
      setIsDetecting(true);
      setError(null);

      const base64Audio = await blobToBase64(audioBlob);
      
      const response = await fetch('/api/v1/deepgram/detect-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_data: base64Audio
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Language detection failed';
      setError(errorMessage);
      return {
        success: false,
        detected_language: '',
        confidence: 0.0,
        is_reliable: false,
        error: errorMessage
      };
    } finally {
      setIsDetecting(false);
    }
  }, [blobToBase64]);

  // Translate audio (transcribe + translate)
  const translateAudio = useCallback(async (
    audioBlob: Blob,
    targetLanguage: string = 'en',
    autoDetect: boolean = true
  ): Promise<DeepgramTranslationResult> => {
    try {
      setIsTranslating(true);
      setError(null);

      const base64Audio = await blobToBase64(audioBlob);
      
      const response = await fetch('/api/v1/deepgram/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_data: base64Audio,
          target_language: targetLanguage,
          auto_detect: autoDetect
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Translation failed';
      setError(errorMessage);
      return {
        success: false,
        original_transcript: '',
        translated_text: '',
        detected_language: '',
        detection_confidence: 0.0,
        translation_confidence: 0.0,
        is_reliable_detection: false,
        error: errorMessage
      };
    } finally {
      setIsTranslating(false);
    }
  }, [blobToBase64]);

  // Get supported languages
  const getSupportedLanguages = useCallback(async (): Promise<LanguageInfo[]> => {
    try {
      const response = await fetch('/api/v1/deepgram/languages');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      setError('Failed to fetch supported languages');
      return [];
    }
  }, []);

  // Check service status
  const checkServiceStatus = useCallback(async (): Promise<{ available: boolean; api_key_configured: boolean }> => {
    try {
      const response = await fetch('/api/v1/deepgram/status');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      return { available: false, api_key_configured: false };
    }
  }, []);

  // Start recording audio
  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();
      return true;
    } catch (err) {
      setError('Failed to start recording');
      return false;
    }
  }, []);

  // Stop recording and get audio blob
  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        audioChunksRef.current = [];
        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
      
      // Stop all tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Start real-time transcription via WebSocket
  const startRealtimeTranscription = useCallback(async (
    onTranscript: (result: any) => void,
    onError?: (err: string) => void,
    inputLanguage: string = 'en'
  ): Promise<boolean> => {
    try {
      setError(null);
      setIsRealtimeTranscribing(true);
      // Get user mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      // Open WebSocket
      const ws = new WebSocket(`ws://localhost:8000/api/v1/deepgram/ws/live-transcribe?language=${inputLanguage}`);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;
      // Setup audio context and processor
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(audioContext.destination);
      processor.onaudioprocess = (e) => {
        if (ws.readyState !== 1) return;
        const input = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 PCM
        const pcm = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          let s = Math.max(-1, Math.min(1, input[i]));
          pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        ws.send(pcm.buffer);
      };
      ws.onmessage = (event) => {
        console.log('[WebSocket] Message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocket] Parsed transcript:', data);
          onTranscript(data);
        } catch (err) {
          console.log('[WebSocket] Failed to parse message:', err);
          // ignore
        }
      };
      ws.onerror = (event) => {
        console.log('[WebSocket] Error:', event);
        setError('WebSocket error');
        setIsRealtimeTranscribing(false);
        if (onError) onError('WebSocket error');
      };
      ws.onclose = () => {
        console.log('[WebSocket] Closed');
        setIsRealtimeTranscribing(false);
      };
      return true;
    } catch (err) {
      console.log('[WebSocket] Failed to start real-time transcription:', err);
      setError('Failed to start real-time transcription');
      setIsRealtimeTranscribing(false);
      if (onError) onError('Failed to start real-time transcription');
      return false;
    }
  }, []);

  // Stop real-time transcription
  const stopRealtimeTranscription = useCallback(() => {
    try {
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (wsRef.current && wsRef.current.readyState === 1) {
        wsRef.current.close();
      }
      setIsRealtimeTranscribing(false);
    } catch (err) {
      // ignore
    }
  }, []);

  return {
    // State
    isTranscribing,
    isDetecting,
    isTranslating,
    error,
    isRealtimeTranscribing,
    
    // Methods
    initializeDeepgram,
    transcribeAudio,
    detectLanguage,
    translateAudio,
    getSupportedLanguages,
    checkServiceStatus,
    startRecording,
    stopRecording,
    clearError,
    startRealtimeTranscription,
    stopRealtimeTranscription
  };
}; 