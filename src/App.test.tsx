import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />);
    // Use level 1 heading to be specific
    const heading = screen.getByRole('heading', { level: 1, name: /swimlanes/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders all button variants section', () => {
    render(<App />);
    expect(screen.getByText(/button components/i)).toBeInTheDocument();
    // These buttons have more specific labels
    expect(screen.getByRole('button', { name: /^default$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^secondary$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^destructive$/i })).toBeInTheDocument();
  });

  it('renders dialog component section', () => {
    render(<App />);
    expect(screen.getByText(/dialog component/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open dialog/i })).toBeInTheDocument();
  });

  it('renders select component section', () => {
    render(<App />);
    expect(screen.getByText(/select component/i)).toBeInTheDocument();
  });

  it('renders toast notification section', () => {
    render(<App />);
    expect(screen.getByText(/toast notifications/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /default toast/i })).toBeInTheDocument();
  });

  it('renders SwimLanes custom colors section', () => {
    render(<App />);
    expect(screen.getByText(/swimlanes custom colors/i)).toBeInTheDocument();
    expect(screen.getByText(/task/i)).toBeInTheDocument();
    expect(screen.getByText(/milestone/i)).toBeInTheDocument();
    expect(screen.getByText(/release/i)).toBeInTheDocument();
    expect(screen.getByText(/meeting/i)).toBeInTheDocument();
  });

  it('opens dialog when button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    const openButton = screen.getByRole('button', { name: /open dialog/i });
    await user.click(openButton);

    // Dialog should be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/swimlanes dialog/i)).toBeInTheDocument();
  });
});
