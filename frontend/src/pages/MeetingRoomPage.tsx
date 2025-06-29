import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  useColorModeValue,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { useMeetingStore } from '../store/meetingStore';
import { Meeting } from '../types';

const MeetingRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { meetingId } = useParams<{ meetingId: string }>();
  const { getMeeting } = useMeetingStore();
  const toast = useToast();

  // State
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [participantName, setParticipantName] = useState('');

  // Theme colors - moved to top to avoid conditional hook calls
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBgColor = useColorModeValue('gray.50', 'gray.700');
  const placeholderBgColor = useColorModeValue('gray.100', 'gray.600');

  useEffect(() => {
    const loadMeeting = async () => {
      if (meetingId) {
        try {
          const meeting = await getMeeting(meetingId);
          setCurrentMeeting(meeting);
        } catch (error) {
          console.error('Failed to load meeting:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadMeeting();
  }, [meetingId, getMeeting]);

  const handleJoinMeeting = async () => {
    if (!participantName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your name to join the meeting.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsJoining(true);
    try {
      // In a real implementation, this would integrate with 100ms SDK
      // For now, we'll show a placeholder
      toast({
        title: 'Joining Meeting',
        description: 'Connecting to video conference...',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });

      // Simulate joining process
      setTimeout(() => {
        toast({
          title: 'Connected',
          description: 'You have joined the meeting successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setIsJoining(false);
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to join meeting',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="center">
          <Spinner size="xl" color="brand.500" />
          <Text>Loading meeting details...</Text>
        </VStack>
      </Container>
    );
  }

  if (!currentMeeting) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="center">
          <Text fontSize="xl" color="red.500">
            Meeting not found
          </Text>
          <Button onClick={() => navigate('/meet')}>
            Back to Meetings
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Meeting Header */}
        <Box
          bg={bgColor}
          p={6}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
          boxShadow="soft"
        >
          <VStack spacing={4}>
            <Text fontSize="2xl" fontWeight="bold" color="brand.600">
              {currentMeeting.title}
            </Text>
            <Text color={textColor}>
              {currentMeeting.description}
            </Text>
            <HStack spacing={4}>
              <Text fontSize="sm" color={textColor}>
                Meeting ID: {currentMeeting.meeting_id}
              </Text>
              <Text fontSize="sm" color={textColor}>
                Status: {currentMeeting.status}
              </Text>
            </HStack>
          </VStack>
        </Box>

        {/* Join Section */}
        <Box
          bg={bgColor}
          p={6}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
          boxShadow="soft"
        >
          <VStack spacing={6}>
            <Text fontSize="xl" fontWeight="semibold" color="gray.700">
              Join Meeting
            </Text>
            
            <Box w="full">
              <Text mb={2} fontWeight="medium">
                Your Name
              </Text>
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Enter your name"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '16px',
                }}
              />
            </Box>

            <HStack spacing={4} w="full">
              <Button
                colorScheme="brand"
                size="lg"
                onClick={handleJoinMeeting}
                isLoading={isJoining}
                loadingText="Joining..."
                flex={1}
              >
                Join Meeting
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/meet')}
                flex={1}
              >
                Cancel
              </Button>
            </HStack>
          </VStack>
        </Box>

        {/* Meeting Info */}
        <Box
          bg={cardBgColor}
          p={6}
          borderRadius="xl"
        >
          <VStack spacing={4} align="start">
            <Text fontSize="lg" fontWeight="semibold" color="gray.700">
              Meeting Information
            </Text>
            <VStack spacing={2} align="start" w="full">
              <Text color={textColor}>
                • Max Participants: {currentMeeting.settings.max_participants}
              </Text>
              <Text color={textColor}>
                • Recording: {currentMeeting.settings.recording_enabled ? 'Enabled' : 'Disabled'}
              </Text>
              <Text color={textColor}>
                • Transcription: {currentMeeting.settings.transcription_enabled ? 'Enabled' : 'Disabled'}
              </Text>
              <Text color={textColor}>
                • Auto Translation: {currentMeeting.settings.auto_translate ? 'Enabled' : 'Disabled'}
              </Text>
              <Text color={textColor}>
                • Guest Access: {currentMeeting.settings.allow_guest_access ? 'Allowed' : 'Restricted'}
              </Text>
            </VStack>
          </VStack>
        </Box>

        {/* Placeholder for Video Conference */}
        <Box
          bg={placeholderBgColor}
          p={8}
          borderRadius="xl"
          textAlign="center"
          minHeight="400px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <VStack spacing={4}>
            <Text fontSize="4xl">📹</Text>
            <Text fontSize="lg" fontWeight="semibold">
              Video Conference Interface
            </Text>
            <Text color={textColor}>
              This would integrate with 100ms SDK for video conferencing
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default MeetingRoomPage; 