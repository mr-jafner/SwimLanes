/**
 * Tests for undo.store.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoStore, type UndoAction } from '../undo.store';

const createMockAction = (type: string, description?: string): UndoAction => ({
  type,
  timestamp: new Date().toISOString(),
  data: { value: `${type}_data` },
  inverse: { value: `${type}_inverse` },
  description,
});

describe('undo.store', () => {
  beforeEach(() => {
    // Clear store before each test
    const { result } = renderHook(() => useUndoStore());
    act(() => {
      result.current.clear();
    });
  });

  describe('initialization', () => {
    it('should initialize with empty stacks', () => {
      const { result } = renderHook(() => useUndoStore());

      expect(result.current.undoStack).toEqual([]);
      expect(result.current.redoStack).toEqual([]);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.maxStackSize).toBe(50);
    });
  });

  describe('push action', () => {
    it('should add action to undo stack', () => {
      const { result } = renderHook(() => useUndoStore());
      const action = createMockAction('create_item');

      act(() => {
        result.current.pushAction(action);
      });

      expect(result.current.undoStack).toHaveLength(1);
      expect(result.current.undoStack[0]).toEqual(action);
      expect(result.current.canUndo).toBe(true);
    });

    it('should clear redo stack when pushing new action', () => {
      const { result } = renderHook(() => useUndoStore());
      const action1 = createMockAction('create_item');
      const action2 = createMockAction('update_item');

      // Push action, undo it (moves to redo stack)
      act(() => {
        result.current.pushAction(action1);
        result.current.undo();
      });

      expect(result.current.redoStack).toHaveLength(1);
      expect(result.current.canRedo).toBe(true);

      // Push new action - should clear redo stack
      act(() => {
        result.current.pushAction(action2);
      });

      expect(result.current.redoStack).toEqual([]);
      expect(result.current.canRedo).toBe(false);
    });

    it('should enforce max stack size', () => {
      const { result } = renderHook(() => useUndoStore());

      // Set small max size
      act(() => {
        result.current.setMaxStackSize(3);
      });

      // Push 5 actions
      act(() => {
        result.current.pushAction(createMockAction('action_1'));
        result.current.pushAction(createMockAction('action_2'));
        result.current.pushAction(createMockAction('action_3'));
        result.current.pushAction(createMockAction('action_4'));
        result.current.pushAction(createMockAction('action_5'));
      });

      // Should only keep last 3
      expect(result.current.undoStack).toHaveLength(3);
      expect(result.current.undoStack[0]?.type).toBe('action_3');
      expect(result.current.undoStack[2]?.type).toBe('action_5');
    });
  });

  describe('undo', () => {
    it('should undo last action', () => {
      const { result } = renderHook(() => useUndoStore());
      const action = createMockAction('create_item');

      act(() => {
        result.current.pushAction(action);
      });

      expect(result.current.undoStack).toHaveLength(1);

      let undoneAction: UndoAction | null = null;
      act(() => {
        undoneAction = result.current.undo();
      });

      expect(undoneAction).toEqual(action);
      expect(result.current.undoStack).toHaveLength(0);
      expect(result.current.redoStack).toHaveLength(1);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it('should return null if undo stack is empty', () => {
      const { result } = renderHook(() => useUndoStore());

      let undoneAction: UndoAction | null = null;
      act(() => {
        undoneAction = result.current.undo();
      });

      expect(undoneAction).toBe(null);
    });

    it('should handle multiple undos', () => {
      const { result } = renderHook(() => useUndoStore());
      const action1 = createMockAction('action_1');
      const action2 = createMockAction('action_2');
      const action3 = createMockAction('action_3');

      act(() => {
        result.current.pushAction(action1);
        result.current.pushAction(action2);
        result.current.pushAction(action3);
      });

      expect(result.current.undoStack).toHaveLength(3);

      // Undo first action
      let undoneAction: UndoAction | null = null;
      act(() => {
        undoneAction = result.current.undo();
      });

      expect(undoneAction).toEqual(action3);
      expect(result.current.undoStack).toHaveLength(2);

      // Undo second action
      act(() => {
        undoneAction = result.current.undo();
      });

      expect(undoneAction).toEqual(action2);
      expect(result.current.undoStack).toHaveLength(1);
    });
  });

  describe('redo', () => {
    it('should redo last undone action', () => {
      const { result } = renderHook(() => useUndoStore());
      const action = createMockAction('create_item');

      act(() => {
        result.current.pushAction(action);
        result.current.undo();
      });

      expect(result.current.redoStack).toHaveLength(1);

      let redoneAction: UndoAction | null = null;
      act(() => {
        redoneAction = result.current.redo();
      });

      expect(redoneAction).toEqual(action);
      expect(result.current.undoStack).toHaveLength(1);
      expect(result.current.redoStack).toHaveLength(0);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should return null if redo stack is empty', () => {
      const { result } = renderHook(() => useUndoStore());

      let redoneAction: UndoAction | null = null;
      act(() => {
        redoneAction = result.current.redo();
      });

      expect(redoneAction).toBe(null);
    });

    it('should handle multiple redos', () => {
      const { result } = renderHook(() => useUndoStore());
      const action1 = createMockAction('action_1');
      const action2 = createMockAction('action_2');

      act(() => {
        result.current.pushAction(action1);
        result.current.pushAction(action2);
        result.current.undo();
        result.current.undo();
      });

      expect(result.current.redoStack).toHaveLength(2);

      // Redo first action (action1 is on top of redo stack)
      let redoneAction: UndoAction | null = null;
      act(() => {
        redoneAction = result.current.redo();
      });

      expect(redoneAction).toEqual(action1);
      expect(result.current.redoStack).toHaveLength(1);

      // Redo second action (action2 is now on top)
      act(() => {
        redoneAction = result.current.redo();
      });

      expect(redoneAction).toEqual(action2);
      expect(result.current.redoStack).toHaveLength(0);
    });
  });

  describe('clear', () => {
    it('should clear both stacks', () => {
      const { result } = renderHook(() => useUndoStore());

      act(() => {
        result.current.pushAction(createMockAction('action_1'));
        result.current.pushAction(createMockAction('action_2'));
        result.current.undo();
      });

      expect(result.current.undoStack).toHaveLength(1);
      expect(result.current.redoStack).toHaveLength(1);

      act(() => {
        result.current.clear();
      });

      expect(result.current.undoStack).toHaveLength(0);
      expect(result.current.redoStack).toHaveLength(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('max stack size management', () => {
    it('should set max stack size', () => {
      const { result } = renderHook(() => useUndoStore());

      act(() => {
        result.current.setMaxStackSize(100);
      });

      expect(result.current.maxStackSize).toBe(100);
    });

    it('should throw error for invalid max stack size', () => {
      const { result } = renderHook(() => useUndoStore());

      expect(() => {
        act(() => {
          result.current.setMaxStackSize(0);
        });
      }).toThrow('Max stack size must be greater than 0');
    });

    it('should trim undo stack when reducing max size', () => {
      const { result } = renderHook(() => useUndoStore());

      act(() => {
        result.current.pushAction(createMockAction('action_1'));
        result.current.pushAction(createMockAction('action_2'));
        result.current.pushAction(createMockAction('action_3'));
        result.current.pushAction(createMockAction('action_4'));
      });

      expect(result.current.undoStack).toHaveLength(4);

      act(() => {
        result.current.setMaxStackSize(2);
      });

      expect(result.current.undoStack).toHaveLength(2);
      expect(result.current.undoStack[0]?.type).toBe('action_3');
      expect(result.current.undoStack[1]?.type).toBe('action_4');
    });
  });

  describe('computed properties', () => {
    it('should update canUndo correctly', () => {
      const { result } = renderHook(() => useUndoStore());

      expect(result.current.canUndo).toBe(false);

      act(() => {
        result.current.pushAction(createMockAction('action_1'));
      });

      expect(result.current.canUndo).toBe(true);

      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(false);
    });

    it('should update canRedo correctly', () => {
      const { result } = renderHook(() => useUndoStore());

      expect(result.current.canRedo).toBe(false);

      act(() => {
        result.current.pushAction(createMockAction('action_1'));
      });

      expect(result.current.canRedo).toBe(false);

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.redo();
      });

      expect(result.current.canRedo).toBe(false);
    });
  });
});
