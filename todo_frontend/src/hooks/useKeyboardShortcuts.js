import { useEffect, useRef } from 'react';

/**
 * PUBLIC_INTERFACE
 * useKeyboardShortcuts - Global keydown listener for common app shortcuts.
 * Features:
 * - Enter: trigger addTask from TaskInput (when focus is not in a textarea/select and not composing)
 * - Escape: cancel edit or close SettingsPanel via cancelEdit/closeSettings
 * - Ctrl/Cmd + F: focus filters control/root
 * - ?: toggle help tooltip (optional)
 *
 * Behavior:
 * - Respects focused inputs/contenteditable: does not interfere with normal typing unless matching explicit combo
 * - Supports Mac (metaKey) and Windows/Linux (ctrlKey) modifiers
 * - Cleans up event listener on unmount
 *
 * Params:
 * - opts: {
 *     addTask?: () => void,
 *     cancelEdit?: () => void,
 *     closeSettings?: () => void,
 *     focusFilters?: () => void,
 *     toggleHelp?: () => void,
 *     enabled?: boolean,
 *   }
 * - deps?: any[] - dependency list to rebind handlers when callbacks change
 *
 * Returns:
 * - disposer: () => void - manual cleanup (typically not needed, auto cleanup happens on unmount)
 */
// PUBLIC_INTERFACE
export default function useKeyboardShortcuts(opts = {}, deps = []) {
  const {
    addTask,
    cancelEdit,
    closeSettings,
    focusFilters,
    toggleHelp,
    enabled = true,
  } = opts;

  // Keep stable ref to current options so the handler closure can read latest values.
  const optionsRef = useRef(opts);
  optionsRef.current = { addTask, cancelEdit, closeSettings, focusFilters, toggleHelp, enabled };

  useEffect(() => {
    if (!enabled) return;

    const isEditableElement = (el) => {
      if (!el) return false;
      const tag = (el.tagName || '').toLowerCase();
      const editable = el.getAttribute && el.getAttribute('contenteditable');
      if (editable === '' || editable === 'true') return true;
      // Inputs that accept free text; exclude buttons
      const textInputs = ['input', 'textarea'];
      if (textInputs.includes(tag)) {
        const type = (el.getAttribute('type') || '').toLowerCase();
        // treat non-text input types as not free-typing, except we still allow Ctrl/Cmd+F to override
        const nonText = ['button', 'checkbox', 'radio', 'range', 'color', 'file', 'submit', 'reset', 'image', 'hidden'];
        return !nonText.includes(type);
      }
      return false;
    };

    const handler = (e) => {
      const {
        addTask: onAddTask,
        cancelEdit: onCancelEdit,
        closeSettings: onCloseSettings,
        focusFilters: onFocusFilters,
        toggleHelp: onToggleHelp,
      } = optionsRef.current;

      // Avoid handling when IME composing
      if (e.isComposing) return;

      const active = typeof document !== 'undefined' ? document.activeElement : null;
      const inEditable = isEditableElement(active);

      // Ctrl/Cmd + F => Focus filters (always intercept to help users quickly find filters)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        if (onFocusFilters) {
          e.preventDefault();
          onFocusFilters();
          return;
        }
      }

      // ? to toggle help (Shift+/ on many keyboards)
      // Normalize: '?' key yields key='?' in many layouts, or key='/' with shiftKey
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        if (onToggleHelp) {
          // Do not fire when user is typing in an editable field
          if (!inEditable) {
            e.preventDefault();
            onToggleHelp();
            return;
          }
        }
      }

      // Escape => cancel edit or close settings
      if (e.key === 'Escape' || e.key === 'Esc') {
        // If the active element is inside a dialog or an input, Esc should be honored
        // and we provide a hook to cancel or close.
        if (onCancelEdit) {
          e.preventDefault();
          onCancelEdit();
          return;
        }
        if (onCloseSettings) {
          e.preventDefault();
          onCloseSettings();
          return;
        }
      }

      // Enter => add task when not typing multiline content
      if (e.key === 'Enter') {
        // If focused in a textarea or contenteditable, do not hijack Enter
        const tag = (active?.tagName || '').toLowerCase();
        const isTextarea = tag === 'textarea';
        const isSelect = tag === 'select';
        if (!isTextarea && !isSelect && onAddTask) {
          // If user is in an input[type=text] inside TaskInput, normal submit occurs from form,
          // but this shortcut enables quick-add when focus is elsewhere.
          if (!inEditable) {
            e.preventDefault();
            onAddTask();
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handler, { capture: true });
    return () => {
      window.removeEventListener('keydown', handler, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  // Return a no-op disposer with the same interface for future extensibility.
  const disposer = () => {
    // All cleanup is handled in the effect return; manual dispose not required.
  };
  return disposer;
}
