//
// Utility: ID generation helpers
//

// PUBLIC_INTERFACE
export function generateId() {
  /**
   * Generate a unique identifier string.
   * Uses crypto.randomUUID when available for RFC4122 UUID v4.
   * Fallback: timestamp + random segment, ensuring low collision probability.
   *
   * @returns {string} A unique identifier string.
   */
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (_err) {
    // Ignore and fall back
  }

  // Fallback: time-based with random component
  const ts = Date.now().toString(36);
  const rnd = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
  return `${ts}-${rnd}`;
}

export default generateId;
