import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Mock window.matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Suppress sql.js "Database closed" errors that occur during test cleanup
// These are harmless and occur when tests properly close databases
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('Database closed')) {
      event.preventDefault();
      return;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && String(event.reason).includes('Database closed')) {
      event.preventDefault();
      return;
    }
  });
}
