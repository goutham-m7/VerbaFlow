import React from 'react';
import { Button, ButtonProps } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { IconType } from 'react-icons';
import IconWrapper from './IconWrapper';

const MotionButton = motion(Button);

interface FuturisticButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  children: React.ReactNode;
  leftIcon?: IconType;
  rightIcon?: IconType;
  variant?: 'solid' | 'outline' | 'ghost' | 'gradient';
  glowColor?: string;
  gradient?: string;
}

const FuturisticButton: React.FC<FuturisticButtonProps> = ({
  children,
  leftIcon,
  rightIcon,
  variant = 'solid',
  glowColor = 'rgba(0, 224, 255, 0.6)',
  gradient = 'linear-gradient(135deg, #00E0FF 0%, #FF00C8 100%)',
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'solid':
        return {
          bg: gradient,
          color: 'white',
          _hover: {
            bg: 'linear-gradient(135deg, #00b3cc 0%, #cc00a0 100%)',
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 25px ${glowColor}`,
          },
          _active: {
            transform: 'translateY(0)',
          },
        };
      case 'outline':
        return {
          border: '2px solid',
          borderColor: 'brand.500',
          color: 'brand.500',
          bg: 'transparent',
          _hover: {
            bg: 'rgba(0, 224, 255, 0.1)',
            borderColor: 'brand.400',
            color: 'brand.400',
            boxShadow: `0 0 20px ${glowColor}`,
          },
        };
      case 'ghost':
        return {
          color: 'white',
          bg: 'transparent',
          _hover: {
            bg: 'rgba(255, 255, 255, 0.1)',
            color: 'brand.400',
          },
        };
      case 'gradient':
        return {
          bg: gradient,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          _before: {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
            transition: 'left 0.5s',
          },
          _hover: {
            _before: {
              left: '100%',
            },
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 25px ${glowColor}`,
          },
        };
      default:
        return {};
    }
  };

  return (
    <MotionButton
      variant={variant === 'gradient' ? 'solid' : variant}
      fontWeight="semibold"
      borderRadius="lg"
      position="relative"
      overflow="hidden"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      _focus={{
        boxShadow: `0 0 0 3px ${glowColor}`,
      }}
      {...getVariantStyles()}
      {...props}
    >
      {leftIcon && (
        <motion.div
          style={{ display: 'inline-block', marginRight: '8px' }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <IconWrapper icon={leftIcon} size={16} />
        </motion.div>
      )}
      {children}
      {rightIcon && (
        <motion.div
          style={{ display: 'inline-block', marginLeft: '8px' }}
          animate={{
            x: [0, 5, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <IconWrapper icon={rightIcon} size={16} />
        </motion.div>
      )}
    </MotionButton>
  );
};

export default FuturisticButton; 