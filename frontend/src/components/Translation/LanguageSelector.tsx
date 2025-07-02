import React, { useState } from 'react';
import {
  VStack,
  HStack,
  Box,
  Text,
  Select,
  Badge,
  useColorModeValue,
  FormControl,
  FormLabel,
  Tooltip,
  IconButton,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { LanguagePreferences } from '../../types';

interface LanguageSelectorProps {
  preferences: LanguagePreferences;
  onPreferencesChange: (preferences: LanguagePreferences) => void;
  showAutoDetect?: boolean;
  detectedLanguage?: string | null;
  detectionConfidence?: number;
  isReliable?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  preferences,
  onPreferencesChange,
  showAutoDetect = true,
  detectedLanguage,
  detectionConfidence,
  isReliable,
}) => {
  const [autoDetect, setAutoDetect] = useState(false);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'it', name: 'Italian', native: 'Italiano' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'ru', name: 'Russian', native: 'Русский' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'ko', name: 'Korean', native: '한국어' },
    { code: 'zh', name: 'Chinese', native: '中文' },
  ];

  const handleSourceLanguageChange = (languageCode: string) => {
    if (languageCode === 'auto') {
      setAutoDetect(true);
      onPreferencesChange({
        ...preferences,
        sourceLanguage: 'auto',
      });
    } else {
      setAutoDetect(false);
      onPreferencesChange({
        ...preferences,
        sourceLanguage: languageCode,
      });
    }
  };

  const handleTargetLanguageChange = (languageCode: string) => {
    onPreferencesChange({
      ...preferences,
      targetLanguage: languageCode,
    });
  };

  const getLanguageName = (code: string) => {
    const language = languages.find(lang => lang.code === code);
    return language ? `${language.name} (${language.native})` : code;
  };

  const getDetectionBadgeColor = () => {
    if (!detectedLanguage) return 'gray';
    if (isReliable && detectionConfidence && detectionConfidence > 0.8) return 'green';
    if (detectionConfidence && detectionConfidence > 0.6) return 'yellow';
    return 'red';
  };

  return (
    <Box
      bg={bgColor}
      p={4}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
    >
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="semibold" color="brand.600">
            Language Settings
          </Text>
          {showAutoDetect && (
            <Tooltip label="Automatically detect the source language">
              <IconButton
                size="sm"
                icon={<InfoIcon />}
                aria-label="Auto-detect info"
                variant="ghost"
              />
            </Tooltip>
          )}
        </HStack>

        {/* Source Language */}
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="medium" color={textColor}>
            Source Language
          </FormLabel>
          <HStack spacing={3}>
            <Select
              value={preferences.sourceLanguage}
              onChange={(e) => handleSourceLanguageChange(e.target.value)}
              size="sm"
              bg="#e6f7ff"
              color="#222"
              _dark={{ bg: '#005966', color: '#fff' }}
            >
              {showAutoDetect && (
                <option value="auto">
                  🔍 Auto-detect
                </option>
              )}
              {languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.name} ({language.native})
                </option>
              ))}
            </Select>
            
            {/* Detection Status */}
            {autoDetect && detectedLanguage && (
              <HStack spacing={2}>
                <Badge colorScheme={getDetectionBadgeColor()} variant="subtle">
                  {getLanguageName(detectedLanguage)}
                </Badge>
                {detectionConfidence && (
                  <Text fontSize="xs" color={textColor}>
                    {(detectionConfidence * 100).toFixed(0)}%
                  </Text>
                )}
              </HStack>
            )}
          </HStack>
        </FormControl>

        {/* Target Language */}
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="medium" color={textColor}>
            Target Language
          </FormLabel>
          <Select
            value={preferences.targetLanguage}
            onChange={(e) => handleTargetLanguageChange(e.target.value)}
            size="sm"
            bg="#b3e0ff"
            color="#222"
            _dark={{ bg: '#008699', color: '#fff' }}
          >
            {languages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.name} ({language.native})
              </option>
            ))}
          </Select>
        </FormControl>

        {/* Language Pair Display */}
        <Box
          bg={useColorModeValue('gray.50', 'gray.700')}
          p={3}
          borderRadius="md"
        >
          <HStack justify="center" spacing={2}>
            <Badge colorScheme="blue" variant="subtle" bg="#e6f7ff" color="#222" _dark={{ bg: '#005966', color: '#fff' }}>
              <span style={{ color: '#222', fontWeight: 500 }}>
                {autoDetect ? 'Auto-detect' : getLanguageName(preferences.sourceLanguage)}
              </span>
            </Badge>
            <Text fontSize="sm" color={textColor}>
              →
            </Text>
            <Badge colorScheme="green" variant="subtle" bg="#b3e0ff" color="#222" _dark={{ bg: '#008699', color: '#fff' }}>
              <span style={{ color: '#222', fontWeight: 500 }}>
                {getLanguageName(preferences.targetLanguage)}
              </span>
            </Badge>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default LanguageSelector; 