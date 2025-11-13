import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

/**
 * ThemeProvider - Wrapper for next-themes with app-specific configuration
 *
 * Provides dark/light mode support throughout the application.
 * Theme state is persisted in localStorage automatically.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="swimlanes-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
