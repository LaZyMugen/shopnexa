import { useTheme } from '../context/themeContext';

export default function ThemeToggle(){
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const toggle = () => setTheme(isDark ? 'light' : 'dark');

  // Animation styles
  const raysStyle = {
    opacity: isDark ? 0 : 1,
    transform: isDark ? 'scale(0.9) rotate(45deg)' : 'scale(1) rotate(0deg)',
    transformOrigin: 'center',
    transition: 'transform 420ms ease, opacity 300ms ease'
  };
  const cutoutStyle = {
    transform: `translateX(${isDark ? 9 : -20}px)`,
    transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)'
  };
  const coreStyle = {
    transform: isDark ? 'scale(0.98)' : 'scale(1)',
    transition: 'transform 420ms ease'
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/70 border border-white/30 text-slate-800 hover:bg-white/90 transition"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <mask id="moonMask">
            {/* Visible base */}
            <rect x="0" y="0" width="24" height="24" fill="white" />
            {/* Moving cutout to carve crescent */}
            <g style={cutoutStyle}>
              <circle cx="12" cy="12" r="9" fill="black" />
            </g>
          </mask>
        </defs>
        {/* Rays around (sun state) */}
        <g style={raysStyle} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <line x1="12" y1="3" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="21" />
          <line x1="3" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="21" y2="12" />
          <line x1="5.64" y1="5.64" x2="7.05" y2="7.05" />
          <line x1="16.95" y1="16.95" x2="18.36" y2="18.36" />
          <line x1="5.64" y1="18.36" x2="7.05" y2="16.95" />
          <line x1="16.95" y1="7.05" x2="18.36" y2="5.64" />
        </g>
        {/* Unlit disk (dark part) */}
        <circle cx="12" cy="12" r="6.8" fill={isDark ? 'var(--app-bg)' : 'currentColor'} opacity={isDark ? 1 : 0.28} />
        {/* Core that becomes moon via mask (lit crescent stays white in dark) */}
        <g style={coreStyle}>
          <circle cx="12" cy="12" r="6.8" fill={isDark ? '#ffffff' : 'currentColor'} mask="url(#moonMask)" />
        </g>
      </svg>
    </button>
  );
}
