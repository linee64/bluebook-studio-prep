import React from 'react';

export function BrandMascot({ className = 'w-10 h-10' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Bluebook rounded book base */}
      <rect x="8" y="10" width="48" height="46" rx="12" fill="#284B9E" />
      <rect x="8" y="8" width="48" height="44" rx="12" fill="#3B6EF6" stroke="#1B2A4A" strokeWidth="2.5" />
      {/* Spine */}
      <path d="M18 9V51" stroke="#1B2A4A" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="10" y="10" width="7" height="40" rx="4" fill="#2954CC" />
      {/* Cute scholarly owl eyes on cover */}
      <circle cx="31" cy="27" r="7.5" fill="#FFFFFF" stroke="#1B2A4A" strokeWidth="2.2" />
      <circle cx="44" cy="27" r="7.5" fill="#FFFFFF" stroke="#1B2A4A" strokeWidth="2.2" />
      <circle cx="32" cy="27.5" r="3.2" fill="#1B2A4A" />
      <circle cx="45" cy="27.5" r="3.2" fill="#1B2A4A" />
      <circle cx="33.2" cy="26.2" r="1.1" fill="#FFFFFF" />
      <circle cx="46.2" cy="26.2" r="1.1" fill="#FFFFFF" />
      {/* Glasses bridge */}
      <path d="M36.5 27H38.5" stroke="#1B2A4A" strokeWidth="2.2" strokeLinecap="round" />
      {/* Little beak */}
      <path d="M35.5 32.5L37.5 36L39.5 32.5H35.5Z" fill="#FFBE3B" stroke="#1B2A4A" strokeWidth="1.6" strokeLinejoin="round" />
      {/* Book ribbon / bookmark */}
      <path d="M26 42H48" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M40 50V57L43.5 54.5L47 57V50" fill="#FFBE3B" stroke="#1B2A4A" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function TrophyOwl({ className = 'w-20 h-20' }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="40" cy="40" r="36" fill="#EEF4FF" stroke="#C7D7FA" strokeWidth="2.5" />
      {/* Trophy cup */}
      <path
        d="M25 22H55V35C55 43.2843 48.2843 50 40 50C31.7157 50 25 43.2843 25 35V22Z"
        fill="#FFBE3B"
        stroke="#1B2A4A"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Handles */}
      <path
        d="M25 26H19C17.3431 26 16 27.3431 16 29V32C16 35.866 19.134 39 23 39H25.5"
        stroke="#1B2A4A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M55 26H61C62.6569 26 64 27.3431 64 29V32C64 35.866 60.866 39 57 39H54.5"
        stroke="#1B2A4A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Stem & base */}
      <path d="M40 50V58" stroke="#1B2A4A" strokeWidth="2.8" strokeLinecap="round" />
      <rect x="28" y="58" width="24" height="6" rx="3" fill="#3B6EF6" stroke="#1B2A4A" strokeWidth="2.2" />
      {/* Star inside trophy */}
      <path
        d="M40 28L42.3 32.7L47.5 33.4L43.7 37.1L44.6 42.3L40 39.8L35.4 42.3L36.3 37.1L32.5 33.4L37.7 32.7L40 28Z"
        fill="#FFFBEB"
        stroke="#1B2A4A"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

