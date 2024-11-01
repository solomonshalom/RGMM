import React, { createContext, useState, useEffect } from 'react';

type Theme = 'winxp' | 'win11' | 'macos' | 'win98' | 'accessible' ;

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'winxp',
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as Theme) || 'winxp';
  });

  useEffect(() => {
    const link = document.createElement('link');
    link.href = `/themes/${theme}.css`;
    link.rel = 'stylesheet';
    link.id = 'theme-stylesheet';

    const existingLink = document.getElementById('theme-stylesheet');
    if (existingLink) {
      document.head.removeChild(existingLink);
    }

    document.head.appendChild(link);
    document.body.className = `theme-${theme}`;

    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};