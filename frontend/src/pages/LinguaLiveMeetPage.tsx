import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useMeetingStore } from '../store/meetingStore';
import { CreateMeetingRequest } from '../types';

const MotionBox = motion(Box);

const LinguaLiveMeetPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { createMeeting, isLoading } = useMeetingStore();
  
  const [meetingTitle, setMeetingTitle] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const handleCreateMeeting = async () => {
    if (!meetingTitle.trim() || !participantName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in both meeting title and your name.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsCreating(true);
    try {
      const meetingData: CreateMeetingRequest = {
        title: meetingTitle,
        description: `Meeting created by ${participantName}`,
        settings: {
          max_participants: 20,
          recording_enabled: true,
          transcription_enabled: true,
          auto_translate: true,
          allow_guest_access: true,
          require_authentication: false,
        },
      };

      const meeting = await createMeeting(meetingData);
      
      toast({
        title: 'Meeting Created',
        description: 'Your meeting has been created successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Navigate to the meeting room
      navigate(`/meet/${meeting.meeting_id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create meeting',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinMeeting = () => {
    if (!participantName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your name to join a meeting.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // For now, we'll use a placeholder meeting ID
    // In a real app, you'd have a meeting ID input or join via link
    const meetingId = prompt('Enter meeting ID:');
    if (meetingId) {
      navigate(`/meet/${meetingId}`);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <MotionBox
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          textAlign="center"
        >
          <Text fontSize="4xl" fontWeight="bold" color="brand.600" mb={2}>
            LinguaLive Meet
          </Text>
          <Text fontSize="lg" color={textColor}>
            Video conferencing with real-time multilingual subtitles
          </Text>
        </MotionBox>

        {/* Create Meeting Section */}
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
            <VStack spacing={6}>
              <Text fontSize="xl" fontWeight="semibold" color="gray.700">
                Create New Meeting
              </Text>

              <FormControl>
                <FormLabel>Meeting Title</FormLabel>
                <Input
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="Enter meeting title"
                  size="lg"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Your Name</FormLabel>
                <Input
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Enter your name"
                  size="lg"
                />
              </FormControl>

              <Button
                colorScheme="brand"
                size="lg"
                onClick={handleCreateMeeting}
                isLoading={isCreating || isLoading}
                loadingText="Creating Meeting"
                w="full"
              >
                Create Meeting
              </Button>
            </VStack>
          </Box>
        </MotionBox>

        {/* Join Meeting Section */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
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
                Join Existing Meeting
              </Text>

              <FormControl>
                <FormLabel>Your Name</FormLabel>
                <Input
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Enter your name"
                  size="lg"
                />
              </FormControl>

              <Button
                variant="outline"
                colorScheme="brand"
                size="lg"
                onClick={handleJoinMeeting}
                w="full"
              >
                Join Meeting
              </Button>
            </VStack>
          </Box>
        </MotionBox>

        {/* Features */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Box
            bg={useColorModeValue('gray.50', 'gray.700')}
            p={6}
            borderRadius="xl"
          >
            <VStack spacing={4}>
              <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                Features
              </Text>
              <VStack spacing={2} align="start" w="full">
                <Text color={textColor}>• HD video and audio quality</Text>
                <Text color={textColor}>• Real-time speech transcription</Text>
                <Text color={textColor}>• Live multilingual subtitles</Text>
                <Text color={textColor}>• Screen sharing and recording</Text>
                <Text color={textColor}>• Up to 20 participants</Text>
                <Text color={textColor}>• Guest access support</Text>
              </VStack>
            </VStack>
          </Box>
        </MotionBox>
      </VStack>
    </Container>
  );
};

export default LinguaLiveMeetPage; 