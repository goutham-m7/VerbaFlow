import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Heading,
  Card,
  CardBody,
  Progress,
  Badge,
  Checkbox,
  Select,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  useToast,
  Flex,
  Spacer,
  Icon,
  Divider,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  FormControl,
  FormLabel,
  Tooltip,
  SimpleGrid,
} from '@chakra-ui/react';
import { 
  FaMicrophone, 
  FaMicrophoneSlash, 
  FaLanguage, 
  FaGlobe,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaDownload,
  FaTrash,
  FaStop,
} from 'react-icons/fa';
import { useDeepgram, LanguageInfo } from '../hooks/useDeepgram';
import { useTranslation } from '../hooks/useTranslation';
import { useTTS } from '../hooks/useTTS';
import FuturisticButton from '../components/FuturisticButton';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';
import IconWrapper from '../components/IconWrapper';
import LanguageSelector from '../components/Translation/LanguageSelector';
import { LanguagePreferences } from '../types';

interface TranscriptionEntry {
  id: string;
  timestamp: Date;
  originalText: string;
  translatedText: string;
  detectedLanguage: string;
  detectionConfidence: number;
  translationConfidence: number;
  isReliableDetection: boolean;
}

const DeepgramSTTPage: React.FC = () => {
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const accentColor = useColorModeValue('brand.500', 'brand.400');

  // Deepgram hook
  const {
    isTranscribing,
    isDetecting,
    isTranslating,
    error,
    transcribeAudio,
    detectLanguage,
    translateAudio,
    getSupportedLanguages,
    checkServiceStatus,
    startRecording,
    stopRecording,
    clearError,
    isRealtimeTranscribing,
    startRealtimeTranscription,
    stopRealtimeTranscription
  } = useDeepgram();

  // Translation hook
  const { translate } = useTranslation();
  
  // TTS hook
  const { speak } = useTTS();

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isServiceAvailable, setIsServiceAvailable] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState<LanguageInfo[]>([]);
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState('en');
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(true);
  const [enableTranslation, setEnableTranslation] = useState(true);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [currentTranslation, setCurrentTranslation] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [detectionConfidence, setDetectionConfidence] = useState<number | null>(null);
  const [isReliableDetection, setIsReliableDetection] = useState(false);
  const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionEntry[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [realtimeTranscript, setRealtimeTranscript] = useState('');
  const [realtimeWords, setRealtimeWords] = useState<any[]>([]);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [languagePreferences, setLanguagePreferences] = useState<LanguagePreferences>({
    sourceLanguage: 'en',
    targetLanguage: 'en',
  });
  const translationWsRef = useRef<WebSocket | null>(null);
  const [realtimeTranslation, setRealtimeTranslation] = useState('');

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Initialize service status and languages
  useEffect(() => {
    const initializeService = async () => {
      const status = await checkServiceStatus();
      setIsServiceAvailable(status.available);
      
      if (status.available) {
        const languages = await getSupportedLanguages();
        setSupportedLanguages(languages);
      }
    };

    initializeService();
  }, [checkServiceStatus, getSupportedLanguages]);

  // Audio level monitoring
  useEffect(() => {
    if (isRecording && audioContextRef.current) {
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
        }
        
        if (isRecording) {
          requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    }
  }, [isRecording]);

  // Handle recording start
  const handleStartRecording = async () => {
    try {
      clearError();
      
      // Initialize audio context for level monitoring
      audioContextRef.current = new AudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      microphoneRef.current.connect(analyserRef.current);
      
      const success = await startRecording();
      if (success) {
        setIsRecording(true);
        setCurrentTranscript('');
        setCurrentTranslation('');
        setDetectedLanguage('');
        setDetectionConfidence(null);
        setIsReliableDetection(false);
        
        toast({
          title: 'Recording started',
          description: 'Speak now to transcribe your audio',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: 'Recording failed',
        description: 'Could not start audio recording',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle recording stop
  const handleStopRecording = async () => {
    try {
      const audioBlob = await stopRecording();
      setIsRecording(false);
      
      if (audioBlob) {
        if (enableTranslation) {
          // Translate audio
          const result = await translateAudio(audioBlob, selectedTargetLanguage, autoDetectLanguage);
          
          if (result.success) {
            setCurrentTranscript(result.original_transcript);
            setCurrentTranslation(result.translated_text);
            setDetectedLanguage(result.detected_language);
            setDetectionConfidence(result.detection_confidence);
            setIsReliableDetection(result.is_reliable_detection);
            
            // Add to history
            const entry: TranscriptionEntry = {
              id: Date.now().toString(),
              timestamp: new Date(),
              originalText: result.original_transcript,
              translatedText: result.translated_text,
              detectedLanguage: result.detected_language,
              detectionConfidence: result.detection_confidence,
              translationConfidence: result.translation_confidence,
              isReliableDetection: result.is_reliable_detection,
            };
            
            setTranscriptionHistory(prev => [entry, ...prev]);
            
            toast({
              title: 'Translation complete',
              description: `Detected: ${result.detected_language} (${(result.detection_confidence * 100).toFixed(1)}% confidence)`,
              status: 'success',
              duration: 5000,
              isClosable: true,
            });
          } else {
            toast({
              title: 'Translation failed',
              description: result.error || 'Unknown error occurred',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
        } else {
          // Just transcribe
          const result = await transcribeAudio(audioBlob, 'en', autoDetectLanguage);
          
          if (result.success) {
            setCurrentTranscript(result.transcript);
            setDetectedLanguage(result.detected_language);
            setDetectionConfidence(result.detection_confidence);
            setIsReliableDetection(result.is_reliable_detection);
            
            toast({
              title: 'Transcription complete',
              description: `Detected: ${result.detected_language} (${(result.detection_confidence * 100).toFixed(1)}% confidence)`,
              status: 'success',
              duration: 5000,
              isClosable: true,
            });
          } else {
            toast({
              title: 'Transcription failed',
              description: result.error || 'Unknown error occurred',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
        }
      }
      
      // Cleanup audio context
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
        analyserRef.current = null;
        microphoneRef.current = null;
      }
    } catch (err) {
      toast({
        title: 'Recording stop failed',
        description: 'Could not stop audio recording',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle TTS for translated text
  const handleSpeakTranslation = async () => {
    if (currentTranslation) {
      await speak(currentTranslation, selectedTargetLanguage);
    }
  };

  // Clear current session
  const handleClearSession = () => {
    setCurrentTranscript('');
    setCurrentTranslation('');
    setDetectedLanguage('');
    setDetectionConfidence(null);
    setIsReliableDetection(false);
  };

  // Clear history
  const handleClearHistory = () => {
    setTranscriptionHistory([]);
  };

  // Download transcript as text file
  const handleDownloadTranscript = () => {
    if (transcriptionHistory.length === 0) return;
    
    const content = transcriptionHistory
      .map(entry => 
        `[${entry.timestamp.toLocaleString()}] ${entry.detectedLanguage} (${(entry.detectionConfidence * 100).toFixed(1)}% confidence)\n` +
        `Original: ${entry.originalText}\n` +
        `Translated: ${entry.translatedText}\n` +
        `---\n`
      )
      .join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deepgram-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get language name from code
  const getLanguageName = (code: string): string => {
    const language = supportedLanguages.find(lang => lang.code === code);
    return language ? language.name : code.toUpperCase();
  };

  // Start real-time STT
  const handleStartRealtime = async () => {
    setRealtimeTranscript('');
    setRealtimeWords([]);
    setIsRealtimeActive(true);
    setRealtimeTranslation('');
    setDetectedLanguage('');
    setDetectionConfidence(null);
    // Open translation WebSocket
    const translationWs = new WebSocket(`ws://localhost:8000/api/v1/deepgram/ws/live-translate`);
    translationWsRef.current = translationWs;
    translationWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.translated_text) {
          setRealtimeTranslation(data.translated_text);
        }
      } catch {}
    };
    translationWs.onerror = (event) => {
      setRealtimeTranslation('[Translation error]');
    };
    await startRealtimeTranscription((data) => {
      // data: { result, detected_language, detection_confidence }
      const result = data.result;
      if (result && result.channel && result.channel.alternatives && result.channel.alternatives[0]) {
        setRealtimeTranscript(result.channel.alternatives[0].transcript || '');
        setRealtimeWords(result.channel.alternatives[0].words || []);
        // Send transcript to translation WebSocket
        if (translationWsRef.current && translationWsRef.current.readyState === 1) {
          translationWsRef.current.send(JSON.stringify({
            text: result.channel.alternatives[0].transcript,
            target_language: languagePreferences.targetLanguage
          }));
        }
      }
      if (data.detected_language) {
        setDetectedLanguage(data.detected_language);
        setDetectionConfidence(data.detection_confidence);
      }
    }, (err) => {
      toast({
        title: 'Real-time STT Error',
        description: err,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsRealtimeActive(false);
    }, languagePreferences.sourceLanguage);
  };

  // Stop real-time STT
  const handleStopRealtime = () => {
    stopRealtimeTranscription();
    setIsRealtimeActive(false);
    if (translationWsRef.current && translationWsRef.current.readyState === 1) {
      translationWsRef.current.close();
    }
  };

  if (!isServiceAvailable) {
    return (
      <Box p={8}>
        <GlassCard>
          <Alert status="warning">
            <AlertIcon />
            <Box>
              <AlertTitle>Deepgram Service Unavailable</AlertTitle>
              <AlertDescription>
                The Deepgram service is not configured. Please check your API key configuration.
              </AlertDescription>
            </Box>
          </Alert>
        </GlassCard>
      </Box>
    );
  }

  return (
    <Box maxW="800px" mx="auto" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Language Settings Section */}
        <GlassCard>
          <Box p={4}>
            <LanguageSelector
              preferences={languagePreferences}
              onPreferencesChange={setLanguagePreferences}
              showAutoDetect={true}
            />
          </Box>
        </GlassCard>
        {/* Real-Time STT Section */}
        <GlassCard>
          <VStack spacing={4} align="stretch">
            <HStack spacing={4} justify="space-between">
              <Text fontSize="xl" fontWeight="bold" color={textColor}>Real-Time Speech-to-Text</Text>
              {!isRealtimeActive ? (
                <FuturisticButton
                  onClick={handleStartRealtime}
                  leftIcon={FaMicrophone}
                  colorScheme="teal"
                  isLoading={isRealtimeTranscribing}
                >
                  Start Real-Time STT
                </FuturisticButton>
              ) : (
                <FuturisticButton
                  onClick={handleStopRealtime}
                  leftIcon={FaStop}
                  colorScheme="red"
                >
                  Stop
                </FuturisticButton>
              )}
            </HStack>
            <Divider />
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              {/* Transcript Section */}
              <Box p={3} borderWidth={1} borderRadius="md" bg={bgColor} borderColor={borderColor}>
                <Text fontSize="md" fontWeight="semibold" mb={1} color="#222" _dark={{ color: '#fff' }}>Transcript</Text>
                <Text fontSize="lg" color="#222" _dark={{ color: '#fff' }} minH="40px">
                  {realtimeTranscript || <span style={{ color: '#aaa' }}>Live transcript will appear here...</span>}
                </Text>
              </Box>
              {/* Detected Language Section */}
              <Box p={3} borderWidth={1} borderRadius="md" bg={bgColor} borderColor={borderColor}>
                <Text fontSize="md" fontWeight="semibold" mb={1} color="#222" _dark={{ color: '#fff' }}>Detected Language</Text>
                {detectedLanguage ? (
                  <HStack>
                    <Tooltip label={`Confidence: ${detectionConfidence !== null ? (detectionConfidence * 100).toFixed(1) : '0'}%`}>
                      <Badge colorScheme="purple" fontSize="lg" px={2} py={1} borderRadius="md">
                        {detectedLanguage.toUpperCase()}
                      </Badge>
                    </Tooltip>
                    <Text color="#222" _dark={{ color: '#fff' }} fontSize="sm">
                      {detectionConfidence !== null ? `(${(detectionConfidence * 100).toFixed(1)}% confidence)` : ''}
                    </Text>
                  </HStack>
                ) : (
                  <Text color="#aaa">Language detection will appear here...</Text>
                )}
              </Box>
              {/* Translation Section */}
              <Box p={3} borderWidth={1} borderRadius="md" bg={bgColor} borderColor={borderColor}>
                <Text fontSize="md" fontWeight="semibold" mb={1} color="#222" _dark={{ color: '#fff' }}>Translation</Text>
                <Text fontSize="lg" color="#222" _dark={{ color: '#fff' }} minH="40px">
                  {realtimeTranslation || <span style={{ color: '#aaa' }}>Live translation will appear here...</span>}
                </Text>
              </Box>
            </SimpleGrid>
          </VStack>
        </GlassCard>
        {/* (Optional) Translation History Section can go here */}
      </VStack>
      <VStack spacing={8} align="stretch">
        {/* Error Display */}
        {error && (
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            <Box>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
        )}

        

        {/* History */}
        {transcriptionHistory.length > 0 && (
          <GlassCard>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <Heading size="md">History</Heading>
                <HStack>
                  <FuturisticButton
                    leftIcon={FaDownload}
                    onClick={handleDownloadTranscript}
                    size="sm"
                    variant="outline"
                  >
                    Download
                  </FuturisticButton>
                  <FuturisticButton
                    leftIcon={FaTrash}
                    onClick={handleClearHistory}
                    size="sm"
                    variant="outline"
                    colorScheme="red"
                  >
                    Clear History
                  </FuturisticButton>
                </HStack>
              </HStack>

              <Divider />

              <VStack spacing={4} align="stretch" maxH="400px" overflowY="auto">
                {transcriptionHistory.map((entry) => (
                  <Box
                    key={entry.id}
                    p={4}
                    bg="rgba(255, 255, 255, 0.03)"
                    borderRadius="md"
                    border="1px solid"
                    borderColor={borderColor}
                  >
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm" color={textColor}>
                        {entry.timestamp.toLocaleString()}
                      </Text>
                      <Badge
                        colorScheme={entry.isReliableDetection ? "green" : "yellow"}
                        variant="subtle"
                        fontSize="xs"
                      >
                        {getLanguageName(entry.detectedLanguage)} ({entry.detectionConfidence.toFixed(1)}%)
                      </Badge>
                    </HStack>
                    
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Original: {entry.originalText}
                    </Text>
                    
                    {enableTranslation && (
                      <Text fontSize="sm" color={textColor}>
                        Translated: {entry.translatedText}
                      </Text>
                    )}
                  </Box>
                ))}
              </VStack>
            </VStack>
          </GlassCard>
        )}
      </VStack>
    </Box>
  );
};

export default DeepgramSTTPage; 