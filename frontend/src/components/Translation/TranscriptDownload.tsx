import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  HStack,
  Text,
  useColorModeValue,
  Tooltip,
  Badge,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { TranscriptEntry } from '../../hooks/useTranscript';

interface TranscriptDownloadProps {
  entries: TranscriptEntry[];
  sessionDuration: number;
  wordCount: number;
  onDownload: (format: 'txt' | 'json' | 'csv') => void;
}

const TranscriptDownload: React.FC<TranscriptDownloadProps> = ({
  entries,
  sessionDuration,
  wordCount,
  onDownload,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const handleDownload = async (format: 'txt' | 'json' | 'csv') => {
    setIsDownloading(true);
    try {
      onDownload(format);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <Box
      bg={bgColor}
      p={4}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
    >
      <HStack justify="space-between" align="center" mb={3}>
        <Text fontSize="sm" fontWeight="medium" color={textColor}>
          Session Transcript
        </Text>
        <HStack spacing={2}>
          <Badge colorScheme="blue" variant="subtle">
            {entries.length} entries
          </Badge>
          <Badge colorScheme="green" variant="subtle">
            {wordCount} words
          </Badge>
          <Badge colorScheme="purple" variant="subtle">
            {formatDuration(sessionDuration)}
          </Badge>
        </HStack>
      </HStack>

      <HStack spacing={2}>
        <Menu>
          <Tooltip label="Download transcript in different formats">
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              colorScheme="brand"
              size="sm"
              isLoading={isDownloading}
              isDisabled={entries.length === 0}
            >
              Download Transcript
            </MenuButton>
          </Tooltip>
          <MenuList>
            <MenuItem onClick={() => handleDownload('txt')}>
              📄 Text File (.txt)
            </MenuItem>
            <MenuItem onClick={() => handleDownload('json')}>
              📊 JSON File (.json)
            </MenuItem>
            <MenuItem onClick={() => handleDownload('csv')}>
              📈 CSV File (.csv)
            </MenuItem>
          </MenuList>
        </Menu>

        {entries.length > 0 && (
          <Text fontSize="xs" color={textColor}>
            Ready to download
          </Text>
        )}
      </HStack>

      {entries.length === 0 && (
        <Text fontSize="xs" color={textColor} mt={2}>
          Start recording to generate transcript
        </Text>
      )}
    </Box>
  );
};

export default TranscriptDownload; 