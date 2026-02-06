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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('colorScheme') as ColorScheme | null;
    if (saved && ['purple', 'blue', 'emerald', 'rose', 'indigo'].includes(saved)) {
      setColorScheme(saved);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('colorScheme', colorScheme);
      document.documentElement.setAttribute('data-theme', colorScheme);
    }
  }, [colorScheme, mounted]);

  const getThemeColor = () => colorMap[colorScheme];

  if (!mounted) return <>{children}</>;

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
