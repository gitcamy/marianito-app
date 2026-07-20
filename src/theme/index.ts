export const colors = {
  maroon: '#6B0F1A',
  olive: '#4A5320',
  cream: '#EDEAE0',
  paleGreen: '#E4E9B2',
  blue: '#1E62F0',
  ink: '#1A1A14',
  terracotta: '#C4682D',
  peach: '#F4E3CF',

  // semantic (wireframes: warm cream ground, terracotta CTAs, peach card tints)
  background: '#F7F3EB',
  surface: '#EFE8DB',
  textPrimary: '#2A2620',
  textSecondary: '#8A8375',
  accent: '#C4682D',
  cta: '#C4682D',
  ctaText: '#FDFAF5',
  link: '#C4682D',
  badgeBg: '#F4E3CF',
  cardTint: '#F4E3CF',
  border: '#E2D9C8',
  danger: '#B0451F',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const type = {
  display: 'Fraunces_600SemiBold',
  displayLight: 'Fraunces_400Regular',
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
  },
} as const;

export const theme = { colors, space, radius, type };
export type Theme = typeof theme;
