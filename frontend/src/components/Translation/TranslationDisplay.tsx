import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  useColorModeValue,
  Tooltip,
} from '@chakra-ui/react';

interface TranslationDisplayProps {
  text: string;
  language: string;
  isRecording: boolean;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}

const TranslationDisplay: React.FC<TranslationDisplayProps> = ({
  text,
  language,
  isRecording,
  onSpeak,
  isSpeaking = false,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const getLanguageName = (code: string) => {
    const languages: { [key: string]: string } = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ru: 'Russian',
      ja: 'Japanese',
      ko: 'Korean',
      zh: 'Chinese',
    };
    return languages[code] || code;
  };

  const handleSpeak = () => {
    if (onSpeak && text.trim()) {
      onSpeak(text);
    }
  };

  return (
    <Box
      bg={bgColor}
      p={6}
      borderRadius="xl"
      border="1px solid"
      borderColor={borderColor}
      boxShadow="soft"
      height="300px"
      display="flex"
      flexDirection="column"
    >
      <VStack spacing={4} align="stretch" height="full">
        {/* Header */}
        <Box>
          <HStack justify="space-between" align="center">
            <Text fontSize="lg" fontWeight="semibold" color="gray.700">
              Translation
            </Text>
            <HStack spacing={2}>
              <Badge colorScheme="green" variant="subtle">
                {getLanguageName(language)}
              </Badge>
              {isRecording && (
                <Badge colorScheme="orange" variant="solid">
                  Live
                </Badge>
              )}
              {isSpeaking && (
                <Badge colorScheme="blue" variant="solid">
                  Speaking
                </Badge>
              )}
            </HStack>
          </HStack>
        </Box>

        {/* Content */}
        <Box
          flex="1"
          bg={useColorModeValue('green.50', 'green.900')}
          p={4}
          borderRadius="md"
          overflowY="auto"
          minHeight="200px"
          border="1px solid"
          borderColor={useColorModeValue('green.200', 'green.700')}
        >
          {text ? (
            <Text
              fontSize="md"
              lineHeight="1.6"
              color="gray.800"
              whiteSpace="pre-wrap"
            >
              {text}
            </Text>
          ) : (
            <Text
              fontSize="md"
              color={textColor}
              fontStyle="italic"
              textAlign="center"
              pt={8}
            >
              {isRecording 
                ? 'Translating...'
                : 'Translation will appear here'
              }
            </Text>
          )}
        </Box>

        {/* Footer with TTS Button */}
        <Box>
          <HStack justify="space-between" align="center">
            <Text fontSize="sm" color={textColor}>
              {text ? `${text.split(' ').length} words translated` : 'Ready to translate'}
            </Text>
            {text && onSpeak && (
              <Tooltip label="Read out the translation">
                <Button
                  size="sm"
                  colorScheme="blue"
                  variant="outline"
                  onClick={handleSpeak}
                  isLoading={isSpeaking}
                  isDisabled={isSpeaking || !text.trim()}
                  leftIcon={<span>🔊</span>}
                >
                  {isSpeaking ? 'Speaking...' : 'Speak'}
                </Button>
              </Tooltip>
            )}
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default TranslationDisplay; 