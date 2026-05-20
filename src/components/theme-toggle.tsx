import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const current = theme === 'system' ? systemTheme : theme;
  const isDark = current === 'dark';

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex items-center gap-2"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {isDark ? 'Light' : 'Dark'}
    </Button>
  );
}
