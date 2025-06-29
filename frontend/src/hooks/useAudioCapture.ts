import { useState, useCallback, useRef, useEffect } from 'react';
import { processSpeechText } from '../utils/punctuation';

interface AudioCaptureState {
  isSupported: boolean;
  isRecording: boolean;
  audioLevel: number;
  error: string | null;
  transcription: string;
  isTranscribing: boolean;
}

interface AudioCaptureActions {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  getAudioData: () => Blob | null;
  setSTTProvider: (provider: 'google' | 'browser') => void;
  getSTTProvider: () => 'google' | 'browser';
  forceCleanup: () => void;
}

export const useAudioCapture = (): AudioCaptureState & AudioCaptureActions => {
  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [sttProvider, setSTTProviderState] = useState<'google' | 'browser'>('browser');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  // Check browser support
  useEffect(() => {
    const checkSupport = () => {
      const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasMediaRecorder = !!window.MediaRecorder;
      const hasAudioContext = !!window.AudioContext;
      
      setIsSupported(hasGetUserMedia && hasMediaRecorder && hasAudioContext);
      
      if (!hasGetUserMedia) {
        setError('Microphone access is not supported in this browser');
      } else if (!hasMediaRecorder) {
        setError('Audio recording is not supported in this browser');
      } else if (!hasAudioContext) {
        setError('Audio processing is not supported in this browser');
      }
    };

    checkSupport();
  }, []);

  // Initialize Web Speech API
  const initializeWebSpeechAPI = useCallback(() => {
    if (sttProvider === 'browser') {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US'; // Default language

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          // Process the transcript with punctuation
          const processedTranscript = finalTranscript 
            ? processSpeechText(finalTranscript, 'en') // Default to English for now
            : interimTranscript;
          
          setTranscription(processedTranscript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setError(`Speech recognition error: ${event.error}`);
        };

        recognitionRef.current.onend = () => {
          if (isRecording) {
            recognitionRef.current?.start();
          }
        };
      }
    }
  }, [sttProvider, isRecording]);

  // Audio level monitoring
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average audio level
    const average = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
    const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1

    setAudioLevel(normalizedLevel);

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [isRecording]);

  // Safe AudioContext cleanup
  const safeCloseAudioContext = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (error) {
        console.warn('AudioContext already closed or closing');
      }
    }
  }, []);

  // Force cleanup function
  const forceCleanup = useCallback(() => {
    console.log('Force cleanup initiated...');
    
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        console.log('Speech recognition force stopped');
      } catch (error) {
        console.warn('Speech recognition force stop error:', error);
      }
    }

    // Stop media recorder
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current = null;
        console.log('Media recorder force stopped');
      } catch (error) {
        console.warn('Media recorder force stop error:', error);
      }
    }

    // Stop all tracks
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        try {
          track.stop();
          console.log('Track force stopped:', track.kind);
        } catch (error) {
          console.warn('Track force stop error:', error);
        }
      });
      streamRef.current = null;
      console.log('Stream force cleared');
    }

    // Disconnect microphone
    if (microphoneRef.current) {
      try {
        microphoneRef.current.disconnect();
        microphoneRef.current = null;
        console.log('Microphone force disconnected');
      } catch (error) {
        console.warn('Microphone force disconnect error:', error);
      }
    }

    // Close audio context
    safeCloseAudioContext();

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      console.log('Animation frame force cancelled');
    }

    // Reset all states
    setIsRecording(false);
    setIsTranscribing(false);
    setAudioLevel(0);
    setTranscription('');
    setError(null);
    audioChunksRef.current = [];

    console.log('Force cleanup completed');
  }, [safeCloseAudioContext]);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Audio capture is not supported');
    }

    try {
      setError(null);
      setTranscription('');
      audioChunksRef.current = [];

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Set up audio context for level monitoring
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Safe cleanup
        safeCloseAudioContext();
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };

      // Start recording
      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
      console.log('Recording started - isRecording set to true');
      
      // Start audio level monitoring
      updateAudioLevel();

      // Set transcribing state for both providers
      setIsTranscribing(true);
      console.log('Transcribing started - isTranscribing set to true');

      // Start speech recognition if using browser STT
      if (sttProvider === 'browser' && recognitionRef.current) {
        try {
          recognitionRef.current.start();
          console.log('Speech recognition started');
        } catch (error) {
          console.warn('Speech recognition already started');
        }
      }

    } catch (err: any) {
      setError(err.message || 'Failed to start recording');
      throw err;
    }
  }, [isSupported, updateAudioLevel, sttProvider, safeCloseAudioContext]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) {
      console.log('No recording to stop or already stopped');
      return;
    }

    try {
      console.log('Stopping recording...');
      
      // Stop speech recognition first
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          console.log('Speech recognition stopped');
        } catch (error) {
          console.warn('Speech recognition already stopped');
        }
      }

      // Update states immediately
      setIsRecording(false);
      setIsTranscribing(false);
      setAudioLevel(0);
      console.log('Recording stopped - states updated: isRecording=false, isTranscribing=false');

      // Stop media recorder
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        console.log('Media recorder stopped');
      }

      // Stop all audio tracks immediately
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => {
          track.stop();
          console.log('Audio track stopped:', track.kind);
        });
        streamRef.current = null;
        console.log('All audio tracks stopped and stream cleared');
      }

      // Disconnect microphone from audio context
      if (microphoneRef.current) {
        try {
          microphoneRef.current.disconnect();
          microphoneRef.current = null;
          console.log('Microphone disconnected from audio context');
        } catch (error) {
          console.warn('Error disconnecting microphone:', error);
        }
      }

      // Safe cleanup of audio context
      safeCloseAudioContext();
      
      // Stop animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
        console.log('Animation frame cancelled');
      }

      // Clear audio chunks
      audioChunksRef.current = [];

      console.log('Recording stopped successfully - all resources cleaned up');
    } catch (err: any) {
      console.error('Error stopping recording:', err);
      setError(err.message || 'Failed to stop recording');
      // Force cleanup even if there's an error
      console.log('Normal cleanup failed, using force cleanup...');
      forceCleanup();
    }
  }, [isRecording, safeCloseAudioContext, forceCleanup]);

  const getAudioData = useCallback((): Blob | null => {
    if (audioChunksRef.current.length === 0) return null;
    
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    return audioBlob;
  }, []);

  const setSTTProvider = useCallback((provider: 'google' | 'browser') => {
    // If currently recording, stop first
    if (isRecording) {
      stopRecording();
    }
    
    // Reset states
    setTranscription('');
    setError(null);
    setAudioLevel(0);
    setIsTranscribing(false);
    
    // Update provider
    setSTTProviderState(provider);
    
    // Initialize Web Speech API if switching to browser provider
    if (provider === 'browser') {
      initializeWebSpeechAPI();
    }
  }, [isRecording, stopRecording, initializeWebSpeechAPI]);

  const getSTTProvider = useCallback(() => {
    return sttProvider;
  }, [sttProvider]);

  // Initialize Web Speech API on mount
  useEffect(() => {
    initializeWebSpeechAPI();
  }, [initializeWebSpeechAPI]);

  // Cleanup when STT provider changes
  useEffect(() => {
    // Reset transcription and transcribing state when provider changes
    setTranscription('');
    setIsTranscribing(false);
  }, [sttProvider]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      safeCloseAudioContext();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.warn('Speech recognition cleanup error:', error);
        }
      }
    };
  }, [isRecording, safeCloseAudioContext]);

  return {
    isSupported,
    isRecording,
    audioLevel,
    error,
    transcription,
    isTranscribing,
    startRecording,
    stopRecording,
    getAudioData,
    setSTTProvider,
    getSTTProvider,
    forceCleanup,
  };
}; 