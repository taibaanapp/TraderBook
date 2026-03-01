import React from 'react';
import { cn } from '../utils/cn';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className, size = 32 }) => {
  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* EMA 135 Line (Pink/Rose) */}
        <path
          d="M20 80C35 65 65 35 80 20"
          stroke="#f43f5e"
          strokeWidth="8"
          strokeLinecap="round"
          className="drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]"
        />
        
        {/* EMA 50 Line (Blue/Navy) */}
        <path
          d="M20 20C35 35 65 65 80 80"
          stroke="#1e1b4b"
          strokeWidth="8"
          strokeLinecap="round"
          className="drop-shadow-[0_0_8px_rgba(30,27,75,0.4)]"
        />

        {/* The Eye at the intersection (50, 50) */}
        <g transform="translate(50, 50)">
          {/* Eye Shape */}
          <path
            d="M-15 0C-15 -8 0 -12 15 0C15 8 0 12 -15 0Z"
            fill="white"
            stroke="#1e1b4b"
            strokeWidth="2"
          />
          {/* Pupil */}
          <circle r="5" fill="#1e1b4b" />
          {/* Glint */}
          <circle cx="1.5" cy="-1.5" r="1.5" fill="white" />
        </g>
      </svg>
    </div>
  );
};
