import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from './theme-provider';

// Mock next-themes
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children, ...props }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider" data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
}));

describe('ThemeProvider', () => {
  it('should render children', () => {
    const { getByText } = render(
      <ThemeProvider>
        <div>Test Content</div>
      </ThemeProvider>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('should pass correct props to next-themes ThemeProvider', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    );

    const provider = getByTestId('theme-provider');
    const props = JSON.parse(provider.getAttribute('data-props') || '{}');

    expect(props.attribute).toBe('class');
    expect(props.defaultTheme).toBe('dark');
    expect(props.enableSystem).toBe(false);
    expect(props.storageKey).toBe('swimlanes-theme');
  });

  it('should allow overriding props', () => {
    const { getByTestId } = render(
      <ThemeProvider defaultTheme="light" enableSystem={true}>
        <div>Test</div>
      </ThemeProvider>
    );

    const provider = getByTestId('theme-provider');
    const props = JSON.parse(provider.getAttribute('data-props') || '{}');

    expect(props.defaultTheme).toBe('light');
    expect(props.enableSystem).toBe(true);
  });
});
