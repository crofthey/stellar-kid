import { useState, useEffect, useCallback } from 'react';
import { themes, type Theme } from '@/lib/themes';
const THEME_STORAGE_KEY = 'stellarkid-chart-theme';
export function useChartTheme() {
  const [activeTheme, setActiveTheme] = useState<Theme>(themes[0]);
  const applyTheme = useCallback((theme: Theme) => {
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, []);
  useEffect(() => {
    const savedThemeName = localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme = themes.find(t => t.name === savedThemeName) || themes[0];
    setActiveTheme(initialTheme);
    applyTheme(initialTheme);
  }, [applyTheme]);
  const setTheme = (themeName: string) => {
    const newTheme = themes.find(t => t.name === themeName);
    if (newTheme) {
      setActiveTheme(newTheme);
      applyTheme(newTheme);
      localStorage.setItem(THEME_STORAGE_KEY, newTheme.name);
    }
  };
  return { activeTheme, setTheme, themes };
}