/**
 * lib/api/authEvents.js
 *
 * FIXED: expo does not export EventEmitter.
 * Use a simple pub/sub instead — works in all RN environments.
 */

const _listeners = new Map();

export const authEvents = {
  on(event, fn) {
    if (!_listeners.has(event)) _listeners.set(event, new Set());
    _listeners.get(event).add(fn);
    // Return unsubscribe function
    return () => _listeners.get(event)?.delete(fn);
  },

  emit(event, payload) {
    _listeners.get(event)?.forEach((fn) => {
      try {
        fn(payload);
      } catch {}
    });
  },

  off(event, fn) {
    _listeners.get(event)?.delete(fn);
  },
};

// Usage:
//   authEvents.on('logout', () => router.replace('/login'))
//   authEvents.emit('logout')
