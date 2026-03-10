import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  showText?: boolean;
  textSide?: 'bottom' | 'right';
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "w-16 h-16", 
  variant = 'dark', 
  showText = true,
  textSide = 'bottom'
}) => {
  const iconColor = variant === 'light' ? '#ffffff' : '#b38b4d'; // Accurate gold from image
  const textColor = variant === 'light' ? '#ffffff' : '#1a2b4b'; // Accurate dark blue from image
  const subTextColor = variant === 'light' ? '#e2e8f0' : '#b38b4d';

  const AccurateLogo = () => (
    <svg viewBox="0 0 1248 832" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* New Kartal Logo Path */}
      <path 
        fill={variant === 'light' ? '#ffffff' : '#A48655'} 
        d="M568.267 137.981C579.39 138.663 590.987 139.691 602.079 139.971C621.174 140.223 639.921 137.837 658.371 144.188C665.346 146.589 671.392 153.42 676.95 155.644C702.234 165.76 709.56 172.13 711.587 201.117C703.939 193.77 697.125 187.28 685.742 187.427C668.385 187.65 655.374 205.406 655.75 221.847C655.871 227.113 657.231 231.466 658.744 236.41C646.061 245.843 629.47 264.144 618.22 275.928C589.176 306.353 559.818 334.587 537.623 370.638C528.95 347.486 518.064 336.838 495.386 326.908C491.561 325.233 483.304 321.531 479.405 321.4C476.522 321.14 470.699 319.688 467.628 318.992C454.222 315.956 443.132 313.498 432.005 304.949C416.874 293.999 405.185 287.85 398.188 269.166C409.946 273.325 419.363 276.022 431.82 277.973C449.031 280.669 467.548 281.231 484.597 284.218"
      />
      
      {showText && textSide === 'bottom' && (
        <g transform="translate(0, 450)">
          <text x="624" y="100" textAnchor="middle" fill={textColor} style={{ fontSize: '180px', fontWeight: '900', fontFamily: 'serif', letterSpacing: '-0.05em' }}>KARTAL</text>
          <text x="624" y="220" textAnchor="middle" fill={subTextColor} style={{ fontSize: '60px', fontWeight: '700', letterSpacing: '0.16em' }}>— GROUP OF COMPANIES —</text>
        </g>
      )}
    </svg>
  );

  if (showText && textSide === 'right') {
    return (
      <div className="flex items-center space-x-4">
        <svg viewBox="0 0 1248 832" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            fill={variant === 'light' ? '#ffffff' : '#A48655'} 
            d="M568.267 137.981C579.39 138.663 590.987 139.691 602.079 139.971C621.174 140.223 639.921 137.837 658.371 144.188C665.346 146.589 671.392 153.42 676.95 155.644C702.234 165.76 709.56 172.13 711.587 201.117C703.939 193.77 697.125 187.28 685.742 187.427C668.385 187.65 655.374 205.406 655.75 221.847C655.871 227.113 657.231 231.466 658.744 236.41C646.061 245.843 629.47 264.144 618.22 275.928C589.176 306.353 559.818 334.587 537.623 370.638C528.95 347.486 518.064 336.838 495.386 326.908C491.561 325.233 483.304 321.531 479.405 321.4C476.522 321.14 470.699 319.688 467.628 318.992C454.222 315.956 443.132 313.498 432.005 304.949C416.874 293.999 405.185 287.85 398.188 269.166C409.946 273.325 419.363 276.022 431.82 277.973C449.031 280.669 467.548 281.231 484.597 284.218"
          />
        </svg>
        <div className="flex flex-col">
          <span style={{ color: textColor, fontSize: '2rem', fontWeight: '900', fontFamily: 'serif', lineHeight: '1' }}>KARTAL</span>
          <span style={{ color: subTextColor, fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em', marginTop: '0.25rem' }}>— GROUP OF COMPANIES —</span>
        </div>
      </div>
    );
  }

  return <AccurateLogo />;
};
