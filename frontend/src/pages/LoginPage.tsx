import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useColorModeValue,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

const MotionBox = motion(Box);

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { login, register, isLoading } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState(0);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const validateForm = (type: 'login' | 'register') => {
    const newErrors: { [key: string]: string } = {};

    if (type === 'login') {
      if (!loginData.email) newErrors.email = 'Email is required';
      if (!loginData.password) newErrors.password = 'Password is required';
    } else {
      if (!registerData.name) newErrors.name = 'Name is required';
      if (!registerData.email) newErrors.email = 'Email is required';
      if (!registerData.password) newErrors.password = 'Password is required';
      if (registerData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (registerData.password !== registerData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm('login')) return;

    try {
      await login(loginData);
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleRegister = async () => {
    if (!validateForm('register')) return;

    try {
      await register({
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
      });
      toast({
        title: 'Registration Successful',
        description: 'Account created successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to create account',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.sm" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <MotionBox
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          textAlign="center"
        >
          <Text fontSize="4xl" fontWeight="bold" color="brand.600" mb={2}>
            Welcome to VerbaFlow
          </Text>
          <Text fontSize="lg" color={textColor}>
            Sign in to your account or create a new one
          </Text>
        </MotionBox>

        {/* Auth Forms */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Box
            bg={bgColor}
            p={8}
            borderRadius="xl"
            border="1px solid"
            borderColor={borderColor}
            boxShadow="soft"
          >
            <Tabs index={activeTab} onChange={setActiveTab} variant="soft-rounded">
              <TabList mb={6}>
                <Tab flex={1}>Sign In</Tab>
                <Tab flex={1}>Sign Up</Tab>
              </TabList>

              <TabPanels>
                {/* Login Tab */}
                <TabPanel>
                  <VStack spacing={6}>
                    <FormControl isInvalid={!!errors.email}>
                      <FormLabel>Email</FormLabel>
                      <Input
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        placeholder="Enter your email"
                        size="lg"
                      />
                      <FormErrorMessage>{errors.email}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.password}>
                      <FormLabel>Password</FormLabel>
                      <Input
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        placeholder="Enter your password"
                        size="lg"
                      />
                      <FormErrorMessage>{errors.password}</FormErrorMessage>
                    </FormControl>

                    <Button
                      colorScheme="brand"
                      size="lg"
                      onClick={handleLogin}
                      isLoading={isLoading}
                      loadingText="Signing In"
                      w="full"
                    >
                      Sign In
                    </Button>
                  </VStack>
                </TabPanel>

                {/* Register Tab */}
                <TabPanel>
                  <VStack spacing={6}>
                    <FormControl isInvalid={!!errors.name}>
                      <FormLabel>Full Name</FormLabel>
                      <Input
                        type="text"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        placeholder="Enter your full name"
                        size="lg"
                      />
                      <FormErrorMessage>{errors.name}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.email}>
                      <FormLabel>Email</FormLabel>
                      <Input
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        placeholder="Enter your email"
                        size="lg"
                      />
                      <FormErrorMessage>{errors.email}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.password}>
                      <FormLabel>Password</FormLabel>
                      <Input
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        placeholder="Enter your password"
                        size="lg"
                      />
                      <FormErrorMessage>{errors.password}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.confirmPassword}>
                      <FormLabel>Confirm Password</FormLabel>
                      <Input
                        type="password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        placeholder="Confirm your password"
                        size="lg"
                      />
                      <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                    </FormControl>

                    <Button
                      colorScheme="brand"
                      size="lg"
                      onClick={handleRegister}
                      isLoading={isLoading}
                      loadingText="Creating Account"
                      w="full"
                    >
                      Create Account
                    </Button>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </MotionBox>

        {/* Footer */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          textAlign="center"
        >
          <Text fontSize="sm" color={textColor}>
            By signing in or creating an account, you agree to our{' '}
            <Text as="span" color="brand.500" cursor="pointer">
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text as="span" color="brand.500" cursor="pointer">
              Privacy Policy
            </Text>
          </Text>
        </MotionBox>
      </VStack>
    </Container>
  );
};

export default LoginPage; 