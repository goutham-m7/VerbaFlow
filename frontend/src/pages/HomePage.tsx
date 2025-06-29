import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const HomePage: React.FC = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBgColor = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const features = [
    {
      title: 'Real-time Translation',
      description: 'Instant speech-to-text and translation in multiple languages',
      icon: '🌐',
    },
    {
      title: 'Video Conferencing',
      description: 'High-quality video meetings with live subtitles',
      icon: '📹',
    },
    {
      title: 'Multi-language Support',
      description: 'Support for 10+ languages with high accuracy',
      icon: '🗣️',
    },
    {
      title: 'Cloud Recording',
      description: 'Automatic meeting recording and transcription',
      icon: '💾',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        color="white"
        py={20}
      >
        <Container maxW="container.xl">
          <VStack spacing={8} textAlign="center">
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Heading size="2xl" mb={4}>
                Break Language Barriers
              </Heading>
              <Text fontSize="xl" opacity={0.9}>
                Real-time speech translation and video conferencing platform
              </Text>
            </MotionBox>

            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <HStack spacing={4}>
                <Link to="/lingualive">
                  <Button size="lg" colorScheme="whiteAlpha" variant="solid">
                    Try LinguaLive
                  </Button>
                </Link>
                <Link to="/meet">
                  <Button size="lg" variant="outline" color="white" borderColor="white">
                    Start Meeting
                  </Button>
                </Link>
              </HStack>
            </MotionBox>
          </VStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={16} bg={bgColor}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              textAlign="center"
            >
              <Heading size="lg" mb={4}>
                Powerful Features
              </Heading>
              <Text fontSize="lg" color={textColor}>
                Everything you need for seamless multilingual communication
              </Text>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
              {features.map((feature, index) => (
                <MotionBox
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Box
                    bg={cardBgColor}
                    p={6}
                    borderRadius="lg"
                    textAlign="center"
                    height="full"
                  >
                    <Text fontSize="4xl" mb={4}>
                      {feature.icon}
                    </Text>
                    <Heading size="md" mb={3}>
                      {feature.title}
                    </Heading>
                    <Text color={textColor}>
                      {feature.description}
                    </Text>
                  </Box>
                </MotionBox>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Products Section */}
      <Box py={16} bg={cardBgColor}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              textAlign="center"
            >
              <Heading size="lg" mb={4}>
                Our Products
              </Heading>
              <Text fontSize="lg" color={textColor}>
                Choose the right tool for your communication needs
              </Text>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} w="full">
              {/* LinguaLive */}
              <MotionBox
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Box
                  bg={bgColor}
                  p={8}
                  borderRadius="xl"
                  boxShadow="lg"
                  height="full"
                >
                  <VStack spacing={6} align="stretch">
                    <Box textAlign="center">
                      <Text fontSize="4xl" mb={4}>
                        🎤
                      </Text>
                      <Heading size="lg" mb={3}>
                        LinguaLive
                      </Heading>
                      <Text color={textColor}>
                        Standalone real-time speech translator for instant conversations
                      </Text>
                    </Box>

                    <Box>
                      <Text fontWeight="semibold" mb={2}>
                        Features:
                      </Text>
                      <VStack spacing={2} align="start">
                        <Text color={textColor}>• Real-time speech recognition</Text>
                        <Text color={textColor}>• Instant translation</Text>
                        <Text color={textColor}>• Multiple language support</Text>
                        <Text color={textColor}>• Audio visualization</Text>
                      </VStack>
                    </Box>

                    <Link to="/lingualive">
                      <Button colorScheme="brand" size="lg" w="full">
                        Try LinguaLive
                      </Button>
                    </Link>
                  </VStack>
                </Box>
              </MotionBox>

              {/* LinguaLive Meet */}
              <MotionBox
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Box
                  bg={bgColor}
                  p={8}
                  borderRadius="xl"
                  boxShadow="lg"
                  height="full"
                >
                  <VStack spacing={6} align="stretch">
                    <Box textAlign="center">
                      <Text fontSize="4xl" mb={4}>
                        📹
                      </Text>
                      <Heading size="lg" mb={3}>
                        LinguaLive Meet
                      </Heading>
                      <Text color={textColor}>
                        Video conferencing platform with live multilingual subtitles
                      </Text>
                    </Box>

                    <Box>
                      <Text fontWeight="semibold" mb={2}>
                        Features:
                      </Text>
                      <VStack spacing={2} align="start">
                        <Text color={textColor}>• HD video conferencing</Text>
                        <Text color={textColor}>• Live transcription</Text>
                        <Text color={textColor}>• Real-time subtitles</Text>
                        <Text color={textColor}>• Meeting recording</Text>
                      </VStack>
                    </Box>

                    <Link to="/meet">
                      <Button colorScheme="brand" size="lg" w="full">
                        Start Meeting
                      </Button>
                    </Link>
                  </VStack>
                </Box>
              </MotionBox>
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={16} bg="brand.600" color="white">
        <Container maxW="container.xl">
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            textAlign="center"
          >
            <VStack spacing={6}>
              <Heading size="lg">
                Ready to Break Language Barriers?
              </Heading>
              <Text fontSize="lg" opacity={0.9}>
                Join thousands of users who are already communicating seamlessly across languages
              </Text>
              <HStack spacing={4}>
                <Link to="/lingualive">
                  <Button size="lg" colorScheme="whiteAlpha" variant="solid">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/meet">
                  <Button size="lg" variant="outline" color="white" borderColor="white">
                    Schedule Demo
                  </Button>
                </Link>
              </HStack>
            </VStack>
          </MotionBox>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage; 