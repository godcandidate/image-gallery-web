import React from 'react';
import { Moon, Sun, Search } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSearch: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ darkMode, onToggleDarkMode, onSearch }) => {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Image Gallery
          </h1>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search images..."
                className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
            
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};