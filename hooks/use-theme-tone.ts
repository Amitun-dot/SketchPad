import { COLOR_THEMES, type ThemeTone } from '@/lib/sketch/themes';
import { selectIsDark, useSketchStore } from '@/lib/store/sketch-store';

export function useThemeTone(): ThemeTone {
  const colorTheme = useSketchStore((state) => state.preferences.colorTheme);
  const isDark = useSketchStore(selectIsDark);
  const theme = COLOR_THEMES[colorTheme];
  return isDark ? theme.dark : theme.light;
}
