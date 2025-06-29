import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';

interface TranscriptionDisplayProps {
  text: string;
  language: string;
  isRecording: boolean;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  text,
  language,
  isRecording,
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
              Transcription
            </Text>
            <HStack spacing={2}>
              <Badge colorScheme="blue" variant="subtle">
                {getLanguageName(language)}
              </Badge>
              {isRecording && (
                <Badge colorScheme="red" variant="solid">
                  Recording
                </Badge>
              )}
            </HStack>
          </HStack>
        </Box>

        {/* Content */}
        <Box
          flex="1"
          bg={useColorModeValue('gray.50', 'gray.700')}
          p={4}
          borderRadius="md"
          overflowY="auto"
          minHeight="200px"
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
                ? 'Listening... Speak now to see transcription'
                : 'Click "Start Recording" to begin transcription'
              }
            </Text>
          )}
        </Box>

        {/* Footer */}
        <Box>
          <Text fontSize="sm" color={textColor} textAlign="center">
            {text ? `${text.split(' ').length} words` : 'Ready to transcribe'}
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default TranscriptionDisplay; 