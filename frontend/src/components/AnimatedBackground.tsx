import React from 'react';
import { Box } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

interface AnimatedBackgroundProps {
  children: React.ReactNode;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ children }) => {
  return (
    <Box position="relative" overflow="hidden">
      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <MotionBox
          key={i}
          position="absolute"
          top={`${Math.random() * 100}%`}
          left={`${Math.random() * 100}%`}
          w="4px"
          h="4px"
          bg="brand.400"
          borderRadius="full"
          opacity={0.6}
          initial={{ 
            opacity: 0, 
            scale: 0,
            y: 0 
          }}
          animate={{ 
            opacity: [0, 1, 0], 
            scale: [0, 1, 0],
            y: [-20, 20, -20]
          }}
          transition={{ 
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut"
          }}
          boxShadow="0 0 10px rgba(0, 224, 255, 0.5)"
        />
      ))}

      {/* Geometric Shapes */}
      {[...Array(8)].map((_, i) => (
        <MotionBox
          key={`shape-${i}`}
          position="absolute"
          top={`${Math.random() * 100}%`}
          left={`${Math.random() * 100}%`}
          w={`${20 + Math.random() * 40}px`}
          h={`${20 + Math.random() * 40}px`}
          border="1px solid"
          borderColor="rgba(0, 224, 255, 0.2)"
          borderRadius={i % 2 === 0 ? "full" : "none"}
          opacity={0.1}
          initial={{ 
            rotate: 0,
            scale: 0.8
          }}
          animate={{ 
            rotate: 360,
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{ 
            duration: 20 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear"
          }}
        />
      ))}

      {/* Gradient Orbs */}
      {[...Array(3)].map((_, i) => (
        <MotionBox
          key={`orb-${i}`}
          position="absolute"
          top={`${20 + i * 30}%`}
          left={`${10 + i * 40}%`}
          w={`${100 + i * 50}px`}
          h={`${100 + i * 50}px`}
          borderRadius="full"
          bg={`radial-gradient(circle, rgba(${0 + i * 50}, ${224 - i * 30}, ${255 - i * 50}, 0.1) 0%, transparent 70%)`}
          initial={{ 
            scale: 0,
            opacity: 0
          }}
          animate={{ 
            scale: [0, 1, 0.8],
            opacity: [0, 0.3, 0.1]
          }}
          transition={{ 
            duration: 8 + i * 2,
            repeat: Infinity,
            delay: i * 2,
            ease: "easeInOut"
          }}
          filter="blur(20px)"
        />
      ))}

      {/* Content */}
      <Box position="relative" zIndex={1}>
        {children}
      </Box>
    </Box>
  );
};

export default AnimatedBackground; 