import { useEffect, useState } from 'react';
import './App.css';

type Entry = {
  id: string;
  name: string;
  baseIcon: string;
  badgeIcon?: string;
};

type Action = {
  id: string;
  name: string;
  icon: string;
};

type Theme = {
  id: 'classic' | 'modern-dark' | 'modern-light';
  label: string;
  style: 'classic' | 'modern';
  background: string;
  entries: Entry[];
  actions: Action[];
};

const themes: Theme[] = [
  {
    id: 'classic',
    label: 'Classic',
    style: 'classic',
    background: '/assets/bg-tonymac.png',
    entries: [
      {
        id: 'hfs',
        name: 'HFS',
        baseIcon: '/assets/vol_internal_hfs.png',
        badgeIcon: '/assets/os_lion.png'
      },
      {
        id: 'recovery',
        name: 'RECOVERY',
        baseIcon: '/assets/vol_internal_hfs.png',
        badgeIcon: '/assets/os_winxp.png'
      }
    ],
    actions: [
      { id: 'shell', name: 'UEFI Shell', icon: '/assets/tool_shell.png' },
      { id: 'clover', name: 'Clover Config', icon: '/assets/func_clover.png' },
      { id: 'about', name: 'About Clover', icon: '/assets/func_about.png' },
      { id: 'options', name: 'Options', icon: '/assets/func_options.png' },
      { id: 'reset', name: 'Reset', icon: '/assets/func_reset.png' },
      { id: 'shutdown', name: 'Shutdown', icon: '/assets/func_shutdown.png' }
    ]
  },
  {
    id: 'modern-dark',
    label: 'Modern Dark',
    style: 'modern',
    background: '/assets/bg-modern-dark.png',
    entries: [
      { id: 'mac', name: 'macOS', baseIcon: '/assets/modern-dark-os-mac.png' },
      { id: 'win', name: 'Windows', baseIcon: '/assets/modern-dark-os-win.png' }
    ],
    actions: [
      { id: 'shell', name: 'UEFI Shell', icon: '/assets/modern-dark-tool_shell.png' },
      { id: 'clover', name: 'Clover Config', icon: '/assets/modern-dark-func_clover.png' },
      { id: 'about', name: 'About Clover', icon: '/assets/modern-dark-func_about.png' },
      { id: 'options', name: 'Options', icon: '/assets/modern-dark-func_options.png' },
      { id: 'reset', name: 'Reset', icon: '/assets/modern-dark-func_reset.png' },
      { id: 'shutdown', name: 'Shutdown', icon: '/assets/modern-dark-func_shutdown.png' }
    ]
  },
  {
    id: 'modern-light',
    label: 'Modern Light',
    style: 'modern',
    background: '/assets/bg-modern-light.png',
    entries: [
      { id: 'mac', name: 'macOS', baseIcon: '/assets/modern-light-os-mac.png' },
      { id: 'win', name: 'Windows', baseIcon: '/assets/modern-light-os-win.png' }
    ],
    actions: [
      { id: 'shell', name: 'UEFI Shell', icon: '/assets/modern-light-tool_shell.png' },
      { id: 'clover', name: 'Clover Config', icon: '/assets/modern-light-func_clover.png' },
      { id: 'about', name: 'About Clover', icon: '/assets/modern-light-func_about.png' },
      { id: 'options', name: 'Options', icon: '/assets/modern-light-func_options.png' },
      { id: 'reset', name: 'Reset', icon: '/assets/modern-light-func_reset.png' },
      { id: 'shutdown', name: 'Shutdown', icon: '/assets/modern-light-func_shutdown.png' }
    ]
  }
];

export default function App() {
  const [themeId, setThemeId] = useState<Theme['id']>('classic');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [status, setStatus] = useState(`Boot ${themes[0].entries[0].name}`);
  const [activeRow, setActiveRow] = useState<'entries' | 'actions'>('entries');
  const [actionIndex, setActionIndex] = useState(0);

  const theme = themes.find((item) => item.id === themeId) ?? themes[0];
  const entries = theme.entries;
  const actions = theme.actions;

  useEffect(() => {
    setSelectedIndex(0);
    setActionIndex(0);
    setActiveRow('entries');
    const firstEntry = entries[0];
    if (firstEntry) {
      setStatus(`Boot ${firstEntry.name}`);
    }
  }, [themeId]);

  useEffect(() => {
    const entry = entries[selectedIndex] ?? entries[0];
    if (activeRow === 'entries') {
      setStatus(`Boot ${entry.name}`);
    }
  }, [selectedIndex, activeRow, themeId]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (activeRow === 'entries') {
          moveEntries(-1);
        } else {
          moveActions(-1);
        }
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (activeRow === 'entries') {
          moveEntries(1);
        } else {
          moveActions(1);
        }
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveRow('actions');
        const action = actions[actionIndex];
        setStatus(action.name);
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveRow('entries');
        const entry = entries[selectedIndex];
        setStatus(`Boot ${entry.name}`);
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        if (activeRow === 'entries') {
          const entry = entries[selectedIndex];
          setStatus(`Booting ${entry.name} ...`);
        } else {
          const action = actions[actionIndex];
          setStatus(action.name);
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIndex, activeRow, actionIndex, themeId]);

  const moveEntries = (delta: number) => {
    setSelectedIndex((current) => {
      const total = entries.length;
      return (current + delta + total) % total;
    });
  };

  const moveActions = (delta: number) => {
    setActionIndex((current) => {
      const total = actions.length;
      return (current + delta + total) % total;
    });
  };

  return (
    <div
      className={`tonymac-screen theme-${theme.id} ${theme.style === 'modern' ? 'modern' : 'classic'}`}
      style={{ backgroundImage: `url(${theme.background})` }}
    >
      <div className="logo">
        {theme.style === 'classic' ? (
          <img src="/assets/logo.png" alt="tonymacx86" />
        ) : (
          <img src="/assets/logo.png" alt="Clover" />
        )}
      </div>

      <div className="entries-row" role="listbox" aria-label="Boot entries">
        {entries.map((entry, index) => {
          const isSelected = index === selectedIndex;
          return (
            <button
              key={entry.id}
              className={`boot-entry ${isSelected ? 'selected' : ''} ${
                activeRow === 'actions' ? 'inactive' : ''
              } ${theme.style === 'modern' ? 'simple' : ''}`}
              onClick={() => {
                setActiveRow('entries');
                setSelectedIndex(index);
              }}
              aria-selected={isSelected}
            >
              <span className="entry-icon">
                <img src={entry.baseIcon} alt={entry.name} />
                {entry.badgeIcon ? (
                  <span className="badge">
                    <img src={entry.badgeIcon} alt={`${entry.name} badge`} />
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
              }}
              aria-label={action.name}
              title={action.name}
            >
              <img src={action.icon} alt="" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className="theme-row" aria-label="Theme toggle">
        {themes.map((item) => (
          <button
            key={item.id}
            className={`theme-btn ${item.id === themeId ? 'active' : ''}`}
            onClick={() => setThemeId(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="status-line">{status}</div>

      <div className="footer">
        <span>F1:Help</span>
        <span>Use ← → then Enter</span>
        <span>EFI/EFI/CLOVER</span>
      </div>
    </div>
  );
}
