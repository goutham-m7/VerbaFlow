import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Badge,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
  FaStar,
  FaRocket,
  FaGlobe,
  FaUsers,
  FaShieldAlt,
  FaClock,
  FaVideo,
  FaMicrophone,
  FaHeadset,
  FaCog,
  FaChartLine,
  FaLock,
} from 'react-icons/fa';
import { useAuthStore } from '../store/authStore';
import GlassCard from '../components/GlassCard';
import FuturisticButton from '../components/FuturisticButton';
import IconWrapper from '../components/IconWrapper';

const MotionBox = motion(Box);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);
const MotionVStack = motion(VStack);
const MotionHStack = motion(HStack);
const MotionGridItem = motion(GridItem);
const MotionBadge = motion(Badge);

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  const features = [
    {
      icon: FaRocket,
      title: 'Real-time Translation',
      description: 'Instant speech-to-speech translation with sub-second latency',
      color: '#00E0FF',
    },
    {
      icon: FaGlobe,
      title: '100+ Languages',
      description: 'Support for major world languages and regional dialects',
      color: '#FF00C8',
    },
    {
      icon: FaUsers,
      title: 'Multi-party Calls',
      description: 'Host meetings with up to 50 participants simultaneously',
      color: '#00E0FF',
    },
    {
      icon: FaShieldAlt,
      title: 'Enterprise Security',
      description: 'End-to-end encryption and compliance with security standards',
      color: '#FF00C8',
    },
    {
      icon: FaClock,
      title: '24/7 Availability',
      description: 'Always-on service with 99.9% uptime guarantee',
      color: '#00E0FF',
    },
    {
      icon: FaVideo,
      title: 'HD Video Quality',
      description: 'Crystal clear video calls with adaptive quality',
      color: '#FF00C8',
    },
  ];

  const products = [
    {
      icon: FaMicrophone,
      title: 'LinguaLive',
      description: 'Real-time speech translation for live conversations',
      features: ['Speech-to-Speech', '100+ Languages', 'Low Latency'],
      color: '#00E0FF',
    },
    {
      icon: FaHeadset,
      title: 'LinguaLive Meet',
      description: 'Video conferencing with real-time translation',
      features: ['Video Calls', 'Screen Sharing', 'Recording'],
      color: '#FF00C8',
    },
    {
      icon: FaCog,
      title: 'API Access',
      description: 'Integrate translation capabilities into your apps',
      features: ['REST API', 'WebSocket', 'SDKs'],
      color: '#00E0FF',
    },
  ];

  const stats = [
    { number: '1M+', label: 'Translations', icon: FaChartLine },
    { number: '100+', label: 'Languages', icon: FaGlobe },
    { number: '50K+', label: 'Users', icon: FaUsers },
    { number: '99.9%', label: 'Uptime', icon: FaLock },
  ];

  return (
    <Box minH="100vh" bg="gray.900" overflow="hidden">
      {/* Hero Section */}
      <MotionBox
        position="relative"
        py={20}
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(0, 224, 255, 0.1) 0%, transparent 70%)',
          zIndex: 0,
        }}
      >
        {/* Floating Stars */}
        {[...Array(20)].map((_, i) => (
          <MotionBox
            key={i}
            position="absolute"
            width="2px"
            height="2px"
            bg="white"
            borderRadius="full"
            boxShadow="0 0 10px rgba(255, 255, 255, 0.8)"
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}

        <Container maxW="container.xl" position="relative" zIndex={1}>
          <MotionVStack
            spacing={8}
            textAlign="center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <MotionBadge
              colorScheme="brand"
              variant="subtle"
              px={4}
              py={2}
              borderRadius="full"
              fontSize="sm"
              fontWeight="medium"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <HStack spacing={2}>
                <IconWrapper icon={FaStar} color="#00E0FF" size={12} />
                <Text>Now with AI-powered translation</Text>
              </HStack>
            </MotionBadge>

            <MotionHeading
              fontSize={{ base: '4xl', md: '6xl', lg: '7xl' }}
              fontWeight="bold"
              lineHeight="shorter"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Text
                as="span"
                bg="linear-gradient(135deg, #00E0FF 0%, #FF00C8 100%)"
                bgClip="text"
                filter="drop-shadow(0 0 20px rgba(0, 224, 255, 0.5))"
              >
                Break Language
              </Text>
              <br />
              <Text
                as="span"
                bg="linear-gradient(135deg, #FF00C8 0%, #00E0FF 100%)"
                bgClip="text"
                filter="drop-shadow(0 0 20px rgba(255, 0, 200, 0.5))"
              >
                Barriers
              </Text>
            </MotionHeading>

            <MotionText
              fontSize={{ base: 'lg', md: 'xl' }}
              color="white"
              opacity={0.8}
              maxW="2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Real-time speech translation and video conferencing platform powered by cutting-edge AI technology. 
              Connect with anyone, anywhere, in any language.
            </MotionText>

            <MotionHStack
              spacing={6}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <Link to={isAuthenticated ? '/lingualive' : '/login'}>
                <FuturisticButton
                  size="lg"
                  variant="gradient"
                  leftIcon={FaRocket}
                >
                  Get Started Free
                </FuturisticButton>
              </Link>
              <Link to="/meet">
                <FuturisticButton
                  size="lg"
                  variant="outline"
                  rightIcon={FaVideo}
                >
                  Try LinguaLive Meet
                </FuturisticButton>
              </Link>
            </MotionHStack>
          </MotionVStack>
        </Container>
      </MotionBox>

      {/* Stats Section */}
      <MotionBox
        py={16}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <Container maxW="container.xl">
          <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={8}>
            {stats.map((stat, index) => (
              <MotionGridItem
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <GlassCard p={6} textAlign="center">
                  <MotionBox
                    mb={4}
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.3 }}
                  >
                    <IconWrapper icon={stat.icon} size={32} color="#00E0FF" />
                  </MotionBox>
                  <MotionText
                    fontSize="3xl"
                    fontWeight="bold"
                    color="white"
                    mb={2}
                  >
                    {stat.number}
                  </MotionText>
                  <MotionText
                    color="white"
                    opacity={0.7}
                    fontSize="sm"
                    fontWeight="medium"
                  >
                    {stat.label}
                  </MotionText>
                </GlassCard>
              </MotionGridItem>
            ))}
          </Grid>
        </Container>
      </MotionBox>

      {/* Features Section */}
      <MotionBox
        py={20}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <Container maxW="container.xl">
          <MotionVStack spacing={16}>
            <MotionVStack
              spacing={4}
              textAlign="center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <MotionHeading
                fontSize={{ base: '3xl', md: '4xl' }}
                fontWeight="bold"
                color="white"
              >
                Powerful Features
              </MotionHeading>
              <MotionText
                fontSize="lg"
                color="white"
                opacity={0.7}
                maxW="2xl"
              >
                Everything you need for seamless global communication
              </MotionText>
            </MotionVStack>

            <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={8}>
              {features.map((feature, index) => (
                <MotionGridItem
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <GlassCard p={6} h="full">
                    <MotionBox
                      mb={4}
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.3 }}
                    >
                      <IconWrapper icon={feature.icon} size={32} color={feature.color} />
                    </MotionBox>
                    <MotionHeading
                      fontSize="xl"
                      fontWeight="bold"
                      color="white"
                      mb={3}
                    >
                      {feature.title}
                    </MotionHeading>
                    <MotionText
                      color="white"
                      opacity={0.7}
                      lineHeight="tall"
                    >
                      {feature.description}
                    </MotionText>
                  </GlassCard>
                </MotionGridItem>
              ))}
            </Grid>
          </MotionVStack>
        </Container>
      </MotionBox>

      {/* Products Section */}
      <MotionBox
        py={20}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <Container maxW="container.xl">
          <MotionVStack spacing={16}>
            <MotionVStack
              spacing={4}
              textAlign="center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <MotionHeading
                fontSize={{ base: '3xl', md: '4xl' }}
                fontWeight="bold"
                color="white"
              >
                Our Products
              </MotionHeading>
              <MotionText
                fontSize="lg"
                color="white"
                opacity={0.7}
                maxW="2xl"
              >
                Choose the perfect solution for your communication needs
              </MotionText>
            </MotionVStack>

            <Grid templateColumns={{ base: 'repeat(1, 1fr)', lg: 'repeat(3, 1fr)' }} gap={8}>
              {products.map((product, index) => (
                <MotionGridItem
                  key={product.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <GlassCard p={8} h="full" position="relative" overflow="hidden">
                    <MotionBox
                      position="absolute"
                      top={4}
                      right={4}
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.3 }}
                    >
                      <IconWrapper icon={product.icon} size={40} color={product.color} />
                    </MotionBox>
                    
                    <MotionVStack spacing={4} align="start" h="full">
                      <MotionHeading
                        fontSize="2xl"
                        fontWeight="bold"
                        color="white"
                      >
                        {product.title}
                      </MotionHeading>
                      
                      <MotionText
                        color="white"
                        opacity={0.7}
                        lineHeight="tall"
                        flex={1}
                      >
                        {product.description}
                      </MotionText>

                      <MotionVStack spacing={2} align="start" w="full">
                        {product.features.map((feature, featureIndex) => (
                          <MotionHStack
                            key={feature}
                            spacing={2}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: featureIndex * 0.1 }}
                            viewport={{ once: true }}
                          >
                            <Box
                              w="2"
                              h="2"
                              bg={product.color}
                              borderRadius="full"
                              boxShadow={`0 0 8px ${product.color}`}
                            />
                            <Text color="white" fontSize="sm" opacity={0.8}>
                              {feature}
                            </Text>
                          </MotionHStack>
                        ))}
                      </MotionVStack>

                      <MotionBox w="full" pt={4}>
                        <FuturisticButton
                          variant="outline"
                          size="md"
                          w="full"
                          rightIcon={FaRocket}
                        >
                          Learn More
                        </FuturisticButton>
                      </MotionBox>
                    </MotionVStack>
                  </GlassCard>
                </MotionGridItem>
              ))}
            </Grid>
          </MotionVStack>
        </Container>
      </MotionBox>

      {/* CTA Section */}
      <MotionBox
        py={20}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <Container maxW="container.xl">
          <GlassCard p={12} textAlign="center">
            <MotionVStack spacing={8}>
              <MotionHeading
                fontSize={{ base: '3xl', md: '4xl' }}
                fontWeight="bold"
                color="white"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                Ready to Break Language Barriers?
              </MotionHeading>
              
              <MotionText
                fontSize="lg"
                color="white"
                opacity={0.7}
                maxW="2xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                Join thousands of users who are already communicating seamlessly across languages with VerbaFlow.
              </MotionText>

              <MotionHStack
                spacing={6}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Link to={isAuthenticated ? '/lingualive' : '/login'}>
                  <FuturisticButton
                    size="lg"
                    variant="gradient"
                    leftIcon={FaRocket}
                  >
                    Start Free Trial
                  </FuturisticButton>
                </Link>
                <Link to="/contact">
                  <FuturisticButton
                    size="lg"
                    variant="outline"
                    rightIcon={FaUsers}
                  >
                    Contact Sales
                  </FuturisticButton>
                </Link>
              </MotionHStack>
            </MotionVStack>
          </GlassCard>
        </Container>
      </MotionBox>
    </Box>
  );
};

export default HomePage; 