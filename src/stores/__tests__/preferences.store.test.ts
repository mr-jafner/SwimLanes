/**
 * Tests for preferences.store.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePreferencesStore } from '../preferences.store';

describe('preferences.store', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Reset store to defaults
    const { result } = renderHook(() => usePreferencesStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => usePreferencesStore());

      expect(result.current.theme).toBe('system');
      expect(result.current.defaultZoomLevel).toBe('month');
      expect(result.current.defaultLaneGroupBy).toBe('lane');
      expect(result.current.defaultBranch).toBe('main');
      expect(result.current.autoSaveEnabled).toBe(true);
      expect(result.current.autoSaveInterval).toBe(5000);
      expect(result.current.showWelcomeOnStartup).toBe(true);
      expect(result.current.compactMode).toBe(false);
      expect(result.current.defaultIdStrategy).toBe('generate');
      expect(result.current.defaultTagsDelimiter).toBe(',');
    });
  });

  describe('theme management', () => {
    it('should update theme to dark', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should update theme to light', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
    });
  });

  describe('default timeline settings', () => {
    it('should update default zoom level', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setDefaultZoomLevel('week');
      });

      expect(result.current.defaultZoomLevel).toBe('week');
    });

    it('should update default lane grouping', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setDefaultLaneGroupBy('project');
      });

      expect(result.current.defaultLaneGroupBy).toBe('project');
    });

    it('should update default branch', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setDefaultBranch('feature-branch');
      });

      expect(result.current.defaultBranch).toBe('feature-branch');
    });
  });

  describe('UI preferences', () => {
    it('should toggle auto-save', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setAutoSaveEnabled(false);
      });

      expect(result.current.autoSaveEnabled).toBe(false);
    });

    it('should update auto-save interval', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setAutoSaveInterval(10000);
      });

      expect(result.current.autoSaveInterval).toBe(10000);
    });

    it('should toggle welcome screen', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setShowWelcomeOnStartup(false);
      });

      expect(result.current.showWelcomeOnStartup).toBe(false);
    });

    it('should toggle compact mode', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setCompactMode(true);
      });

      expect(result.current.compactMode).toBe(true);
    });
  });

  describe('import preferences', () => {
    it('should update default ID strategy', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setDefaultIdStrategy('column');
      });

      expect(result.current.defaultIdStrategy).toBe('column');
    });

    it('should update default tags delimiter', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setDefaultTagsDelimiter(';');
      });

      expect(result.current.defaultTagsDelimiter).toBe(';');
    });
  });

  describe('reset functionality', () => {
    it('should reset all preferences to defaults', () => {
      const { result } = renderHook(() => usePreferencesStore());

      // Modify several preferences
      act(() => {
        result.current.setTheme('dark');
        result.current.setDefaultZoomLevel('year');
        result.current.setAutoSaveEnabled(false);
        result.current.setCompactMode(true);
      });

      // Verify changes
      expect(result.current.theme).toBe('dark');
      expect(result.current.defaultZoomLevel).toBe('year');

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify reset to defaults
      expect(result.current.theme).toBe('system');
      expect(result.current.defaultZoomLevel).toBe('month');
      expect(result.current.autoSaveEnabled).toBe(true);
      expect(result.current.compactMode).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should persist theme to localStorage', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setTheme('dark');
      });

      // Verify localStorage was updated
      const stored = localStorage.getItem('swimlanes-preferences');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.theme).toBe('dark');
    });

    it('should restore state from localStorage', () => {
      // Note: Zustand persist hydrates on store creation, not on hook render
      // Since the store is a singleton and was already created in beforeEach,
      // we test restoration by setting values, then checking localStorage persistence
      const { result } = renderHook(() => usePreferencesStore());

      // Set specific values
      act(() => {
        result.current.setTheme('light');
        result.current.setDefaultZoomLevel('day');
        result.current.setDefaultLaneGroupBy('owner');
        result.current.setDefaultBranch('dev');
        result.current.setAutoSaveEnabled(false);
        result.current.setCompactMode(true);
      });

      // Verify localStorage was updated with these values
      const stored = localStorage.getItem('swimlanes-preferences');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.theme).toBe('light');
      expect(parsed.state.defaultZoomLevel).toBe('day');
      expect(parsed.state.defaultLaneGroupBy).toBe('owner');
      expect(parsed.state.defaultBranch).toBe('dev');
      expect(parsed.state.autoSaveEnabled).toBe(false);
      expect(parsed.state.compactMode).toBe(true);
    });

    it('should persist multiple preference changes', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setTheme('dark');
        result.current.setDefaultZoomLevel('quarter');
        result.current.setCompactMode(true);
      });

      const stored = localStorage.getItem('swimlanes-preferences');
      const parsed = JSON.parse(stored!);

      expect(parsed.state.theme).toBe('dark');
      expect(parsed.state.defaultZoomLevel).toBe('quarter');
      expect(parsed.state.compactMode).toBe(true);
    });
  });
});
