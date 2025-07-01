import React from 'react';
import { 
  Box, 
  Container, 
  Stack, 
  Text, 
  Link, 
  HStack,
  IconButton,
  Divider,
  Flex
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { 
  FaTwitter, 
  FaLinkedin, 
  FaGithub, 
  FaDiscord,
  FaHeart,
  FaRocket
} from 'react-icons/fa';
import IconWrapper from '../IconWrapper';

const MotionBox = motion(Box);
const MotionText = motion(Text);
const MotionIconButton = motion(IconButton);
const MotionLink = motion(Link);
const MotionDivider = motion(Divider);
const MotionFlex = motion(Flex);

const Footer: React.FC = () => {
  const socialLinks = [
    { icon: FaTwitter, href: '#', label: 'Twitter', color: '#1DA1F2' },
    { icon: FaLinkedin, href: '#', label: 'LinkedIn', color: '#0077B5' },
    { icon: FaGithub, href: '#', label: 'GitHub', color: '#333' },
    { icon: FaDiscord, href: '#', label: 'Discord', color: '#7289DA' },
  ];

  const quickLinks = [
    { name: 'LinguaLive', href: '/lingualive' },
    { name: 'LinguaLive Meet', href: '/meet' },
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
  ];

  const supportLinks = [
    { name: 'Help Center', href: '/help' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'System Status', href: '/status' },
    { name: 'Documentation', href: '/docs' },
  ];

  const companyLinks = [
    { name: 'About', href: '/about' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Careers', href: '/careers' },
  ];

  return (
    <MotionBox
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      bg="rgba(15, 15, 28, 0.9)"
      backdropFilter="blur(20px)"
      borderTop="1px solid rgba(0, 224, 255, 0.2)"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(0, 224, 255, 0.5) 50%, transparent 100%)',
      }}
    >
      <Container maxW="container.xl" py={12}>
        <Stack spacing={12}>
          {/* Main Footer Content */}
          <Stack
            direction={{ base: 'column', lg: 'row' }}
            spacing={12}
            justify="space-between"
            align={{ base: 'center', lg: 'flex-start' }}
          >
            {/* Company Info */}
            <MotionBox
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              maxW="300px"
            >
              <MotionFlex
                align="center"
                mb={4}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Box
                  w="40px"
                  h="40px"
                  bg="linear-gradient(135deg, #00E0FF 0%, #FF00C8 100%)"
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="0 0 20px rgba(0, 224, 255, 0.5)"
                  mr={3}
                >
                  <IconWrapper icon={FaRocket} color="white" size={16} />
                </Box>
                <MotionText
                  fontSize="2xl"
                  fontWeight="bold"
                  bg="linear-gradient(135deg, #00E0FF 0%, #FF00C8 100%)"
                  bgClip="text"
                >
                  VerbaFlow
                </MotionText>
              </MotionFlex>
              
              <MotionText
                color="white"
                opacity={0.8}
                lineHeight="tall"
                mb={4}
              >
                Real-time speech translation and video conferencing platform powered by cutting-edge AI technology.
              </MotionText>

              {/* Social Links */}
              <HStack spacing={3}>
                {socialLinks.map((social, index) => (
                  <MotionIconButton
                    key={social.label}
                    aria-label={social.label}
                    icon={<IconWrapper icon={social.icon} size={16} />}
                    variant="ghost"
                    size="md"
                    color="white"
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ 
                      scale: 1.2,
                      rotate: 360,
                      color: social.color,
                      boxShadow: `0 0 20px ${social.color}40`
                    }}
                    whileTap={{ scale: 0.9 }}
                    _hover={{
                      bg: 'rgba(255, 255, 255, 0.1)',
                    }}
                  />
                ))}
              </HStack>
            </MotionBox>

            {/* Footer Links */}
            <Stack
              direction={{ base: 'column', md: 'row' }}
              spacing={8}
              flex={1}
              justify="space-around"
            >
              {/* Quick Links */}
              <MotionBox
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <MotionText
                  fontWeight="bold"
                  color="blue.400"
                  mb={4}
                  fontSize="lg"
                >
                  Product
                </MotionText>
                <Stack spacing={3}>
                  {quickLinks.map((link, index) => (
                    <MotionLink
                      key={link.name}
                      href={link.href}
                      color="white"
                      opacity={0.8}
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      viewport={{ once: true }}
                      whileHover={{ 
                        color: 'blue.400',
                        x: 5,
                        opacity: 1
                      }}
                      _hover={{ textDecoration: 'none' }}
                    >
                      {link.name}
                    </MotionLink>
                  ))}
                </Stack>
              </MotionBox>

              {/* Support Links */}
              <MotionBox
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <MotionText
                  fontWeight="bold"
                  color="blue.400"
                  mb={4}
                  fontSize="lg"
                >
                  Support
                </MotionText>
                <Stack spacing={3}>
                  {supportLinks.map((link, index) => (
                    <MotionLink
                      key={link.name}
                      href={link.href}
                      color="white"
                      opacity={0.8}
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      viewport={{ once: true }}
                      whileHover={{ 
                        color: 'blue.400',
                        x: 5,
                        opacity: 1
                      }}
                      _hover={{ textDecoration: 'none' }}
                    >
                      {link.name}
                    </MotionLink>
                  ))}
                </Stack>
              </MotionBox>

              {/* Company Links */}
              <MotionBox
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <MotionText
                  fontWeight="bold"
                  color="blue.400"
                  mb={4}
                  fontSize="lg"
                >
                  Company
                </MotionText>
                <Stack spacing={3}>
                  {companyLinks.map((link, index) => (
                    <MotionLink
                      key={link.name}
                      href={link.href}
                      color="white"
                      opacity={0.8}
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      viewport={{ once: true }}
                      whileHover={{ 
                        color: 'blue.400',
                        x: 5,
                        opacity: 1
                      }}
                      _hover={{ textDecoration: 'none' }}
                    >
                      {link.name}
                    </MotionLink>
                  ))}
                </Stack>
              </MotionBox>
            </Stack>
          </Stack>

          {/* Divider */}
          <MotionDivider
            borderColor="rgba(0, 224, 255, 0.2)"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          />

          {/* Bottom Footer */}
          <MotionFlex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'center', md: 'center' }}
            spacing={4}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <MotionText
              color="white"
              opacity={0.7}
              fontSize="sm"
              textAlign={{ base: 'center', md: 'left' }}
            >
              © 2024 VerbaFlow. All rights reserved.
            </MotionText>
            
            <MotionFlex
              align="center"
              color="white"
              opacity={0.7}
              fontSize="sm"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Text mr={2}>Made with</Text>
              <IconWrapper icon={FaHeart} color="#FF00C8" size={16} />
              <Text ml={2}>for global communication</Text>
            </MotionFlex>
          </MotionFlex>
        </Stack>
      </Container>
    </MotionBox>
  );
};

export default Footer; 