import React from 'react';
import { IconType } from 'react-icons';

interface IconWrapperProps {
  icon: IconType;
  size?: number;
  color?: string;
  className?: string;
}

const IconWrapper: React.FC<IconWrapperProps> = ({ icon: Icon, size = 16, color, className }) => {
  // Type assertion to handle react-icons type issue
  const IconComponent = Icon as React.ComponentType<{ size?: number; color?: string; className?: string }>;
  return <IconComponent size={size} color={color} className={className} />;
};

export default IconWrapper; 