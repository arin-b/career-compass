"use client";

import { useTheme, type ColorScheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import { useState } from "react";

const colorSchemes: { name: ColorScheme; label: string; hex: string }[] = [
  { name: 'purple', label: 'Purple', hex: '#9333ea' },
  { name: 'blue', label: 'Blue', hex: '#2563eb' },
  { name: 'emerald', label: 'Emerald', hex: '#059669' },
  { name: 'rose', label: 'Rose', hex: '#e11d48' },
  { name: 'indigo', label: 'Indigo', hex: '#4f46e5' },
];

export const ThemeSwitcher = () => {
  const { colorScheme, setColorScheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <Palette className="w-4 h-4" />
        <span className="hidden sm:inline">Theme</span>
      </Button>

      {isOpen && (
        <div className="absolute top-12 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50 min-w-max">
          <div className="space-y-2">
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.name}
                onClick={() => {
                  setColorScheme(scheme.name);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-md transition-all ${
                  colorScheme === scheme.name
                    ? 'bg-gray-100 dark:bg-gray-700'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: scheme.hex }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{scheme.label}</span>
                {colorScheme === scheme.name && (
                  <span className="ml-auto text-xs font-bold text-gray-500">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
