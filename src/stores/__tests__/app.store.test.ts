/**
 * Tests for app.store.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '../app.store';

describe('app.store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { result } = renderHook(() => useAppStore());
    act(() => {
      result.current.setActiveTab('import');
      result.current.setInitialized(false);
      result.current.setInitializing(false);
      result.current.setInitError(null);
    });
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.isInitializing).toBe(false);
      expect(result.current.initError).toBe(null);
      expect(result.current.activeTab).toBe('import');
    });
  });

  describe('active tab management', () => {
    it('should update active tab to timeline', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setActiveTab('timeline');
      });

      expect(result.current.activeTab).toBe('timeline');
    });

    it('should update active tab to branches', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setActiveTab('branches');
      });

      expect(result.current.activeTab).toBe('branches');
    });

    it('should update active tab to history', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setActiveTab('history');
      });

      expect(result.current.activeTab).toBe('history');
    });

    it('should update active tab to export', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setActiveTab('export');
      });

      expect(result.current.activeTab).toBe('export');
    });
  });

  describe('initialization state management', () => {
    it('should set initializing state', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setInitializing(true);
      });

      expect(result.current.isInitializing).toBe(true);
      expect(result.current.isInitialized).toBe(false);
    });

    it('should set initialized state and clear initializing/error', () => {
      const { result } = renderHook(() => useAppStore());

      // First set initializing and error
      act(() => {
        result.current.setInitializing(true);
        result.current.setInitError('Test error');
      });

      // Then mark as initialized
      act(() => {
        result.current.setInitialized(true);
      });

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isInitializing).toBe(false);
      expect(result.current.initError).toBe(null);
    });

    it('should set initialization error and clear initialized/initializing', () => {
      const { result } = renderHook(() => useAppStore());

      // First set as initializing
      act(() => {
        result.current.setInitializing(true);
      });

      // Then set error
      act(() => {
        result.current.setInitError('Database connection failed');
      });

      expect(result.current.initError).toBe('Database connection failed');
      expect(result.current.isInitializing).toBe(false);
      expect(result.current.isInitialized).toBe(false);
    });

    it('should clear initialization error', () => {
      const { result } = renderHook(() => useAppStore());

      // Set error
      act(() => {
        result.current.setInitError('Some error');
      });

      expect(result.current.initError).toBe('Some error');

      // Clear error
      act(() => {
        result.current.setInitError(null);
      });

      expect(result.current.initError).toBe(null);
    });
  });

  describe('initialization workflow', () => {
    it('should handle successful initialization flow', () => {
      const { result } = renderHook(() => useAppStore());

      // Start initialization
      act(() => {
        result.current.setInitializing(true);
      });

      expect(result.current.isInitializing).toBe(true);
      expect(result.current.isInitialized).toBe(false);

      // Complete initialization
      act(() => {
        result.current.setInitialized(true);
      });

      expect(result.current.isInitializing).toBe(false);
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.initError).toBe(null);
    });

    it('should handle failed initialization flow', () => {
      const { result } = renderHook(() => useAppStore());

      // Start initialization
      act(() => {
        result.current.setInitializing(true);
      });

      expect(result.current.isInitializing).toBe(true);

      // Fail initialization
      act(() => {
        result.current.setInitError('Failed to load database');
      });

      expect(result.current.isInitializing).toBe(false);
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.initError).toBe('Failed to load database');
    });
  });
});
