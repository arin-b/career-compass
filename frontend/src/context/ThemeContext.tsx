"use client";

import React, { createContext, useState, useEffect } from 'react';

export type ColorScheme = 'purple' | 'blue' | 'emerald' | 'rose' | 'indigo';

interface ThemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  getThemeColor: () => string;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const colorMap: Record<ColorScheme, string> = {
  purple: '#9333ea',
  blue: '#2563eb',
  emerald: '#059669',
  rose: '#e11d48',
  indigo: '#4f46e5',
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('purple');

  // On mount, read saved preference from localStorage (client only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('colorScheme') as ColorScheme | null;
      if (saved && ['purple', 'blue', 'emerald', 'rose', 'indigo'].includes(saved)) {
        setColorScheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
      }
    } catch (e) {
      // ignore (server or no access)
    }
  }, []);

  // Persist selection to localStorage and update document attribute on change (client only)
  useEffect(() => {
    try {
      localStorage.setItem('colorScheme', colorScheme);
      document.documentElement.setAttribute('data-theme', colorScheme);
    } catch (e) {
      // ignore in non-browser environments
    }
  }, [colorScheme]);

  const getThemeColor = () => colorMap[colorScheme];

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme, getThemeColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
