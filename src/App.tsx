import { useEffect, useState } from 'react';
import './App.css';

// Types matching config.json structure
type ConfigEntry = {
  id: string;
  name: string;
  icon: string;
  badge?: string;
  url?: string;
};

type ConfigAction = {
  id: string;
  name: string;
  icon: string;
};

type ConfigTheme = {
  id: string;
  label: string;
  type: 'builtin' | 'clover';
  background: string;
  logo?: string;
  entries: ConfigEntry[];
  actions: ConfigAction[];
};

type Config = {
  defaultTheme: string;
  themes: ConfigTheme[];
  cloverThemes?: string[];
};

// Internal theme type with computed style
type Theme = ConfigTheme & {
  style: 'classic' | 'modern' | 'clover';
};

// Convert a Clover theme folder name to a Theme object
function buildCloverTheme(themeName: string): Theme {
  const basePath = `themes/${themeName}`;
  return {
    id: `clover-${themeName}`,
    label: themeName,
    type: 'clover',
    style: 'clover',
    background: `${basePath}/background.png`,
    logo: `${basePath}/icons/logo.png`,
    entries: [
      {
        id: 'macos',
        name: 'macOS',
        icon: `${basePath}/icons/os_mac.icns`,
        url: ''
      },
      {
        id: 'windows',
        name: 'Windows',
        icon: `${basePath}/icons/os_win.icns`,
        url: ''
      }
    ],
    actions: [
      { id: 'shell', name: 'UEFI Shell', icon: `${basePath}/icons/tool_shell.png` },
      { id: 'clover', name: 'Clover Config', icon: `${basePath}/icons/func_clover.png` },
      { id: 'about', name: 'About Clover', icon: `${basePath}/icons/func_about.png` },
      { id: 'options', name: 'Options', icon: `${basePath}/icons/func_options.png` },
      { id: 'reset', name: 'Reset', icon: `${basePath}/icons/func_reset.png` },
      { id: 'shutdown', name: 'Shutdown', icon: `${basePath}/icons/func_shutdown.png` }
    ]
  };
}

// Determine style from theme
function getThemeStyle(theme: ConfigTheme): 'classic' | 'modern' | 'clover' {
  if (theme.type === 'clover') return 'clover';
  if (theme.id === 'classic') return 'classic';
  return 'modern';
}

