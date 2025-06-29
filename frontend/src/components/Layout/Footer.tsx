import React from 'react';
import { Box, Container, Stack, Text, Link, useColorModeValue } from '@chakra-ui/react';

const Footer: React.FC = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box
      bg={bgColor}
      borderTop="1px solid"
      borderColor={borderColor}
      mt="auto"
    >
      <Container maxW="container.xl" py={8}>
        <Stack
          direction={{ base: 'column', md: 'row' }}
          spacing={8}
          justify="space-between"
          align={{ base: 'center', md: 'flex-start' }}
        >
          {/* Company Info */}
          <Stack spacing={4} align={{ base: 'center', md: 'flex-start' }}>
            <Text fontSize="xl" fontWeight="bold" color="brand.600">
              VerbaFlow
            </Text>
            <Text color={textColor} textAlign={{ base: 'center', md: 'left' }}>
              Real-time speech translation and video conferencing platform
            </Text>
            <Text fontSize="sm" color={textColor}>
              © 2024 VerbaFlow. All rights reserved.
            </Text>
          </Stack>

          {/* Quick Links */}
          <Stack spacing={4} align={{ base: 'center', md: 'flex-start' }}>
            <Text fontWeight="semibold" color="gray.700">
              Product
            </Text>
            <Stack spacing={2}>
              <Link href="/lingualive" color={textColor} _hover={{ color: 'brand.600' }}>
                LinguaLive
              </Link>
              <Link href="/meet" color={textColor} _hover={{ color: 'brand.600' }}>
                LinguaLive Meet
              </Link>
              <Link href="/features" color={textColor} _hover={{ color: 'brand.600' }}>
                Features
              </Link>
            </Stack>
          </Stack>

          {/* Support */}
          <Stack spacing={4} align={{ base: 'center', md: 'flex-start' }}>
            <Text fontWeight="semibold" color="gray.700">
              Support
            </Text>
            <Stack spacing={2}>
              <Link href="/help" color={textColor} _hover={{ color: 'brand.600' }}>
                Help Center
              </Link>
              <Link href="/contact" color={textColor} _hover={{ color: 'brand.600' }}>
                Contact Us
              </Link>
              <Link href="/status" color={textColor} _hover={{ color: 'brand.600' }}>
                System Status
              </Link>
            </Stack>
          </Stack>

          {/* Company */}
          <Stack spacing={4} align={{ base: 'center', md: 'flex-start' }}>
            <Text fontWeight="semibold" color="gray.700">
              Company
            </Text>
            <Stack spacing={2}>
              <Link href="/about" color={textColor} _hover={{ color: 'brand.600' }}>
                About
              </Link>
              <Link href="/privacy" color={textColor} _hover={{ color: 'brand.600' }}>
                Privacy Policy
              </Link>
              <Link href="/terms" color={textColor} _hover={{ color: 'brand.600' }}>
                Terms of Service
              </Link>
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer; 