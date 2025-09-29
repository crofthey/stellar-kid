import type { BackgroundPattern } from '@shared/types';

export interface WallpaperOption {
  id: BackgroundPattern;
  name: string;
  description: string;
  lightPattern: string;
  darkPattern: string;
  tileSize: string;
  lightOverlay: string;
  darkOverlay: string;
  lightRadial: string;
  darkRadial: string;
  accentClass: string;
}

export const WALLPAPER_OPTIONS: WallpaperOption[] = [
  {
    id: 'confetti',
    name: 'Confetti Party',
    description: 'Bright sprinkles for celebrations.',
    lightPattern: "/patterns/wallpaper-confetti-light.svg",
    darkPattern: "/patterns/wallpaper-confetti-dark.svg",
    tileSize: '180px 180px',
    lightOverlay: 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.45) 35%, rgba(255,255,255,0) 100%)',
    darkOverlay: 'linear-gradient(180deg, rgba(17,24,39,0.85) 0%, rgba(17,24,39,0.55) 40%, rgba(17,24,39,0) 100%)',
    lightRadial: 'radial-gradient(circle at top, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 65%)',
    darkRadial: 'radial-gradient(circle at top, rgba(17,24,39,0.7) 0%, rgba(17,24,39,0) 65%)',
    accentClass: 'ring-stellar-blue',
  },
  {
    id: 'rainbow',
    name: 'Rainbow Sky',
    description: 'Soft rainbows and clouds overhead.',
    lightPattern: "/patterns/wallpaper-rainbow-light.svg",
    darkPattern: "/patterns/wallpaper-rainbow-dark.svg",
    tileSize: '220px 220px',
    lightOverlay: 'linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0) 100%)',
    darkOverlay: 'linear-gradient(180deg, rgba(30,41,59,0.88) 0%, rgba(30,41,59,0.5) 45%, rgba(30,41,59,0) 100%)',
    lightRadial: 'radial-gradient(circle at top, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 60%)',
    darkRadial: 'radial-gradient(circle at top, rgba(30,41,59,0.75) 0%, rgba(30,41,59,0) 60%)',
    accentClass: 'ring-pink-400',
  },
  {
    id: 'meadow',
    name: 'Sunny Meadow',
    description: 'Cheerful flowers swaying in the breeze.',
    lightPattern: "/patterns/wallpaper-meadow-light.svg",
    darkPattern: "/patterns/wallpaper-meadow-dark.svg",
    tileSize: '200px 200px',
    lightOverlay: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0) 100%)',
    darkOverlay: 'linear-gradient(180deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.45) 45%, rgba(15,23,42,0) 100%)',
    lightRadial: 'radial-gradient(circle at top, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 60%)',
    darkRadial: 'radial-gradient(circle at top, rgba(15,23,42,0.7) 0%, rgba(15,23,42,0) 60%)',
    accentClass: 'ring-emerald-400',
  },
  {
    id: 'ocean',
    name: 'Ocean Adventure',
    description: 'Waves and sea friends ready to explore.',
    lightPattern: "/patterns/wallpaper-ocean-light.svg",
    darkPattern: "/patterns/wallpaper-ocean-dark.svg",
    tileSize: '210px 210px',
    lightOverlay: 'linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.42) 40%, rgba(255,255,255,0) 100%)',
    darkOverlay: 'linear-gradient(180deg, rgba(8,47,73,0.82) 0%, rgba(8,47,73,0.45) 45%, rgba(8,47,73,0) 100%)',
    lightRadial: 'radial-gradient(circle at top, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 60%)',
    darkRadial: 'radial-gradient(circle at top, rgba(8,47,73,0.7) 0%, rgba(8,47,73,0) 60%)',
    accentClass: 'ring-sky-400',
  },
];

export const WALLPAPER_LOOKUP = WALLPAPER_OPTIONS.reduce(
  (acc, option) => {
    acc[option.id] = option;
    return acc;
  },
  {} as Record<BackgroundPattern, WallpaperOption>
);
