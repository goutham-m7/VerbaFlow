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
      <Text fontSize="2xl" fontWeight="bold" color="brand.600">
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

  if (!isSupported) {
    return (
      <Container maxW="container.md" py={8}>
        <Box textAlign="center" py={12}>
          <Text fontSize="xl" color="red.500" mb={4}>
            Microphone access is not supported in your browser
          </Text>
          <Text color="gray.600">
            Please use a modern browser that supports Web Audio API
          </Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.sm" py={6}>
      <WelcomeBanner />
      <VStack spacing={6} align="stretch">
        {/* Central Start/Stop Button & Live Feedback */}
        <VStack spacing={2} align="center">
          <CentralRecordButton />
          <AudioVisualizer level={audioLevel} isActive={isTranscribing} />
          {isTranscribing && (
            <Text color="green.500" fontWeight="medium">Listening…</Text>
          )}
          {!isTranscribing && audioLevel > 0 && (
            <Text color="orange.500" fontWeight="medium" fontSize="sm">
              Microphone still active - click Stop again
            </Text>
          )}
          <DetectedLanguageBadge />
        </VStack>

        {/* Language Selector */}
        <LanguageSelectorComponent />

        {/* Translation Display */}
        <Box
          bg={translationBgColor}
          p={6}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
          textAlign="center"
        >
          <Text fontSize="lg" color={textColor} mb={2}>
            Translation
          </Text>
          
          {translation && detectedLanguage && detectedLanguage === languagePreferences.targetLanguage ? (
            <VStack spacing={3}>
              <Text fontSize="6xl" mb={2}>✅</Text>
              <Text fontSize="lg" color="green.600" fontWeight="medium">
                No translation needed
              </Text>
              <Text fontSize="md" color={textColor}>
                Your text is already in {getLanguageName(languagePreferences.targetLanguage)}
              </Text>
              <Text fontSize="sm" color="gray.500" bg="gray.50" p={3} borderRadius="md" w="full">
                "{translation}"
              </Text>
            </VStack>
          ) : (
            <>
              <Text fontSize="2xl" fontWeight="bold" color="brand.600" mb={2}>
                {translation || '…'}
              </Text>
              {translation && enablePunctuation && (
                <Text fontSize="xs" color="gray.500" mb={2}>
                  ✨ Punctuation automatically added
                </Text>
              )}
              <Button
                size="md"
                colorScheme="blue"
                leftIcon={<span>🔊</span>}
                onClick={() => handleSpeakTranslation(translation)}
                isDisabled={!translation}
                mt={2}
              >
                Listen
              </Button>
            </>
          )}
        </Box>

        {/* Transcript Panel (collapsible on mobile) */}
        <Box>
          <HStack justify="space-between" align="center" mb={2}>
            <Text fontSize="md" fontWeight="semibold" color={textColor}>
              Transcript
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
                      <Text fontSize="sm" color="brand.600">
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