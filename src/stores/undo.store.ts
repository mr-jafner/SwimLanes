/**
 * Undo/redo state management store
 *
 * Manages action history for undo/redo functionality.
 * This is a minimal implementation for future feature development.
 *
 * Future enhancements:
 * - Integrate with item mutations (create, update, delete)
 * - Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)
 * - Persist undo history to session storage
 * - Add action merging (e.g., consecutive text edits)
 */

import { create } from 'zustand';

/**
 * Represents an action that can be undone/redone.
 */
export interface UndoAction {
  /** Action type identifier (e.g., 'create_item', 'update_item', 'delete_item') */
  type: string;

  /** Timestamp when action was performed */
  timestamp: string;

  /** Data needed to perform the action (forward) */
  data: unknown;

  /** Data needed to undo the action (reverse) */
  inverse: unknown;

  /** Optional description for debugging/UI */
  description?: string;
}

/**
 * Undo/redo state interface
 */
interface UndoState {
  // Undo/redo stacks
  undoStack: UndoAction[];
  redoStack: UndoAction[];

  // Limits
  maxStackSize: number;

  // Computed properties
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  pushAction: (action: UndoAction) => void;
  undo: () => UndoAction | null;
  redo: () => UndoAction | null;
  clear: () => void;
  setMaxStackSize: (size: number) => void;
}

/**
 * Default maximum stack size (50 actions)
 */
const DEFAULT_MAX_STACK_SIZE = 50;

/**
 * Undo/redo store
 *
 * Usage:
 * ```typescript
 * const { pushAction, undo, redo, canUndo, canRedo } = useUndoStore();
 *
 * // Push an action to undo stack
 * pushAction({
 *   type: 'create_item',
 *   timestamp: new Date().toISOString(),
 *   data: { item: newItem },
 *   inverse: { itemId: newItem.id }
 * });
 *
 * // Undo the last action
 * if (canUndo) {
 *   const action = undo();
 *   // Process the action's inverse data
 * }
 *
 * // Redo the last undone action
 * if (canRedo) {
 *   const action = redo();
 *   // Process the action's data
 * }
 * ```
 */
export const useUndoStore = create<UndoState>()((set, get) => ({
  // Initial state
  undoStack: [],
  redoStack: [],
  maxStackSize: DEFAULT_MAX_STACK_SIZE,
  canUndo: false,
  canRedo: false,

  /**
   * Push a new action to the undo stack.
   *
   * This clears the redo stack and enforces the max stack size limit.
   *
   * @param action - Action to add to undo history
   */
  pushAction: (action) => {
    set((state) => {
      const newUndoStack = [...state.undoStack, action];

      // Enforce max stack size
      if (newUndoStack.length > state.maxStackSize) {
        newUndoStack.shift(); // Remove oldest action
      }

      return {
        undoStack: newUndoStack,
        redoStack: [], // Clear redo stack when new action is pushed
        canUndo: true,
        canRedo: false,
      };
    });
  },

  /**
   * Undo the last action.
   *
   * Moves the last action from undo stack to redo stack and returns it.
   *
   * @returns The action that was undone, or null if undo stack is empty
   */
  undo: () => {
    const state = get();

    if (state.undoStack.length === 0) {
      return null;
    }

    const action = state.undoStack[state.undoStack.length - 1]!;
    const newUndoStack = state.undoStack.slice(0, -1);
    const newRedoStack = [...state.redoStack, action];

    set({
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      canUndo: newUndoStack.length > 0,
      canRedo: true,
    });

    return action;
  },

  /**
   * Redo the last undone action.
   *
   * Moves the last action from redo stack to undo stack and returns it.
   *
   * @returns The action that was redone, or null if redo stack is empty
   */
  redo: () => {
    const state = get();

    if (state.redoStack.length === 0) {
      return null;
    }

    const action = state.redoStack[state.redoStack.length - 1]!;
    const newRedoStack = state.redoStack.slice(0, -1);
    const newUndoStack = [...state.undoStack, action];

    set({
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      canUndo: true,
      canRedo: newRedoStack.length > 0,
    });

    return action;
  },

  /**
   * Clear both undo and redo stacks.
   */
  clear: () => {
    set({
      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,
    });
  },

  /**
   * Set the maximum stack size.
   *
   * If the new size is smaller than the current undo stack, older actions will be removed.
   *
   * @param size - New maximum stack size (must be > 0)
   */
  setMaxStackSize: (size) => {
    if (size <= 0) {
      throw new Error('Max stack size must be greater than 0');
    }

    set((state) => {
      let newUndoStack = state.undoStack;

      // Trim undo stack if it exceeds new size
      if (newUndoStack.length > size) {
        newUndoStack = newUndoStack.slice(newUndoStack.length - size);
      }

      return {
        maxStackSize: size,
        undoStack: newUndoStack,
        canUndo: newUndoStack.length > 0,
      };
    });
  },
}));
