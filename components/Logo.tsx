import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'white';
}

const Logo: React.FC<LogoProps> = ({ className = "h-10 w-10", variant = 'default' }) => {
  const [imgError, setImgError] = useState(false);

  // If the uploaded image fails to load, we render this fallback SVG
  const FallbackLogo = () => (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full ${className}`}
    >
      <circle cx="50" cy="50" r="50" fill={variant === 'white' ? '#ffffff' : '#22D3EE'} />
      <path
        d="M75 50C75 63.8071 63.8071 75 50 75C45.5 75 35 78 30 82V55C30 41.1929 41.1929 30 55 30C68.8071 30 75 41.1929 75 50Z"
        fill={variant === 'white' ? '#22D3EE' : '#0F172A'}
      />
      <path
        d="M30 55C30 45 25 40 20 45C15 50 25 65 30 65"
        stroke={variant === 'white' ? '#22D3EE' : '#0F172A'}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="55" cy="45" r="3" fill={variant === 'white' ? '#22D3EE' : '#ffffff'} />
    </svg>
  );

  if (imgError) {
    return <FallbackLogo />;
  }

  return (
    <img
      src="/logo.png"
      alt="Aaria's Blue Elephant"
      className={`${className} object-contain`}
      onError={() => setImgError(true)}
    />
  );
};

export default Logo;