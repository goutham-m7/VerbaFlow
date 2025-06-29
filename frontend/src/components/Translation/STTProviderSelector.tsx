import React from 'react';
import {
  Box,
  Text,
  HStack,
  Button,
  useColorModeValue,
  Tooltip,
} from '@chakra-ui/react';

interface STTProviderSelectorProps {
  currentProvider: 'google' | 'browser';
  onProviderChange: (provider: 'google' | 'browser') => void;
  isRecording: boolean;
}

const STTProviderSelector: React.FC<STTProviderSelectorProps> = ({
  currentProvider,
  onProviderChange,
  isRecording,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Box
      bg={bgColor}
      p={4}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
    >
      <Text fontSize="sm" fontWeight="medium" mb={3} color={textColor}>
        Speech-to-Text Provider
      </Text>
      <HStack spacing={2}>
        <Tooltip label="Browser's built-in speech recognition (free, works offline)">
          <Button
            size="sm"
            variant={currentProvider === 'browser' ? 'solid' : 'outline'}
            colorScheme={currentProvider === 'browser' ? 'brand' : 'gray'}
            onClick={() => onProviderChange('browser')}
            isDisabled={isRecording}
            flex={1}
          >
            Browser STT
          </Button>
        </Tooltip>
        <Tooltip label="Google Cloud Speech-to-Text (requires API key, higher accuracy)">
          <Button
            size="sm"
            variant={currentProvider === 'google' ? 'solid' : 'outline'}
            colorScheme={currentProvider === 'google' ? 'brand' : 'gray'}
            onClick={() => onProviderChange('google')}
            isDisabled={isRecording}
            flex={1}
          >
            Google STT
          </Button>
        </Tooltip>
      </HStack>
      <Text fontSize="xs" color={textColor} mt={2}>
        {currentProvider === 'browser' 
          ? 'Using browser\'s built-in speech recognition'
          : 'Using Google Cloud Speech-to-Text (requires setup)'
        }
      </Text>
    </Box>
  );
};

export default STTProviderSelector; 