// constants/theme.ts
// MUVIA — Light & Dark theme palettes

export interface ThemeColors {
  bg: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  accent: string;
  border: string;
  inputBg: string;
  tabBar: string;
  tabBarInactive: string;
  statusBar: string;
  overlay: string;
  danger: string;
  dangerBg: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
}

export const lightTheme: ThemeColors = {
  bg: '#F7FAFC',
  card: '#FFFFFF',
  text: '#1A202C',
  textSecondary: '#718096',
  textMuted: '#A0AEC0',
  primary: '#1A365D',
  primaryLight: '#EBF4FF',
  accent: '#2A69AC',
  border: '#E2E8F0',
  inputBg: '#F7FAFC',
  tabBar: '#1A365D',
  tabBarInactive: 'rgba(255,255,255,0.4)',
  statusBar: '#1A365D',
  overlay: 'rgba(0,0,0,0.5)',
  danger: '#C53030',
  dangerBg: '#FFF5F5',
  success: '#276749',
  successBg: '#F0FFF4',
  warning: '#D69E2E',
  warningBg: '#FEFCBF',
};

export const darkTheme: ThemeColors = {
  bg: '#0D1117',
  card: '#161B22',
  text: '#E6EDF3',
  textSecondary: '#8B949E',
  textMuted: '#484F58',
  primary: '#58A6FF',
  primaryLight: '#1C2D41',
  accent: '#79C0FF',
  border: '#30363D',
  inputBg: '#21262D',
  tabBar: '#161B22',
  tabBarInactive: 'rgba(255,255,255,0.3)',
  statusBar: '#0D1117',
  overlay: 'rgba(0,0,0,0.7)',
  danger: '#F85149',
  dangerBg: '#2D1B1E',
  success: '#3FB950',
  successBg: '#1B2D1F',
  warning: '#D29922',
  warningBg: '#2D2813',
};

export function getTheme(mode: 'light' | 'dark'): ThemeColors {
  return mode === 'dark' ? darkTheme : lightTheme;
}
