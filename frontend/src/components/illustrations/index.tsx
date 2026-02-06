"use client";

import { useTheme } from "@/context/ThemeContext";

export const LoginIllustration = () => {
  const { getThemeColor } = useTheme();
  const themeColor = getThemeColor();

  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto mb-6"
    >
      {/* Decorative background circle */}
      <circle cx="100" cy="100" r="95" fill="none" stroke={themeColor} strokeWidth="2" opacity="0.2" />
      
      {/* Lock icon artwork */}
      <rect x="70" y="90" width="60" height="60" rx="8" fill="none" stroke={themeColor} strokeWidth="2.5" />
      <path d="M 85 90 Q 85 70 100 70 Q 115 70 115 90" fill="none" stroke={themeColor} strokeWidth="2.5" />
      <circle cx="100" cy="115" r="4" fill={themeColor} />
      <line x1="100" y1="120" x2="100" y2="135" stroke={themeColor} strokeWidth="2.5" />
      
      {/* Keyhole design */}
      <circle cx="100" cy="115" r="6" fill={themeColor} opacity="0.3" />
      
      {/* Decorative lines */}
      <line x1="50" y1="40" x2="80" y2="40" stroke={themeColor} strokeWidth="2" opacity="0.5" />
      <line x1="120" y1="160" x2="150" y2="160" stroke={themeColor} strokeWidth="2" opacity="0.5" />
    </svg>
  );
};

export const SignupIllustration = () => {
  const { getThemeColor } = useTheme();
  const themeColor = getThemeColor();

  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto mb-6"
    >
      {/* Decorative background circle */}
      <circle cx="100" cy="100" r="95" fill="none" stroke={themeColor} strokeWidth="2" opacity="0.2" />
      
      {/* User profile icon */}
      <circle cx="100" cy="70" r="22" fill="none" stroke={themeColor} strokeWidth="2.5" />
      <path d="M 75 110 Q 75 95 100 95 Q 125 95 125 110 L 125 130 Q 125 140 100 140 Q 75 140 75 130 Z" fill="none" stroke={themeColor} strokeWidth="2.5" />
      
      {/* Plus sign for registration */}
      <line x1="135" y1="60" x2="155" y2="60" stroke={themeColor} strokeWidth="2.5" opacity="0.7" />
      <line x1="145" y1="50" x2="145" y2="70" stroke={themeColor} strokeWidth="2.5" opacity="0.7" />
      
      {/* Decorative elements */}
      <line x1="40" y1="150" x2="70" y2="150" stroke={themeColor} strokeWidth="2" opacity="0.5" />
      <line x1="130" y1="30" x2="160" y2="30" stroke={themeColor} strokeWidth="2" opacity="0.5" />
    </svg>
  );
};

export const DashboardIllustration = () => {
  const { getThemeColor } = useTheme();
  const themeColor = getThemeColor();

  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto mb-6"
    >
      {/* Decorative background circle */}
      <circle cx="100" cy="100" r="95" fill="none" stroke={themeColor} strokeWidth="2" opacity="0.2" />
      
      {/* Timeline/Roadmap visualization */}
      <circle cx="60" cy="60" r="8" fill={themeColor} />
      <line x1="60" y1="68" x2="60" y2="90" stroke={themeColor} strokeWidth="2.5" />
      
      <circle cx="60" cy="100" r="8" fill={themeColor} opacity="0.6" />
      <line x1="60" y1="108" x2="60" y2="130" stroke={themeColor} strokeWidth="2.5" opacity="0.6" />
      
      <circle cx="60" cy="140" r="8" fill={themeColor} opacity="0.3" />
      
      {/* Connected milestone boxes */}
      <rect x="80" y="50" width="70" height="20" rx="4" fill="none" stroke={themeColor} strokeWidth="2" />
      <line x1="68" y1="60" x2="80" y2="60" stroke={themeColor} strokeWidth="2" />
      
      <rect x="80" y="90" width="70" height="20" rx="4" fill="none" stroke={themeColor} strokeWidth="2" opacity="0.6" />
      <line x1="68" y1="100" x2="80" y2="100" stroke={themeColor} strokeWidth="2" opacity="0.6" />
      
      <rect x="80" y="130" width="70" height="20" rx="4" fill="none" stroke={themeColor} strokeWidth="2" opacity="0.3" />
      <line x1="68" y1="140" x2="80" y2="140" stroke={themeColor} strokeWidth="2" opacity="0.3" />
      
      {/* Progress indicator */}
      <line x1="40" y1="170" x2="160" y2="170" stroke={themeColor} strokeWidth="2" opacity="0.3" />
      <line x1="40" y1="170" x2="100" y2="170" stroke={themeColor} strokeWidth="3" />
    </svg>
  );
};

export const ProfileIllustration = () => {
  const { getThemeColor } = useTheme();
  const themeColor = getThemeColor();

  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto mb-6"
    >
      {/* Decorative background circle */}
      <circle cx="100" cy="100" r="95" fill="none" stroke={themeColor} strokeWidth="2" opacity="0.2" />
      
      {/* Main profile circle */}
      <circle cx="100" cy="80" r="28" fill="none" stroke={themeColor} strokeWidth="2.5" />
      
      {/* Head detail */}
      <circle cx="100" cy="70" r="6" fill={themeColor} opacity="0.5" />
      
      {/* Body/Info section */}
      <rect x="65" y="115" width="70" height="50" rx="6" fill="none" stroke={themeColor} strokeWidth="2.5" />
      
      {/* Info lines representing personal details */}
      <line x1="75" y1="130" x2="125" y2="130" stroke={themeColor} strokeWidth="1.5" opacity="0.7" />
      <line x1="75" y1="145" x2="120" y2="145" stroke={themeColor} strokeWidth="1.5" opacity="0.7" />
      <line x1="75" y1="160" x2="115" y2="160" stroke={themeColor} strokeWidth="1.5" opacity="0.7" />
      
      {/* Settings gear icon */}
      <circle cx="155" cy="155" r="12" fill="none" stroke={themeColor} strokeWidth="2" opacity="0.6" />
      <circle cx="155" cy="155" r="4" fill={themeColor} opacity="0.6" />
    </svg>
  );
};
