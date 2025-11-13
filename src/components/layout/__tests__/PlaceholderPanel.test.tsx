import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlaceholderPanel } from '../PlaceholderPanel';

describe('PlaceholderPanel', () => {
  it('should render with title', () => {
    render(<PlaceholderPanel title="Test Feature" />);
    expect(screen.getByText('Test Feature')).toBeInTheDocument();
  });

  it('should render with custom description', () => {
    render(<PlaceholderPanel title="Test" description="Custom description text" />);
    expect(screen.getByText('Custom description text')).toBeInTheDocument();
  });

  it('should render with default description when not provided', () => {
    render(<PlaceholderPanel title="Test" />);
    expect(screen.getByText(/this feature is coming soon/i)).toBeInTheDocument();
  });

  it('should render construction icon', () => {
    const { container } = render(<PlaceholderPanel title="Test" />);
    // Check for lucide-react SVG icon
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should render future update message', () => {
    render(<PlaceholderPanel title="Test" />);
    expect(screen.getByText(/future update/i)).toBeInTheDocument();
  });

  it('should render stay tuned message', () => {
    render(<PlaceholderPanel title="Test" />);
    expect(screen.getByText(/stay tuned for more functionality/i)).toBeInTheDocument();
  });
});
