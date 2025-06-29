import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  Avatar,
  useColorModeValue,
  useToast,
  Divider,
  Badge,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

const MotionBox = motion(Box);

const ProfilePage: React.FC = () => {
  const { user, updateProfile, isLoading } = useAuthStore();
  const toast = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    preferences: {
      default_source_language: user?.preferences.default_source_language || 'en',
      default_target_language: user?.preferences.default_target_language || 'es',
      theme: user?.preferences.theme || 'light',
      notifications: user?.preferences.notifications || true,
    },
  });

  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBgColor = useColorModeValue('gray.50', 'gray.700');

  const handleSave = async () => {
    try {
      await updateProfile(profileData);
      setIsEditing(false);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCancel = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      preferences: {
        default_source_language: user?.preferences.default_source_language || 'en',
        default_target_language: user?.preferences.default_target_language || 'es',
        theme: user?.preferences.theme || 'light',
        notifications: user?.preferences.notifications || true,
      },
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <Container maxW="container.md" py={8}>
        <Text>Loading profile...</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <MotionBox
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          textAlign="center"
        >
          <Text fontSize="3xl" fontWeight="bold" color="brand.600" mb={2}>
            Profile Settings
          </Text>
          <Text fontSize="lg" color={textColor}>
            Manage your account and preferences
          </Text>
        </MotionBox>

        {/* Profile Information */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Box
            bg={bgColor}
            p={6}
            borderRadius="xl"
            border="1px solid"
            borderColor={borderColor}
            boxShadow="soft"
          >
            <VStack spacing={6}>
              {/* Avatar and Basic Info */}
              <HStack spacing={6} w="full">
                <Avatar
                  size="xl"
                  name={user.name}
                  src={user.avatar}
                />
                <VStack align="start" flex={1}>
                  <Text fontSize="xl" fontWeight="semibold">
                    {user.name}
                  </Text>
                  <Text color={textColor}>{user.email}</Text>
                  <HStack spacing={2}>
                    <Badge colorScheme={user.is_verified ? 'green' : 'yellow'}>
                      {user.is_verified ? 'Verified' : 'Unverified'}
                    </Badge>
                    <Badge colorScheme={user.is_active ? 'green' : 'red'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </HStack>
                </VStack>
              </HStack>

              <Divider />

              {/* Editable Fields */}
              <VStack spacing={4} w="full">
                <FormControl>
                  <FormLabel>Full Name</FormLabel>
                  <Input
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    isReadOnly={!isEditing}
                    size="lg"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    isReadOnly={!isEditing}
                    size="lg"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Default Source Language</FormLabel>
                  <Input
                    value={profileData.preferences.default_source_language}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      preferences: {
                        ...profileData.preferences,
                        default_source_language: e.target.value,
                      },
                    })}
                    isReadOnly={!isEditing}
                    size="lg"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Default Target Language</FormLabel>
                  <Input
                    value={profileData.preferences.default_target_language}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      preferences: {
                        ...profileData.preferences,
                        default_target_language: e.target.value,
                      },
                    })}
                    isReadOnly={!isEditing}
                    size="lg"
                  />
                </FormControl>
              </VStack>

              {/* Action Buttons */}
              <HStack spacing={4} w="full">
                {isEditing ? (
                  <>
                    <Button
                      colorScheme="brand"
                      onClick={handleSave}
                      isLoading={isLoading}
                      loadingText="Saving"
                      flex={1}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      flex={1}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    colorScheme="brand"
                    onClick={() => setIsEditing(true)}
                    w="full"
                  >
                    Edit Profile
                  </Button>
                )}
              </HStack>
            </VStack>
          </Box>
        </MotionBox>

        {/* Account Information */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Box
            bg={cardBgColor}
            p={6}
            borderRadius="xl"
          >
            <VStack spacing={4} align="start">
              <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                Account Information
              </Text>
              <VStack spacing={2} align="start" w="full">
                <Text color={textColor}>
                  • Member since: {new Date(user.created_at).toLocaleDateString()}
                </Text>
                <Text color={textColor}>
                  • Last login: {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                </Text>
                <Text color={textColor}>
                  • Account status: {user.is_active ? 'Active' : 'Inactive'}
                </Text>
                <Text color={textColor}>
                  • Email verification: {user.is_verified ? 'Verified' : 'Pending'}
                </Text>
              </VStack>
            </VStack>
          </Box>
        </MotionBox>
      </VStack>
    </Container>
  );
};

export default ProfilePage; 