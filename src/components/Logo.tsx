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
  // Size presets
  const sizeMap = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14' };
  const imgClass = className || sizeMap[size];

  const imgEl = (
    <img
      src={kartalLogo}
      alt="Kartal Group"
      className={`object-contain ${imgClass}`}
      style={{ filter: variant === 'light' ? 'brightness(0) invert(1)' : 'none' }}
    />
  );

  if (showText && textSide === 'right') {
    return (
      <div className="flex items-center gap-3">
        {imgEl}
        <div className="flex flex-col leading-tight">
          <span className="font-black text-xl tracking-wider" style={{ color: variant === 'light' ? '#fff' : '#1a2b4b', fontFamily: 'serif' }}>
            KARTAL MART
          </span>
          <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: variant === 'light' ? '#e2c97e' : '#A48655' }}>
            Group of Companies
          </span>
        </div>
      </div>
    );
  }

  if (showText && textSide === 'bottom') {
    return (
      <div className="flex flex-col items-center gap-1">
        {imgEl}
        <span className="font-black text-lg tracking-wider" style={{ color: variant === 'light' ? '#fff' : '#1a2b4b', fontFamily: 'serif' }}>
          KARTAL MART
        </span>
        <span className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: '#A48655' }}>
          Group of Companies
        </span>
      </div>
    );
  }

  return imgEl;
};
