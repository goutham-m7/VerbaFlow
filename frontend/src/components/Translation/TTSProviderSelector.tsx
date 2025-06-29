import React from 'react';
import {
  Box,
  Text,
  HStack,
  Button,
  useColorModeValue,
  Tooltip,
} from '@chakra-ui/react';

interface TTSProviderSelectorProps {
  currentProvider: 'google' | 'browser';
  onProviderChange: (provider: 'google' | 'browser') => void;
  isPlaying: boolean;
}

const TTSProviderSelector: React.FC<TTSProviderSelectorProps> = ({
  currentProvider,
  onProviderChange,
  isPlaying,
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
        Text-to-Speech Provider
      </Text>
      <HStack spacing={2}>
        <Tooltip label="Browser's built-in speech synthesis (free, works offline)">
          <Button
            size="sm"
            variant={currentProvider === 'browser' ? 'solid' : 'outline'}
            colorScheme={currentProvider === 'browser' ? 'brand' : 'gray'}
            onClick={() => onProviderChange('browser')}
            isDisabled={isPlaying}
            flex={1}
          >
            Browser TTS
          </Button>
        </Tooltip>
        <Tooltip label="Google Cloud Text-to-Speech (requires API key, higher quality)">
          <Button
            size="sm"
            variant={currentProvider === 'google' ? 'solid' : 'outline'}
            colorScheme={currentProvider === 'google' ? 'brand' : 'gray'}
            onClick={() => onProviderChange('google')}
            isDisabled={isPlaying}
            flex={1}
          >
            Google TTS
          </Button>
        </Tooltip>
      </HStack>
      <Text fontSize="xs" color={textColor} mt={2}>
        {currentProvider === 'browser' 
          ? 'Using browser\'s built-in speech synthesis'
          : 'Using Google Cloud Text-to-Speech (requires setup)'
        }
      </Text>
    </Box>
  );
};

export default TTSProviderSelector; 