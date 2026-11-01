import type { ColorThemeId } from './types';

export interface ThemeTone {
  desk: string;
  accent: string;
  accentForeground: string;
}

export interface ColorTheme {
  name: string;
  swatch: string;
  light: ThemeTone;
  dark: ThemeTone;
}

export const COLOR_THEMES: Record<ColorThemeId, ColorTheme> = {
  'arctic-white': {
    name: 'Arctic White',
    swatch: '#F4F6F8',
    light: { desk: '#E9EDF2', accent: '#1C1C1E', accentForeground: '#FFFFFF' },
    dark: { desk: '#101216', accent: '#E6EAF0', accentForeground: '#101216' },
  },
  'midnight-black': {
    name: 'Midnight Black',
    swatch: '#0B0B0D',
    light: { desk: '#E4E4E7', accent: '#18181B', accentForeground: '#FFFFFF' },
    dark: { desk: '#000000', accent: '#F4F4F5', accentForeground: '#09090B' },
  },
  'macos-silver': {
    name: 'macOS Silver',
    swatch: '#C9CDD3',
    light: { desk: '#E3E6EA', accent: '#5B6470', accentForeground: '#FFFFFF' },
    dark: { desk: '#1A1C20', accent: '#AEB6C2', accentForeground: '#111318' },
  },
  'warm-paper': {
    name: 'Warm Paper',
    swatch: '#E9DCC4',
    light: { desk: '#F3EADA', accent: '#8A5A2B', accentForeground: '#FFFFFF' },
    dark: { desk: '#1B1712', accent: '#E0B97F', accentForeground: '#1B1712' },
  },
  'lavender-mist': {
    name: 'Lavender Mist',
    swatch: '#C9B8E8',
    light: { desk: '#EEE9F7', accent: '#6D4FB3', accentForeground: '#FFFFFF' },
    dark: { desk: '#15121D', accent: '#C4B5FD', accentForeground: '#15121D' },
  },
  'ocean-blue': {
    name: 'Ocean Blue',
    swatch: '#0E7490',
    light: { desk: '#E0F0F5', accent: '#0E6A86', accentForeground: '#FFFFFF' },
    dark: { desk: '#0B1820', accent: '#67C8E0', accentForeground: '#0B1820' },
  },
  'forest-green': {
    name: 'Forest Green',
    swatch: '#2F6B4A',
    light: { desk: '#E3EEE6', accent: '#2F6B4A', accentForeground: '#FFFFFF' },
    dark: { desk: '#0D1510', accent: '#7CC79A', accentForeground: '#0D1510' },
  },
  'rose-quartz': {
    name: 'Rose Quartz',
    swatch: '#E8B4BC',
    light: { desk: '#F6E6E9', accent: '#A8475F', accentForeground: '#FFFFFF' },
    dark: { desk: '#1C1214', accent: '#F0A9B8', accentForeground: '#1C1214' },
  },
};
