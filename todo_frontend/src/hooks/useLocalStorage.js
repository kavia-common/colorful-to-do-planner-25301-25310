import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * useLocalStorage - A robust, framework-agnostic React hook to persist state to localStorage with:
 * - Versioned schema support with migration
 * - Safe hydration in SSR/preview (guards window/localStorage)
 * - Debounced persistence to reduce write churn
 * - Pluggable serializer/deserializer
 * - Clear/reset method
 *
 * Typical persisted shape can include a `schemaVersion` or `version` field.
 *
 * @template T
 * @param {string} key - localStorage key under which to persist
 * @param {T | (() => T)} initialValue - initial state value or initializer function
 * @param {Object} [options]
 * @param {number} [options.version=1] - current schema version for persisted data
 * @param {(oldData: any, oldVersion: number) => T} [options.migrate] - migration function when version mismatch
 * @param {(value: any) => string} [options.serialize=JSON.stringify] - custom serializer
 * @param {(raw: string) => any} [options.deserialize=JSON.parse] - custom deserializer
 * @param {number} [options.debounceMs=300] - debounce duration for persistence
 * @returns {[T, React.Dispatch<React.SetStateAction<T>>] & { clear: () => void }}
 */
export function useLocalStorage(
  key,
  initialValue,
  {
    version = 1,
    migrate,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    debounceMs = 300
  } = {}
) {
  const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

  // keep refs for debounced persistence
  const valueRef = useRef();
  const timeoutRef = useRef(0);
  const mountedRef = useRef(false);

  // Hydration: read from localStorage once during init
  const [value, setValue] = useState(() => {
    if (!isBrowser) {
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    }
    try {
      const raw = window.localStorage.getItem(key);
      if (raw == null) {
        return typeof initialValue === 'function' ? initialValue() : initialValue;
      }

      // attempt parse
      let parsed = null;
      try {
        parsed = deserialize(raw);
      } catch (err) {
        // log and fallback to initial
        console.warn(`[useLocalStorage] Failed to parse for key "${key}":`, err);
        return typeof initialValue === 'function' ? initialValue() : initialValue;
      }

      // Determine versions
      const oldVersion = typeof parsed?.schemaVersion === 'number'
        ? parsed.schemaVersion
        : (typeof parsed?.version === 'number' ? parsed.version : undefined);

      if (oldVersion === undefined) {
        // If no version info, try migrate if provided; otherwise use parsed
        if (typeof migrate === 'function') {
          try {
            const migrated = migrate(parsed, 0);
            return migrated;
          } catch (err) {
            console.warn(`[useLocalStorage] Migration (no version) failed for key "${key}":`, err);
            return typeof initialValue === 'function' ? initialValue() : initialValue;
          }
        }
        return parsed;
      }

      if (oldVersion !== version && typeof migrate === 'function') {
        try {
          const migrated = migrate(parsed, oldVersion);
          return migrated;
        } catch (err) {
          console.warn(`[useLocalStorage] Migration failed for key "${key}" from v${oldVersion} -> v${version}:`, err);
          return typeof initialValue === 'function' ? initialValue() : initialValue;
        }
      }

      return parsed;
    } catch (err) {
      console.warn(`[useLocalStorage] Unexpected error during init for key "${key}":`, err);
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    }
  });

  // Update ref to latest value for debounced writes
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Debounced write effect
  useEffect(() => {
    mountedRef.current = true;
    // on mount persist the current state to ensure storage has migrated/initial value
    schedulePersist();
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const schedulePersist = useCallback(() => {
    if (!isBrowser) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      try {
        const current = valueRef.current;
        // If object-like and missing schemaVersion, add it non-destructively for convenience
        let toPersist = current;
        if (current && typeof current === 'object' && !Array.isArray(current)) {
          const hasSchema = Object.prototype.hasOwnProperty.call(current, 'schemaVersion') ||
            Object.prototype.hasOwnProperty.call(current, 'version');
          if (!hasSchema) {
            toPersist = { ...current, schemaVersion: version };
          }
        }
        const encoded = serialize(toPersist);
        window.localStorage.setItem(key, encoded);
      } catch (err) {
        console.warn(`[useLocalStorage] Persist error for key "${key}":`, err);
      }
    }, debounceMs);
  }, [debounceMs, isBrowser, key, serialize, version]);

  // Persist on value change with debounce
  useEffect(() => {
    if (!mountedRef.current) return;
    schedulePersist();
  }, [value, schedulePersist]);

  // stable setter that mirrors setState API
  const set = useCallback((update) => {
    setValue(prev => {
      const next = typeof update === 'function' ? update(prev) : update;
      return next;
    });
  }, []);

  // clear method to reset storage and state to initial
  const clear = useCallback(() => {
    try {
      if (isBrowser) {
        window.localStorage.removeItem(key);
      }
    } catch (err) {
      console.warn(`[useLocalStorage] Clear error for key "${key}":`, err);
    } finally {
      setValue(typeof initialValue === 'function' ? initialValue() : initialValue);
    }
  }, [initialValue, isBrowser, key]);

  // Return tuple with clear method attached (unit-friendly)
  const tuple = useMemo(() => {
    const res = [value, set];
    // attach clear method non-enumerable
    Object.defineProperty(res, 'clear', {
      value: clear,
      enumerable: false,
      writable: false,
    });
    return res;
  }, [value, set, clear]);

  return /** @type {any} */ (tuple);
}

/**
 * PUBLIC_INTERFACE
 * persistReducerState - Helper to persist a reducer state by dispatching a controlled action.
 * This is provided for future extensibility, e.g., if consumers want an explicit "persist" method
 * rather than implicit debounce. It does not perform IO directly; it's intended to be used
 * together with a reducer that knows how to handle persistence-related actions.
 *
 * Example usage:
 *   persistReducerState(dispatch, state)
 *
 * @param {(action: any) => void} dispatch - reducer dispatch function
 * @param {any} state - current state to persist
 */
export function persistReducerState(dispatch, state) {
  try {
    dispatch({ type: '__PERSIST_STATE__', payload: state });
  } catch (err) {
    // Do not throw in helper; only log to avoid breaking UI
    console.warn('[persistReducerState] Dispatch error:', err);
  }
}

export default useLocalStorage;
