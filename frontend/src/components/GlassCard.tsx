import React from 'react';
import { Box, BoxProps } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

interface GlassCardProps extends BoxProps {
  children: React.ReactNode;
  hoverEffect?: boolean;
  gradient?: string;
  glowColor?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  hoverEffect = true,
  gradient = 'linear-gradient(135deg, #00E0FF 0%, #FF00C8 100%)',
  glowColor = 'rgba(0, 224, 255, 0.3)',
  ...props 
}) => {
  return (
    <MotionBox
      bg="rgba(255, 255, 255, 0.05)"
      backdropFilter="blur(20px)"
      border="1px solid rgba(255, 255, 255, 0.1)"
      borderRadius="2xl"
      position="relative"
      overflow="hidden"
      whileHover={hoverEffect ? {
        y: -10,
        boxShadow: `0 20px 40px ${glowColor}`,
        borderColor: "rgba(0, 224, 255, 0.3)",
        transition: { duration: 0.3 }
      } : undefined}
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: gradient,
        transform: 'scaleX(0)',
        transition: 'transform 0.3s ease',
      }}
      _hover={hoverEffect ? {
        _before: {
          transform: 'scaleX(1)',
        }
      } : undefined}
      {...props}
    >
      {children}
    </MotionBox>
  );
};

export default GlassCard; 