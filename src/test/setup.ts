import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Global mock for ResizeObserver (used by Recharts in JSDOM)
if (typeof window !== 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
