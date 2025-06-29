import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  VStack,
  HStack,
  Box,
  Text,
  Button,
  Badge,
  useColorModeValue,
  Heading,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { DownloadIcon, ViewIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import apiService from '../services/api';
import { useAuthStore } from '../store/authStore';

const MotionBox = motion(Box);

interface TranscriptSession {
  session_id: string;
  created_at: string;
  entries: Array<{
    id: string;
    timestamp: string;
    originalText: string;
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
    confidence?: number;
  }>;
  sessionInfo: {
    startTime: string;
    endTime: string;
    duration: number;
    wordCount: number;
    entryCount: number;
    sourceLanguage: string;
    targetLanguage: string;
  };
}

const TranscriptHistoryPage: React.FC = () => {
  const [sessions, setSessions] = useState<TranscriptSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<TranscriptSession | null>(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);

  const { user } = useAuthStore();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const entryBgColor = useColorModeValue('gray.50', 'gray.700');

  const fetchUserTranscripts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Remove "user-" prefix from user ID for API call
      const userId = user?._id.replace('user-', '') || '';
      const response = await apiService.getUserTranscripts(userId);
      setSessions(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transcripts');
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (user?._id) {
      fetchUserTranscripts();
    }
  }, [user?._id, fetchUserTranscripts]);

  const downloadSession = (session: TranscriptSession, format: 'txt' | 'json' | 'csv') => {
    const { entries, sessionInfo } = session;
    
    let content = '';
    let filename = `transcript_${session.session_id}_${new Date(session.created_at).toISOString().split('T')[0]}`;
    let mimeType = '';

    switch (format) {
      case 'txt':
        content = generateTextTranscript(entries, sessionInfo);
        filename += '.txt';
        mimeType = 'text/plain';
        break;
      case 'json':
        content = JSON.stringify({
          sessionInfo,
          entries: entries.map(entry => ({
            ...entry,
            timestamp: entry.timestamp
          }))
        }, null, 2);
        filename += '.json';
        mimeType = 'application/json';
        break;
      case 'csv':
        content = generateCSVTranscript(entries, sessionInfo);
        filename += '.csv';
        mimeType = 'text/csv';
        break;
    }

    // Create and download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="warning">
          <AlertIcon />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to view your transcript history.
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading your transcript history...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <MotionBox
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          textAlign="center"
        >
          <Heading size="lg" color="brand.600" mb={2}>
            Your Transcript History
          </Heading>
          <Text fontSize="lg" color={textColor}>
            View and download your past translation sessions
          </Text>
        </MotionBox>

        {/* Error Display */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Sessions Table */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Box
            bg={bgColor}
            p={6}
            borderRadius="xl"
            border="1px solid"
            borderColor={borderColor}
            boxShadow="soft"
          >
            {sessions.length === 0 ? (
              <VStack spacing={4} py={8}>
                <Text fontSize="lg" color={textColor}>
                  No transcript sessions found
                </Text>
                <Text fontSize="sm" color={textColor}>
                  Start using LinguaLive to create your first transcript session
                </Text>
                <Button colorScheme="brand" onClick={() => window.location.href = '/lingualive'}>
                  Go to LinguaLive
                </Button>
              </VStack>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Duration</Th>
                    <Th>Words</Th>
                    <Th>Entries</Th>
                    <Th>Languages</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {sessions.map((session) => (
                    <Tr key={session.session_id}>
                      <Td>{formatDate(session.created_at)}</Td>
                      <Td>{formatDuration(session.sessionInfo.duration)}</Td>
                      <Td>{session.sessionInfo.wordCount}</Td>
                      <Td>{session.sessionInfo.entryCount}</Td>
                      <Td>
                        <HStack spacing={1}>
                          <Badge colorScheme="blue" variant="subtle">
                            {session.sessionInfo.sourceLanguage}
                          </Badge>
                          <Text fontSize="xs">→</Text>
                          <Badge colorScheme="green" variant="subtle">
                            {session.sessionInfo.targetLanguage}
                          </Badge>
                        </HStack>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Tooltip label="View session details">
                            <IconButton
                              size="sm"
                              icon={<ViewIcon />}
                              aria-label="View session"
                              onClick={() => {
                                setSelectedSession(session);
                                setShowSessionDetails(true);
                              }}
                            />
                          </Tooltip>
                          <Menu>
                            <Tooltip label="Download session">
                              <MenuButton
                                as={IconButton}
                                size="sm"
                                icon={<DownloadIcon />}
                                aria-label="Download session"
                              />
                            </Tooltip>
                            <MenuList>
                              <MenuItem onClick={() => downloadSession(session, 'txt')}>
                                📄 Text File (.txt)
                              </MenuItem>
                              <MenuItem onClick={() => downloadSession(session, 'json')}>
                                📊 JSON File (.json)
                              </MenuItem>
                              <MenuItem onClick={() => downloadSession(session, 'csv')}>
                                📈 CSV File (.csv)
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Box>
        </MotionBox>

        {/* Session Details Modal */}
        {showSessionDetails && selectedSession && (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(0, 0, 0, 0.5)"
            zIndex={1000}
            display="flex"
            alignItems="center"
            justifyContent="center"
            onClick={() => setShowSessionDetails(false)}
          >
            <Box
              bg={bgColor}
              p={6}
              borderRadius="xl"
              maxW="4xl"
              maxH="80vh"
              overflowY="auto"
              onClick={(e) => e.stopPropagation()}
            >
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md">Session Details</Heading>
                  <Button size="sm" onClick={() => setShowSessionDetails(false)}>
                    Close
                  </Button>
                </HStack>
                
                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={2}>Session Information:</Text>
                  <Text fontSize="xs" color={textColor}>
                    Date: {formatDate(selectedSession.created_at)}
                  </Text>
                  <Text fontSize="xs" color={textColor}>
                    Duration: {formatDuration(selectedSession.sessionInfo.duration)}
                  </Text>
                  <Text fontSize="xs" color={textColor}>
                    Words: {selectedSession.sessionInfo.wordCount}
                  </Text>
                  <Text fontSize="xs" color={textColor}>
                    Entries: {selectedSession.sessionInfo.entryCount}
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={2}>Transcript Entries:</Text>
                  <VStack spacing={2} align="stretch" maxH="60vh" overflowY="auto">
                    {selectedSession.entries.map((entry, index) => (
                      <Box
                        key={entry.id}
                        p={3}
                        bg={entryBgColor}
                        borderRadius="md"
                      >
                        <Text fontSize="xs" color={textColor} mb={1}>
                          {index + 1}. [{new Date(entry.timestamp).toLocaleTimeString()}]
                        </Text>
                        <Text fontSize="sm" mb={1}>
                          <strong>Original ({entry.sourceLanguage}):</strong> {entry.originalText}
                        </Text>
                        <Text fontSize="sm">
                          <strong>Translation ({entry.targetLanguage}):</strong> {entry.translatedText}
                        </Text>
                        {entry.confidence && (
                          <Text fontSize="xs" color={textColor}>
                            Confidence: {(entry.confidence * 100).toFixed(1)}%
                          </Text>
                        )}
                      </Box>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            </Box>
          </MotionBox>
        )}
      </VStack>
    </Container>
  );
};

// Helper functions for generating different transcript formats
function generateTextTranscript(entries: any[], sessionInfo: any): string {
  let content = `LinguaLive Session Transcript\n`;
  content += `================================\n\n`;
  content += `Session Information:\n`;
  content += `Start Time: ${sessionInfo.startTime}\n`;
  content += `End Time: ${sessionInfo.endTime}\n`;
  content += `Duration: ${formatDuration(sessionInfo.duration)}\n`;
  content += `Total Words: ${sessionInfo.wordCount}\n`;
  content += `Total Entries: ${sessionInfo.entryCount}\n`;
  content += `Source Language: ${sessionInfo.sourceLanguage}\n`;
  content += `Target Language: ${sessionInfo.targetLanguage}\n\n`;
  content += `Transcript Entries:\n`;
  content += `==================\n\n`;

  entries.forEach((entry, index) => {
    content += `${index + 1}. [${new Date(entry.timestamp).toLocaleTimeString()}]\n`;
    content += `   Original (${entry.sourceLanguage}): ${entry.originalText}\n`;
    content += `   Translation (${entry.targetLanguage}): ${entry.translatedText}\n`;
    if (entry.confidence) {
      content += `   Confidence: ${(entry.confidence * 100).toFixed(1)}%\n`;
    }
    content += `\n`;
  });

  return content;
}

function generateCSVTranscript(entries: any[], sessionInfo: any): string {
  let content = `Timestamp,Original Text,Translation,Source Language,Target Language,Confidence\n`;
  
  entries.forEach(entry => {
    const timestamp = new Date(entry.timestamp).toISOString();
    const originalText = `"${entry.originalText.replace(/"/g, '""')}"`;
    const translatedText = `"${entry.translatedText.replace(/"/g, '""')}"`;
    const confidence = entry.confidence ? (entry.confidence * 100).toFixed(1) : '';
    
    content += `${timestamp},${originalText},${translatedText},${entry.sourceLanguage},${entry.targetLanguage},${confidence}\n`;
  });

  return content;
}

function formatDuration(seconds: number): string {
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
}

export default TranscriptHistoryPage; 