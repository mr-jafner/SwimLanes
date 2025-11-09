/**
 * Tests for ColumnMapper component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ColumnMapper } from './ColumnMapper';

describe('ColumnMapper', () => {
  const mockHeaders = ['Issue Key', 'Summary', 'Type', 'Assignee', 'Labels'];
  const mockOnMappingChange = vi.fn();

  it('should render all field mappings', () => {
    render(
      <ColumnMapper headers={mockHeaders} mapping={{}} onMappingChange={mockOnMappingChange} />
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.getByText('Lane')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('should show required badges for title and type', () => {
    render(
      <ColumnMapper headers={mockHeaders} mapping={{}} onMappingChange={mockOnMappingChange} />
    );

    const requiredBadges = screen.getAllByText('Required');
    expect(requiredBadges).toHaveLength(2); // Title and Type
  });

  it('should show incomplete status when required fields are not mapped', () => {
    render(
      <ColumnMapper headers={mockHeaders} mapping={{}} onMappingChange={mockOnMappingChange} />
    );

    expect(screen.getByText('Incomplete')).toBeInTheDocument();
  });

  it('should show ready status when required fields are mapped', () => {
    render(
      <ColumnMapper
        headers={mockHeaders}
        mapping={{
          title: 'Summary',
          type: 'Type',
        }}
        onMappingChange={mockOnMappingChange}
      />
    );

    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('should show mapped badge for mapped fields', () => {
    render(
      <ColumnMapper
        headers={mockHeaders}
        mapping={{
          title: 'Summary',
          type: 'Type',
          owner: 'Assignee',
        }}
        onMappingChange={mockOnMappingChange}
      />
    );

    const mappedBadges = screen.getAllByText('Mapped');
    expect(mappedBadges.length).toBeGreaterThan(0);
  });

  it('should show tags delimiter selector when tags field is mapped', () => {
    render(
      <ColumnMapper
        headers={mockHeaders}
        mapping={{
          tags: 'Labels',
        }}
        onMappingChange={mockOnMappingChange}
      />
    );

    expect(screen.getByText('Tags Delimiter')).toBeInTheDocument();
  });

  it('should not show tags delimiter selector when tags field is not mapped', () => {
    render(
      <ColumnMapper headers={mockHeaders} mapping={{}} onMappingChange={mockOnMappingChange} />
    );

    expect(screen.queryByText('Tags Delimiter')).not.toBeInTheDocument();
  });

  it('should show error message when required fields are not mapped', () => {
    render(
      <ColumnMapper headers={mockHeaders} mapping={{}} onMappingChange={mockOnMappingChange} />
    );

    expect(screen.getByText(/Required fields must be mapped/i)).toBeInTheDocument();
  });

  it('should display field count', () => {
    render(
      <ColumnMapper
        headers={mockHeaders}
        mapping={{
          title: 'Summary',
          type: 'Type',
          owner: 'Assignee',
        }}
        onMappingChange={mockOnMappingChange}
      />
    );

    expect(screen.getByText(/Mapped 3 of 8 fields/i)).toBeInTheDocument();
  });

  it('should disable selects when disabled prop is true', () => {
    render(
      <ColumnMapper
        headers={mockHeaders}
        mapping={{}}
        onMappingChange={mockOnMappingChange}
        disabled={true}
      />
    );

    const selects = screen.getAllByRole('combobox');
    selects.forEach((select) => {
      expect(select).toHaveAttribute('data-disabled');
    });
  });
});
