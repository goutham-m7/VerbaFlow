import React, { useState, useEffect } from 'react';
import { Box, Container, VStack, HStack, Text, Button, useColorModeValue, Collapse, Badge, useBreakpointValue, Select, Switch, IconButton } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

// Components
import AudioVisualizer from '../components/AudioCapture/AudioVisualizer';
import TranscriptDownload from '../components/Translation/TranscriptDownload';

// Types
import { LanguagePreferences } from '../types';

// Hooks
import { useTranslation } from '../hooks/useTranslation';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { useTTS } from '../hooks/useTTS';
import { useTranscript } from '../hooks/useTranscript';
import { useLanguageDetection } from '../hooks/useLanguageDetection';

const LinguaLivePage: React.FC = () => {
  // Helper function to get language names
  const getLanguageName = (code: string): string => {
    const languageMap: { [key: string]: string } = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'no': 'Norwegian',
      'da': 'Danish',
      'fi': 'Finnish',
      'pl': 'Polish',
      'tr': 'Turkish',
      'he': 'Hebrew',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'id': 'Indonesian',
      'ms': 'Malay',
      'fa': 'Persian'
    };
    return languageMap[code] || code.toUpperCase();
  };

  // Move all useColorModeValue calls to the top level
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const transcriptBgColor = useColorModeValue('gray.50', 'gray.700');
  const translationBgColor = useColorModeValue('gray.50', 'gray.700');

  const [languagePreferences, setLanguagePreferences] = useState<LanguagePreferences>({
    sourceLanguage: 'auto',
    targetLanguage: 'en',
  });
  const [translation, setTranslation] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [enablePunctuation, setEnablePunctuation] = useState(true);

  // Responsive transcript panel
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Audio capture
  const {
    isSupported,
    isTranscribing,
    audioLevel,
    startRecording,
    stopRecording,
    transcription,
    forceCleanup,
  } = useAudioCapture();

  // Translation
  const { translate, translateWithDetection } = useTranslation();

  // TTS
  const { speak, provider } = useTTS();

  // Transcript
  const {
    entries: transcriptEntries,
    addEntry: addTranscriptEntry,
    clearSession: clearTranscriptSession,
    startSession: startTranscriptSession,
    stopSession: stopTranscriptSession,
    downloadTranscript,
    getSessionDuration,
    getWordCount,
  } = useTranscript();

  // Language detection
  const {
    detectedLanguage,
    detectionConfidence,
    isReliable,
    detectLanguage,
    clearDetection,
  } = useLanguageDetection();

  // Auto-translate when transcription changes
  useEffect(() => {
    if (transcription.trim()) {
      if (languagePreferences.sourceLanguage === 'auto') {
        translateWithDetection(
          transcription,
          languagePreferences.targetLanguage,
          true,
          enablePunctuation
        ).then(result => {
          if (result && result.translated_text) {
            setTranslation(result.translated_text);
            if (transcription.trim() && result.translated_text.trim()) {
              addTranscriptEntry({
                originalText: transcription,
                translatedText: result.translated_text,
                sourceLanguage: result.detected_language,
                targetLanguage: result.target_language,
                confidence: result.confidence,
              });
            }
          }
        })
        .catch(err => {
          setTranslation('Translation failed: ' + err.message);
        });
      } else {
        translate(
          transcription,
          languagePreferences.sourceLanguage,
          languagePreferences.targetLanguage,
          enablePunctuation
        ).then(result => {
          if (result && result.translated_text) {
            setTranslation(result.translated_text);
            if (transcription.trim() && result.translated_text.trim()) {
              addTranscriptEntry({
                originalText: transcription,
                translatedText: result.translated_text,
                sourceLanguage: result.source_language,
                targetLanguage: result.target_language,
                confidence: result.confidence,
              });
            }
          }
        })
        .catch(err => {
          setTranslation('Translation failed: ' + err.message);
        });
      }
    } else {
      setTranslation('');
    }
  }, [transcription, languagePreferences, translate, translateWithDetection, addTranscriptEntry, enablePunctuation]);

  // Detect language when transcription changes (for auto-detect mode)
  useEffect(() => {
    if (transcription.trim() && languagePreferences.sourceLanguage === 'auto') {
      detectLanguage(transcription);
    } else if (!transcription.trim()) {
      clearDetection();
    }
  }, [transcription, languagePreferences.sourceLanguage, detectLanguage, clearDetection]);

  const handleStartRecording = async () => {
    try {
      await startRecording();
      startTranscriptSession();
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const handleStopRecording = async () => {
    console.log('Stop button clicked - isTranscribing:', isTranscribing);
    try {
      console.log('Calling stopRecording()...');
      await stopRecording();
      console.log('stopRecording() completed successfully');
      stopTranscriptSession();
      console.log('Transcript session stopped');
      
      // Force a small delay to ensure all cleanup is complete
      setTimeout(() => {
        console.log('Cleanup delay completed');
      }, 100);
    } catch (err) {
      console.error('Failed to stop recording:', err);
      // Force stop even if there's an error
      console.log('Forcing stop due to error...');
      try {
        await stopRecording();
      } catch (forceErr) {
        console.error('Force stop also failed:', forceErr);
        // Use forceCleanup as final fallback
        console.log('Using forceCleanup as final fallback...');
        forceCleanup();
      }
    }
  };

  const handleSpeakTranslation = (text: string) => {
    const languageCode = languagePreferences.targetLanguage === 'zh' ? 'zh-CN' : 
                        languagePreferences.targetLanguage === 'ja' ? 'ja-JP' :
                        languagePreferences.targetLanguage === 'ko' ? 'ko-KR' :
                        `${languagePreferences.targetLanguage}-${languagePreferences.targetLanguage.toUpperCase()}`;
    speak(text, languageCode, provider);
  };

  // Central record button
  const CentralRecordButton = () => {
    console.log('Button render - isTranscribing:', isTranscribing);
    
    const handleStopClick = () => {
      if (isTranscribing) {
        handleStopRecording();
        // If still transcribing after a short delay, force cleanup
        setTimeout(() => {
          if (isTranscribing) {
            console.log('Stop button double-click detected, forcing cleanup...');
            forceCleanup();
          }
        }, 500);
      } else {
        handleStartRecording();
      }
    };
    
    return (
      <VStack spacing={1} align="center">
        <Button
          colorScheme={isTranscribing ? 'red' : 'brand'}
          height={{ base: '100px', md: '120px' }}
          width={{ base: '100px', md: '120px' }}
          borderRadius="full"
          fontSize={{ base: '2xl', md: '3xl' }}
          boxShadow="2xl"
          onClick={handleStopClick}
          aria-label={isTranscribing ? 'Stop Recording' : 'Start Recording'}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={0}
        >
          <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{isTranscribing ? '⏹️' : '🎤'}</span>
        </Button>
        <Text fontSize="md" color={textColor} fontWeight="medium" mt={1}>
          {isTranscribing ? 'Stop' : 'Start'}
        </Text>
      </VStack>
    );
  };

  // Detected language badge
  const DetectedLanguageBadge = () => (
    detectedLanguage ? (
      <Badge
        colorScheme={isReliable && detectionConfidence && detectionConfidence > 0.8 ? 'green' : 'yellow'}
        fontSize="md"
        px={3}
        py={1}
        borderRadius="md"
        mt={2}
      >
        Detected: {detectedLanguage.toUpperCase()} {detectionConfidence ? `(${Math.round(detectionConfidence * 100)}%)` : ''}
      </Badge>
    ) : null
  );

  // Welcome banner
  const WelcomeBanner = () => (
    <Box textAlign="center" mb={4}>
      <Text fontSize="2xl" fontWeight="bold" color="blue.600">
        Speak. We'll detect your language and translate instantly.
      </Text>
      <Text fontSize="md" color={textColor} mt={2}>
        Just press Start and begin speaking. No setup needed.
      </Text>
    </Box>
  );

  // Language selector component
  const LanguageSelectorComponent = () => (
    <Box
      bg={translationBgColor}
      p={4}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
    >
      <Text fontSize="md" fontWeight="semibold" color={textColor} mb={3}>
        Translation Settings
      </Text>
      <VStack spacing={3} align="stretch">
        {/* Language Detection Mode */}
        <Box>
          <Text fontSize="sm" color={textColor} mb={1}>
            Language Detection:
          </Text>
          <Select
            value={languagePreferences.sourceLanguage === 'auto' ? 'auto' : 'manual'}
            onChange={(e) => {
              const mode = e.target.value;
              setLanguagePreferences(prev => ({
                ...prev,
                sourceLanguage: mode === 'auto' ? 'auto' : 'en' // Default to English for manual mode
              }));
            }}
            size="md"
            bg={bgColor}
            borderColor={borderColor}
            mb={2}
            color={textColor}
            _hover={{ borderColor: 'blue.400' }}
            _focus={{ borderColor: 'blue.500', boxShadow: 'outline' }}
          >
            <option value="auto" style={{ color: textColor, backgroundColor: bgColor }}>Auto Detection</option>
            <option value="manual" style={{ color: textColor, backgroundColor: bgColor }}>Manual Selection</option>
          </Select>
          
          {/* Manual Language Selection */}
          {languagePreferences.sourceLanguage !== 'auto' && (
            <Box>
              <Text fontSize="sm" color={textColor} mb={1}>
                I'm speaking in:
              </Text>
              <Select
                value={languagePreferences.sourceLanguage}
                onChange={(e) => setLanguagePreferences(prev => ({
                  ...prev,
                  sourceLanguage: e.target.value
                }))}
                size="md"
                bg={bgColor}
                borderColor={borderColor}
                color={textColor}
                _hover={{ borderColor: 'blue.400' }}
                _focus={{ borderColor: 'blue.500', boxShadow: 'outline' }}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="ru">Russian</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="ar">Arabic</option>
                <option value="hi">Hindi</option>
                <option value="nl">Dutch</option>
                <option value="sv">Swedish</option>
                <option value="no">Norwegian</option>
                <option value="da">Danish</option>
                <option value="fi">Finnish</option>
                <option value="pl">Polish</option>
                <option value="tr">Turkish</option>
                <option value="he">Hebrew</option>
                <option value="th">Thai</option>
                <option value="vi">Vietnamese</option>
                <option value="id">Indonesian</option>
                <option value="ms">Malay</option>
                <option value="fa">Persian</option>
              </Select>
            </Box>
          )}
        </Box>

        <Box>
          <Text fontSize="sm" color={textColor} mb={1}>
            Translate to:
          </Text>
          <Select
            value={languagePreferences.targetLanguage}
            onChange={(e) => setLanguagePreferences(prev => ({
              ...prev,
              targetLanguage: e.target.value
            }))}
            size="md"
            bg={bgColor}
            borderColor={borderColor}
            color={textColor}
            _hover={{ borderColor: 'blue.400' }}
            _focus={{ borderColor: 'blue.500', boxShadow: 'outline' }}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
            <option value="ru">Russian</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="ar">Arabic</option>
            <option value="hi">Hindi</option>
            <option value="nl">Dutch</option>
            <option value="sv">Swedish</option>
            <option value="no">Norwegian</option>
            <option value="da">Danish</option>
            <option value="fi">Finnish</option>
            <option value="pl">Polish</option>
            <option value="tr">Turkish</option>
            <option value="he">Hebrew</option>
            <option value="th">Thai</option>
            <option value="vi">Vietnamese</option>
            <option value="id">Indonesian</option>
            <option value="ms">Malay</option>
            <option value="fa">Persian</option>
          </Select>
        </Box>
        <HStack justify="space-between" align="center">
          <Text fontSize="sm" color={textColor}>
            Auto-punctuation:
          </Text>
          <Switch
            isChecked={enablePunctuation}
            onChange={(e) => setEnablePunctuation(e.target.checked)}
            colorScheme="brand"
            size="md"
          />
        </HStack>
      </VStack>
    </Box>
  );

  // Current Speaking Text Component
  const CurrentSpeakingText = () => (
    <Box
      bg={transcriptBgColor}
      p={4}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
      minH="120px"
      display="flex"
      flexDirection="column"
    >
      <Text fontSize="md" fontWeight="semibold" color={textColor} mb={2}>
        What I'm Saying
      </Text>
      <Box flex="1" display="flex" alignItems="center" justifyContent="center">
        {transcription ? (
          <Text fontSize="lg" color="blue.600" fontWeight="medium" textAlign="center">
            "{transcription}"
          </Text>
        ) : (
          <Text fontSize="md" color="gray.500" textAlign="center">
            Start speaking to see your text here...
          </Text>
        )}
      </Box>
      {languagePreferences.sourceLanguage === 'auto' && detectedLanguage && (
        <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
          Detected: {getLanguageName(detectedLanguage)} 
          {detectionConfidence && ` (${Math.round(detectionConfidence * 100)}% confidence)`}
        </Text>
      )}
    </Box>
  );

  // Translation Display Component
  const TranslationDisplay = () => (
    <Box
      bg={translationBgColor}
      p={4}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
      minH="120px"
      display="flex"
      flexDirection="column"
    >
      <Text fontSize="md" fontWeight="semibold" color={textColor} mb={2}>
        Translation
      </Text>
      <Box flex="1" display="flex" alignItems="center" justifyContent="center">
        {translation && detectedLanguage && detectedLanguage === languagePreferences.targetLanguage ? (
          <VStack spacing={2}>
            <Text fontSize="6xl">✅</Text>
            <Text fontSize="md" color="green.600" fontWeight="medium" textAlign="center">
              No translation needed
            </Text>
            <Text fontSize="sm" color="textColor" textAlign="center">
              Already in {getLanguageName(languagePreferences.targetLanguage)}
            </Text>
          </VStack>
        ) : translation ? (
          <VStack spacing={2}>
            <Text fontSize="lg" fontWeight="bold" color="blue.600" textAlign="center">
              {translation}
            </Text>
            {enablePunctuation && (
              <Text fontSize="xs" color="gray.500">
                ✨ Punctuation added
              </Text>
            )}
            <Button
              size="sm"
              colorScheme="blue"
              leftIcon={<span>🔊</span>}
              onClick={() => handleSpeakTranslation(translation)}
            >
              Listen
            </Button>
          </VStack>
        ) : (
          <Text fontSize="md" color="gray.500" textAlign="center">
            Translation will appear here...
          </Text>
        )}
      </Box>
    </Box>
  );

  if (!isSupported) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSecure = window.isSecureContext || window.location.protocol === 'https:';
    
    return (
      <Container maxW="container.md" py={8}>
        <Box textAlign="center" py={12}>
          <VStack spacing={6}>
            <Box>
              <Text fontSize="xl" color="red.500" mb={4}>
                Microphone access is not supported in your browser
              </Text>
              <Text color="gray.600" mb={4}>
                Please use a modern browser that supports Web Audio API
              </Text>
            </Box>
            
            {isMobile && (
              <VStack spacing={4} bg="blue.50" p={6} borderRadius="lg" border="1px solid" borderColor="blue.200">
                <Text fontSize="lg" fontWeight="semibold" color="blue.800">
                  📱 Mobile Device Detected
                </Text>
                <VStack spacing={2} align="start">
                  {!isSecure && (
                    <Text fontSize="sm" color="blue.700">
                      🔒 <strong>HTTPS Required:</strong> Microphone access requires a secure connection on mobile devices.
                    </Text>
                  )}
                  <Text fontSize="sm" color="blue.700">
                    📱 <strong>Recommended Browsers:</strong> Chrome, Safari, or Firefox
                  </Text>
                  <Text fontSize="sm" color="blue.700">
                    🎤 <strong>Permissions:</strong> Make sure to allow microphone access when prompted
                  </Text>
                  <Text fontSize="sm" color="blue.700">
                    🔄 <strong>Try:</strong> Refresh the page or restart your browser
                  </Text>
                </VStack>
              </VStack>
            )}
            
            <VStack spacing={2}>
              <Text fontSize="md" fontWeight="semibold" color="gray.700">
                Supported Browsers:
              </Text>
              <HStack spacing={4} wrap="wrap" justify="center">
                <Text fontSize="sm" color="gray.600">Chrome 66+</Text>
                <Text fontSize="sm" color="gray.600">Firefox 60+</Text>
                <Text fontSize="sm" color="gray.600">Safari 14+</Text>
                <Text fontSize="sm" color="gray.600">Edge 79+</Text>
              </HStack>
            </VStack>
          </VStack>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={6}>
      <WelcomeBanner />
      <VStack spacing={6} align="stretch">
        {/* Top Row: Microphone Button (Left) and Settings (Right) */}
        <HStack spacing={6} align="flex-start" justify="space-between">
          {/* Left Side: Microphone Button */}
          <VStack spacing={3} align="center" flex="1">
            <CentralRecordButton />
            <AudioVisualizer level={audioLevel} isActive={isTranscribing} />
            {isTranscribing && (
              <Text color="green.500" fontWeight="medium" fontSize="sm">Listening…</Text>
            )}
            {!isTranscribing && audioLevel > 0 && (
              <Text color="orange.500" fontWeight="medium" fontSize="sm">
                Microphone still active - click Stop again
              </Text>
            )}
            <DetectedLanguageBadge />
          </VStack>

          {/* Right Side: Settings */}
          <Box flex="1" maxW="400px">
            <LanguageSelectorComponent />
          </Box>
        </HStack>

        {/* Bottom Row: Current Speaking Text (Left) and Translation (Right) */}
        <HStack spacing={6} align="stretch">
          {/* Left Side: Current Speaking Text */}
          <Box flex="1">
            <CurrentSpeakingText />
          </Box>

          {/* Right Side: Translation */}
          <Box flex="1">
            <TranslationDisplay />
          </Box>
        </HStack>

        {/* Transcript Panel (collapsible on mobile) */}
        <Box>
          <HStack justify="space-between" align="center" mb={2}>
            <Text fontSize="md" fontWeight="semibold" color={textColor}>
              Transcript History
            </Text>
            {isMobile && (
              <IconButton
                size="sm"
                icon={showTranscript ? <ChevronUpIcon /> : <ChevronDownIcon />}
                aria-label="Toggle transcript"
                onClick={() => setShowTranscript((prev) => !prev)}
                variant="ghost"
              />
            )}
          </HStack>
          <Collapse in={!isMobile || showTranscript} animateOpacity>
            <Box
              bg={transcriptBgColor}
              p={4}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
              maxH="200px"
              overflowY="auto"
            >
              {transcriptEntries.length === 0 ? (
                <Text fontSize="sm" color={textColor}>
                  Start speaking to see your transcript here.
                </Text>
              ) : (
                <VStack align="stretch" spacing={2}>
                  {transcriptEntries.map((entry, idx) => (
                    <Box key={idx}>
                      <HStack justify="space-between" align="center" mb={1}>
                        <Text fontSize="xs" color="gray.500">
                          {entry.sourceLanguage.toUpperCase()} → {entry.targetLanguage.toUpperCase()}
                        </Text>
                        <Text fontSize="xs" color="green.500">
                          {enablePunctuation ? '✨' : ''}
                        </Text>
                      </HStack>
                      <Text fontSize="sm" fontWeight="medium">
                        {entry.originalText}
                      </Text>
                      <Text fontSize="sm" color="blue.600">
                        {entry.translatedText}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
            <HStack mt={2} spacing={2}>
              <TranscriptDownload
                entries={transcriptEntries}
                sessionDuration={getSessionDuration()}
                wordCount={getWordCount()}
                onDownload={downloadTranscript}
              />
              {transcriptEntries.length > 0 && (
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={clearTranscriptSession}
                >
                  New Session
                </Button>
              )}
            </HStack>
          </Collapse>
        </Box>
      </VStack>
    </Container>
  );
};

export default LinguaLivePage; 