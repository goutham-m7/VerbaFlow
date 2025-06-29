import React from 'react';
import { Box, HStack, useColorModeValue } from '@chakra-ui/react';

interface AudioVisualizerProps {
  level: number;
  isActive: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ level, isActive }) => {
  const barColor = useColorModeValue('brand.500', 'brand.300');
  const inactiveColor = useColorModeValue('gray.300', 'gray.600');

  // Create bars for the visualizer
  const bars = Array.from({ length: 20 }, (_, index) => {
    const barHeight = isActive ? Math.max(2, level * 50 * Math.random()) : 2;
    const delay = index * 0.05;
    
    return (
      <Box
        key={index}
        width="3px"
        height={`${barHeight}px`}
        bg={isActive ? barColor : inactiveColor}
        borderRadius="full"
        transition={`height 0.1s ease-in-out ${delay}s`}
        opacity={isActive ? 0.8 : 0.3}
      />
    );
  });

  return (
    <Box
      p={4}
      borderRadius="lg"
      bg={useColorModeValue('gray.50', 'gray.700')}
      border="1px solid"
      borderColor={useColorModeValue('gray.200', 'gray.600')}
    >
      <HStack spacing={1} justify="center" align="end" height="60px">
        {bars}
      </HStack>
    </Box>
  );
};

export default AudioVisualizer; 