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
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import { useAuthStore } from '../../store/authStore';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Box
      bg={bgColor}
      borderBottom="1px solid"
      borderColor={borderColor}
      px={4}
      py={3}
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex maxW="container.xl" mx="auto" align="center" justify="space-between">
        {/* Logo */}
        <Link to="/">
          <Flex align="center">
            <Text fontSize="xl" fontWeight="bold" color="brand.600">
              VerbaFlow
            </Text>
          </Flex>
        </Link>

        {/* Navigation */}
        <HStack spacing={8} display={{ base: 'none', md: 'flex' }}>
          <Link to="/">
            <Text
              color={isActive('/') ? 'brand.600' : textColor}
              fontWeight={isActive('/') ? 'semibold' : 'normal'}
              _hover={{ color: 'brand.600' }}
            >
              Home
            </Text>
          </Link>
          <Link to="/lingualive">
            <Text
              color={isActive('/lingualive') ? 'brand.600' : textColor}
              fontWeight={isActive('/lingualive') ? 'semibold' : 'normal'}
              _hover={{ color: 'brand.600' }}
            >
              LinguaLive
            </Text>
          </Link>
          <Link to="/meet">
            <Text
              color={isActive('/meet') ? 'brand.600' : textColor}
              fontWeight={isActive('/meet') ? 'semibold' : 'normal'}
              _hover={{ color: 'brand.600' }}
            >
              LinguaLive Meet
            </Text>
          </Link>
        </HStack>

        {/* User Menu */}
        <HStack spacing={4}>
          {isAuthenticated ? (
            <>
              <Menu isOpen={isOpen} onClose={onClose}>
                <MenuButton
                  as={Button}
                  variant="ghost"
                  size="sm"
                  onMouseEnter={onOpen}
                  onMouseLeave={onClose}
                >
                  <HStack spacing={2}>
                    <Avatar
                      size="sm"
                      name={user?.name}
                      src={user?.avatar}
                    />
                    <Text fontSize="sm" fontWeight="medium">
                      {user?.name}
                    </Text>
                  </HStack>
                </MenuButton>
                <MenuList onMouseEnter={onOpen} onMouseLeave={onClose}>
                  <Link to="/profile">
                    <MenuItem>Profile</MenuItem>
                  </Link>
                  <Link to="/transcripts">
                    <MenuItem>Transcript History</MenuItem>
                  </Link>
                  <MenuDivider />
                  <MenuItem onClick={handleLogout} color="red.500">
                    Logout
                  </MenuItem>
                </MenuList>
              </Menu>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/login">
                <Button colorScheme="brand" size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header; 