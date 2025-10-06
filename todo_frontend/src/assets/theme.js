export const theme = {
  name: 'Ocean Professional',
  colors: {
    primary: '#EC4899',
    secondary: '#8B5CF6',
    success: '#10B981',
    error: '#EF4444',
    background: '#FDF2F8',
    surface: '#FFFFFF',
    text: '#374151'
  },
  gradient: 'linear-gradient(135deg,#fce7f3,#e9d5ff 40%,#dbeafe)',
  accents: ['primary','secondary','#06b6d4','#f59e0b','#84cc16']
};

// PUBLIC_INTERFACE
export function applyTheme(root = document.documentElement, { theme: mode = 'light', accent = 'primary' } = {}) {
  /** Apply data-theme and accent color tokens to the document root.
   * Params:
   * - root: HTMLElement to apply styles on (defaults to document.documentElement)
   * - { theme: 'light'|'dark', accent: 'primary'|'secondary'|CSSColor }
   */
  root.setAttribute('data-theme', mode);
  const accentVal =
    accent === 'primary' ? theme.colors.primary :
    accent === 'secondary' ? theme.colors.secondary :
    accent;
  root.style.setProperty('--accent', accentVal);
}
