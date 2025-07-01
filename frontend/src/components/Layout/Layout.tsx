import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import AnimatedBackground from '../AnimatedBackground';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <AnimatedBackground>
      <MotionFlex
        direction="column"
        minH="100vh"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Header />
        <MotionBox
          as="main"
          flex="1"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {children}
        </MotionBox>
        <Footer />
      </MotionFlex>
    </AnimatedBackground>
  );
};

export default Layout; 