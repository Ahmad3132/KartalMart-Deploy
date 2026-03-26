import React from 'react';
import kartalLogo from '../assets/kartal-logo.png';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  showText?: boolean;
  textSide?: 'bottom' | 'right';
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  variant = 'dark',
  showText = false,
  textSide = 'right',
  size = 'md',
}) => {
  // New logo already contains "KARTAL" text with eagle + building graphic
  // Size presets — wider aspect ratio to match new logo shape
  const sizeMap = { sm: 'h-8', md: 'h-10', lg: 'h-14' };
  const imgClass = className || sizeMap[size];

  return (
    <img
      src={kartalLogo}
      alt="Kartal Group"
      className={`object-contain ${imgClass}`}
      style={{ filter: variant === 'light' ? 'brightness(0) invert(1)' : 'none' }}
    />
  );
};
