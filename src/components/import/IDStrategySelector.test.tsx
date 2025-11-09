/**
 * Tests for IDStrategySelector component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IDStrategySelector } from './IDStrategySelector';

describe('IDStrategySelector', () => {
  const mockHeaders = ['Issue Key', 'Summary', 'Type', 'Assignee'];
  const mockOnStrategyChange = vi.fn();
  const mockOnIdColumnChange = vi.fn();

  it('should render all three ID strategies', () => {
    render(
      <IDStrategySelector
        strategy="generate"
        onStrategyChange={mockOnStrategyChange}
        headers={mockHeaders}
        onIdColumnChange={mockOnIdColumnChange}
      />
    );

    expect(screen.getByText('Generate UUIDs')).toBeInTheDocument();
    expect(screen.getByText('Use Column as ID')).toBeInTheDocument();
    expect(screen.getByText('Match by Project + Title')).toBeInTheDocument();
  });

  it('should show selected strategy', () => {
    render(
      <IDStrategySelector
        strategy="generate"
        onStrategyChange={mockOnStrategyChange}
        headers={mockHeaders}
        onIdColumnChange={mockOnIdColumnChange}
      />
    );

    const generateRadio = screen.getByRole('radio', { name: /Generate UUIDs/i });
    expect(generateRadio).toBeChecked();
  });

  it('should show ID column selector when column strategy is selected', () => {
    render(
      <IDStrategySelector
        strategy="column"
        onStrategyChange={mockOnStrategyChange}
        headers={mockHeaders}
        idColumn="Issue Key"
        onIdColumnChange={mockOnIdColumnChange}
      />
    );

    expect(screen.getByText('ID Column')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should not show ID column selector for other strategies', () => {
    const { rerender } = render(
      <IDStrategySelector
        strategy="generate"
        onStrategyChange={mockOnStrategyChange}
        headers={mockHeaders}
        onIdColumnChange={mockOnIdColumnChange}
      />
    );

    expect(screen.queryByText('ID Column')).not.toBeInTheDocument();

    rerender(
      <IDStrategySelector
        strategy="match"
        onStrategyChange={mockOnStrategyChange}
        headers={mockHeaders}
        onIdColumnChange={mockOnIdColumnChange}
      />
    );

    expect(screen.queryByText('ID Column')).not.toBeInTheDocument();
  });

  it('should call onStrategyChange when strategy is changed', async () => {
    const user = userEvent.setup();
    render(
      <IDStrategySelector
        strategy="generate"
        onStrategyChange={mockOnStrategyChange}
        headers={mockHeaders}
        onIdColumnChange={mockOnIdColumnChange}
      />
    );

    const columnRadio = screen.getByRole('radio', { name: /Use Column as ID/i });
    await user.click(columnRadio);

    expect(mockOnStrategyChange).toHaveBeenCalledWith('column');
  });

  it('should show validation error when column strategy selected but no column chosen', () => {
    render(
      <IDStrategySelector
        strategy="column"
        onStrategyChange={mockOnStrategyChange}
        headers={mockHeaders}
        onIdColumnChange={mockOnIdColumnChange}
      />
    );

    expect(screen.getByText('ID column is required')).toBeInTheDocument();
  });

  it('should not show error when column is selected', () => {
    render(
      <IDStrategySelector
        strategy="column"
        onStrategyChange={mockOnStrategyChange}
        headers={mockHeaders}
        idColumn="Issue Key"
        onIdColumnChange={mockOnIdColumnChange}
      />
    );

    expect(screen.queryByText('ID column is required')).not.toBeInTheDocument();
  });

  it('should disable controls when disabled prop is true', () => {
    render(
      <IDStrategySelector
        strategy="generate"
        onStrategyChange={mockOnStrategyChange}
        headers={mockHeaders}
        onIdColumnChange={mockOnIdColumnChange}
        disabled={true}
      />
    );

    const generateRadio = screen.getByRole('radio', { name: /Generate UUIDs/i });
    expect(generateRadio).toBeDisabled();
  });
});
