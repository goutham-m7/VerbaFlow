import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Button,
  HStack,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  IconButton,
  useDisclosure,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSun, 
  FaMoon, 
  FaUser, 
  FaSignOutAlt, 
  FaHistory
} from 'react-icons/fa';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import IconWrapper from '../IconWrapper';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionText = motion(Text);
const MotionButton = motion(Button);
const MotionIconButton = motion(IconButton);

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/lingualive', label: 'LinguaLive' },
    { path: '/meet', label: 'LinguaLive Meet' },
    { path: '/deepgram-stt', label: 'Deepgram STT' },
  ];

  return (
    <MotionBox
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      position="sticky"
      top={0}
      zIndex={1000}
      bg="rgba(15, 15, 28, 0.8)"
      backdropFilter="blur(20px)"
      borderBottom="1px solid rgba(0, 224, 255, 0.2)"
      boxShadow="0 8px 32px rgba(0, 0, 0, 0.3)"
    >
      <Flex maxW="container.xl" mx="auto" align="center" justify="space-between" px={6} py={4}>
        {/* Logo */}
        <Link to="/">
          <MotionFlex
            align="center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <MotionBox
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              mr={3}
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
              >
                <Text fontSize="lg" fontWeight="bold" color="white">
                  V
                </Text>
              </Box>
            </MotionBox>
            <MotionText
              fontSize="2xl"
              fontWeight="bold"
              bg="linear-gradient(135deg, #00E0FF 0%, #FF00C8 100%)"
              bgClip="text"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              VerbaFlow
            </MotionText>
          </MotionFlex>
        </Link>

        {/* Navigation */}
        <HStack spacing={8} display={{ base: 'none', md: 'flex' }}>
          <AnimatePresence>
            {navItems.map((item, index) => (
              <MotionBox
                key={item.path}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={item.path}>
                  <MotionText
                    color={isActive(item.path) ? 'blue.400' : 'white'}
                    fontWeight={isActive(item.path) ? 'bold' : 'medium'}
                    fontSize="md"
                    position="relative"
                    whileHover={{ 
                      color: '#4299e1',
                      y: -2,
                      transition: { duration: 0.2 }
                    }}
                    _before={{
                      content: '""',
                      position: 'absolute',
                      bottom: '-4px',
                      left: '0',
                      width: isActive(item.path) ? '100%' : '0%',
                      height: '2px',
                      bg: 'linear-gradient(90deg, #00E0FF 0%, #FF00C8 100%)',
                      transition: 'width 0.3s ease',
                    }}
                    _hover={{
                      _before: {
                        width: '100%',
                      }
                    }}
                  >
                    {item.label}
                  </MotionText>
                </Link>
              </MotionBox>
            ))}
          </AnimatePresence>
        </HStack>

        {/* User Menu & Theme Toggle */}
        <HStack spacing={4}>
          {/* Theme Toggle */}
          <MotionIconButton
            aria-label="Toggle theme"
            icon={isDark ? <IconWrapper icon={FaSun} size={16} /> : <IconWrapper icon={FaMoon} size={16} />}
            variant="ghost"
            size="md"
            color="white"
            whileHover={{ 
              scale: 1.1,
              rotate: 180,
              boxShadow: '0 0 20px rgba(0, 224, 255, 0.5)'
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.3 }}
            onClick={toggleTheme}
            _hover={{
              bg: 'rgba(0, 224, 255, 0.1)',
              color: 'blue.400',
            }}
          />

          {isAuthenticated ? (
            <>
              <Menu isOpen={isOpen} onClose={onClose}>
                <MenuButton
                  as={MotionButton}
                  variant="ghost"
                  size="sm"
                  onMouseEnter={onOpen}
                  onMouseLeave={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <HStack spacing={3}>
                    <MotionBox
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Avatar
                        size="sm"
                        name={user?.name}
                        src={user?.avatar}
                        border="2px solid"
                        borderColor="blue.400"
                        boxShadow="0 0 15px rgba(0, 224, 255, 0.3)"
                      />
                    </MotionBox>
                    <Text fontSize="sm" fontWeight="medium" color="white">
                      {user?.name}
                    </Text>
                  </HStack>
                </MenuButton>
                <MenuList
                  onMouseEnter={onOpen}
                  onMouseLeave={onClose}
                  bg="rgba(15, 15, 28, 0.95)"
                  backdropFilter="blur(20px)"
                  border="1px solid rgba(0, 224, 255, 0.2)"
                  boxShadow="0 8px 32px rgba(0, 0, 0, 0.5)"
                >
                  <Link to="/profile">
                    <MenuItem
                      icon={<IconWrapper icon={FaUser} size={16} />}
                      _hover={{ bg: 'rgba(0, 224, 255, 0.1)' }}
                      color="white"
                    >
                      Profile
                    </MenuItem>
                  </Link>
                  <Link to="/transcripts">
                    <MenuItem
                      icon={<IconWrapper icon={FaHistory} size={16} />}
                      _hover={{ bg: 'rgba(0, 224, 255, 0.1)' }}
                      color="white"
                    >
                      Transcript History
                    </MenuItem>
                  </Link>
                  <MenuDivider borderColor="rgba(255, 255, 255, 0.1)" />
                  <MenuItem
                    icon={<IconWrapper icon={FaSignOutAlt} size={16} />}
                    onClick={handleLogout}
                    color="red.400"
                    _hover={{ bg: 'rgba(239, 68, 68, 0.1)' }}
                  >
                    Logout
                  </MenuItem>
                </MenuList>
              </Menu>
            </>
          ) : (
            <>
              <Link to="/login">
                <MotionButton
                  variant="ghost"
                  size="md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Login
                </MotionButton>
              </Link>
              <Link to="/login">
                <MotionButton
                  variant="solid"
                  size="md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign Up
                </MotionButton>
              </Link>
            </>
          )}
        </HStack>
      </Flex>
    </MotionBox>
  );
};

export default Header; 