export default function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [themeId, setThemeId] = useState<string>('classic');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [status, setStatus] = useState('Loading...');
  const [activeRow, setActiveRow] = useState<'entries' | 'actions'>('entries');
  const [actionIndex, setActionIndex] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [optionIndex, setOptionIndex] = useState(0);

  // Load config on mount
  useEffect(() => {
    fetch('config.json')
      .then((res) => res.json())
      .then((data: Config) => {
        setConfig(data);

        // Build themes array from config
        const builtinThemes: Theme[] = data.themes.map((t) => ({
          ...t,
          style: getThemeStyle(t)
        }));

        // Add Clover themes if specified
        const cloverThemes: Theme[] = (data.cloverThemes || []).map(buildCloverTheme);

        const allThemes = [...builtinThemes, ...cloverThemes];
        setThemes(allThemes);

        // Set default theme
        const defaultId = data.defaultTheme || 'classic';
        setThemeId(defaultId);

        // Set initial status
        const defaultTheme = allThemes.find((t) => t.id === defaultId) || allThemes[0];
        if (defaultTheme?.entries[0]) {
          setStatus(`Boot ${defaultTheme.entries[0].name}`);
        }
      })
      .catch((err) => {
        console.error('Failed to load config:', err);
        setStatus('Failed to load config');
      });
  }, []);

  const theme = themes.find((item) => item.id === themeId) ?? themes[0];
  const entries = theme?.entries ?? [];
  const actions = theme?.actions ?? [];

  // Reset selection when theme changes
  useEffect(() => {
    if (!theme) return;
    setSelectedIndex(0);
    setActionIndex(0);
    setActiveRow('entries');
    const firstEntry = entries[0];
    if (firstEntry) {
      setStatus(`Boot ${firstEntry.name}`);
    }
  }, [themeId, themes.length]);

  // Update status when selection changes
  useEffect(() => {
    if (!theme) return;
    const entry = entries[selectedIndex] ?? entries[0];
    if (activeRow === 'entries' && entry) {
      setStatus(`Boot ${entry.name}`);
    }
  }, [selectedIndex, activeRow, themeId]);

  // Handle booting an entry (navigate to URL)
  const bootEntry = (entry: ConfigEntry) => {
    if (entry.url) {
      setStatus(`Booting ${entry.name} ...`);
      setTimeout(() => {
        window.location.href = entry.url!;
      }, 500);
    } else {
      setStatus(`Boot ${entry.name} (no URL configured)`);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!theme) return;

    const handleKey = (event: KeyboardEvent) => {
      // Handle options menu navigation
      if (showOptions) {
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setOptionIndex((current) => (current - 1 + themes.length) % themes.length);
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setOptionIndex((current) => (current + 1) % themes.length);
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          setThemeId(themes[optionIndex].id);
          setShowOptions(false);
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          setShowOptions(false);
        }
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (activeRow === 'entries') {
          setSelectedIndex((current) => (current - 1 + entries.length) % entries.length);
        } else {
          setActionIndex((current) => (current - 1 + actions.length) % actions.length);
        }
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (activeRow === 'entries') {
          setSelectedIndex((current) => (current + 1) % entries.length);
        } else {
          setActionIndex((current) => (current + 1) % actions.length);
        }
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveRow('actions');
        const action = actions[actionIndex];
        if (action) setStatus(action.name);
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveRow('entries');
        const entry = entries[selectedIndex];
        if (entry) setStatus(`Boot ${entry.name}`);
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        if (activeRow === 'entries') {
          const entry = entries[selectedIndex];
          if (entry) bootEntry(entry);
        } else {
          const action = actions[actionIndex];
          if (action?.id === 'options') {
            setShowOptions(true);
            setOptionIndex(themes.findIndex((t) => t.id === themeId));
          } else if (action) {
            setStatus(action.name);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIndex, activeRow, actionIndex, themeId, showOptions, optionIndex, themes, entries, actions]);

  // Loading state
  if (!theme) {
    return (
      <div className="tonymac-screen loading">
        <div className="status-line">{status}</div>
      </div>
    );
  }

  const themeStyle = theme.style === 'modern' ? 'modern' : theme.style === 'clover' ? 'clover' : 'classic';

  return (
    <div
      className={`tonymac-screen theme-${theme.id} ${themeStyle}`}
      style={{ backgroundImage: `url(${theme.background})` }}
    >
      <div className="logo">
        <img src={theme.logo || 'assets/logo.png'} alt="Bootloader" />
      </div>

      <div className="entries-row" role="listbox" aria-label="Boot entries">
        {entries.map((entry, index) => {
          const isSelected = index === selectedIndex;
          return (
            <button
              key={entry.id}
              className={`boot-entry ${isSelected ? 'selected' : ''} ${
                activeRow === 'actions' ? 'inactive' : ''
              } ${themeStyle === 'modern' ? 'simple' : ''}`}
              onClick={() => {
                setActiveRow('entries');
                setSelectedIndex(index);
              }}
              onDoubleClick={() => bootEntry(entry)}
              aria-selected={isSelected}
            >
              <span className="entry-icon">
                <img src={entry.icon} alt={entry.name} />
                {entry.badge ? (
                  <span className="badge">
                    <img src={entry.badge} alt={`${entry.name} badge`} />
                  </span>
                ) : null}
              </span>
              <span className="sr-only">{entry.name}</span>
            </button>
          );
        })}
      </div>

      <div className="actions-row" aria-label="Clover actions">
        {actions.map((action, index) => {
          const isSelected = activeRow === 'actions' && index === actionIndex;
          return (
            <button
              key={action.id}
              className={`action-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => {
                setActiveRow('actions');
                setActionIndex(index);
                setStatus(action.name);
                if (action.id === 'options') {
                  setShowOptions(true);
                  setOptionIndex(themes.findIndex((t) => t.id === themeId));
                }
              }}
              aria-label={action.name}
              title={action.name}
            >
              <img src={action.icon} alt="" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      {showOptions && (
        <div className="options-overlay" onClick={() => setShowOptions(false)}>
          <div className="options-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Options</h2>
            <div className="options-list">
              {themes.map((item, index) => (
                <button
                  key={item.id}
                  className={`option-item ${index === optionIndex ? 'selected' : ''} ${item.id === themeId ? 'active' : ''}`}
                  onClick={() => {
                    setThemeId(item.id);
                    setShowOptions(false);
                  }}
                >
                  {item.label}
                  {item.type === 'clover' && <span className="theme-badge">Clover</span>}
                  {item.id === themeId && <span className="checkmark">✓</span>}
                </button>
              ))}
            </div>
            <p className="options-hint">Use ↑↓ to navigate, Enter to select, Esc to close</p>
          </div>
        </div>
      )}

      <div className="status-line">{status}</div>

      <div className="footer">
        <span>F1:Help</span>
        <span>Use ← → then Enter to boot</span>
        <span>EFI/EFI/CLOVER</span>
      </div>
    </div>
  );
}
