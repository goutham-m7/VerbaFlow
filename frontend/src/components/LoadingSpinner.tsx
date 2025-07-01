import React from 'react';
import { Box, Text, Progress } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaRocket } from 'react-icons/fa';
import IconWrapper from './IconWrapper';

const MotionBox = motion(Box);
const MotionText = motion(Text);
const MotionProgress = motion(Progress);

interface LoadingSpinnerProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  showProgress = false,
  progress = 0,
  size = 'md'
}) => {
  const sizeMap = {
    sm: { spinner: 60, text: 'sm', icon: 3 },
    md: { spinner: 80, text: 'md', icon: 4 },
    lg: { spinner: 120, text: 'lg', icon: 5 }
  };

  const currentSize = sizeMap[size];

  return (
    <MotionBox
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Main Spinner Container */}
      <MotionBox
        position="relative"
        width={`${currentSize.spinner}px`}
        height={`${currentSize.spinner}px`}
        mb={4}
      >
        {/* Outer Ring */}
        <MotionBox
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          border="3px solid"
          borderColor="rgba(0, 224, 255, 0.2)"
          borderRadius="full"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Inner Ring */}
        <MotionBox
          position="absolute"
          top="50%"
          left="50%"
          width="60%"
          height="60%"
          border="2px solid"
          borderColor="rgba(255, 0, 200, 0.6)"
          borderRadius="full"
          transform="translate(-50%, -50%)"
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Center Icon */}
        <MotionBox
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <IconWrapper icon={FaRocket} color="white" size={currentSize.icon * 4} />
        </MotionBox>

        {/* Orbiting Dots */}
        {[...Array(6)].map((_, index) => (
          <MotionBox
            key={index}
            position="absolute"
            top="50%"
            left="50%"
            width="4px"
            height="4px"
            bg="brand.400"
            borderRadius="full"
            boxShadow="0 0 10px rgba(0, 224, 255, 0.8)"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
              delay: index * 0.5
            }}
            style={{
              transformOrigin: `${currentSize.spinner / 2 - 2}px 2px`,
              transform: `translate(-50%, -50%) rotate(${index * 60}deg) translateX(${currentSize.spinner / 2 - 2}px)`
            }}
          />
        ))}
      </MotionBox>

      {/* Loading Text */}
      <MotionText
        color="white"
        fontSize={currentSize.text}
        fontWeight="medium"
        textAlign="center"
        mb={showProgress ? 4 : 0}
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {message}
      </MotionText>

      {/* Progress Bar */}
      {showProgress && (
        <MotionBox
          width="200px"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <MotionProgress
            value={progress}
            size="sm"
            colorScheme="brand"
            borderRadius="full"
            bg="rgba(255, 255, 255, 0.1)"
            sx={{
              '& > div': {
                background: 'linear-gradient(90deg, #00E0FF 0%, #FF00C8 100%)',
                borderRadius: 'full',
                boxShadow: '0 0 10px rgba(0, 224, 255, 0.5)',
              }
            }}
            animate={{
              boxShadow: [
                '0 0 10px rgba(0, 224, 255, 0.5)',
                '0 0 20px rgba(0, 224, 255, 0.8)',
                '0 0 10px rgba(0, 224, 255, 0.5)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <MotionText
            color="white"
            fontSize="xs"
            textAlign="center"
            mt={2}
            opacity={0.7}
          >
            {Math.round(progress)}%
          </MotionText>
        </MotionBox>
      )}
    </MotionBox>
  );
};

export default LoadingSpinner; 